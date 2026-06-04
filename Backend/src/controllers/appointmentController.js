const Appointment   = require('../models/Appointment');
const User          = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');

// ── helpers ──────────────────────────────────────────────────────────────────

// Map JS getDay() (0=Sun) to our day abbreviations
const JS_DAY_MAP = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Normalise any date to midnight UTC so comparisons are date-only.
 * appointmentDate is stored this way so "per day" queries are simple.
 */
function toDateOnly(d) {
  const dt = new Date(d);
  return new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()));
}

/** Start and end of a UTC day */
function dayRange(dateOnly) {
  const start = new Date(dateOnly);
  const end   = new Date(dateOnly);
  end.setUTCHours(23, 59, 59, 999);
  return { start, end };
}

function populate(query) {
  return query
    .populate('patient', 'name email')
    .populate('doctor',  'name email');
}

// ── Public: list doctors (for patient booking form) ──────────────────────────
exports.getDoctors = async (req, res, next) => {
  try {
    const doctors = await User.find({ role: 'doctor', isActive: true }).select('name email avatarUrl');
    // attach profile info
    const profiles = await DoctorProfile.find({ user: { $in: doctors.map((d) => d._id) } });
    const profileMap = {};
    profiles.forEach((p) => { profileMap[p.user.toString()] = p; });

    const result = doctors.map((d) => ({
      _id:              d._id,
      name:             d.name,
      email:            d.email,
      avatarUrl:        d.avatarUrl,
      specialization:   profileMap[d._id.toString()]?.specialization  || '',
      department:       profileMap[d._id.toString()]?.department       || '',
      availableDays:    profileMap[d._id.toString()]?.availableDays    || [],
      startTime:        profileMap[d._id.toString()]?.startTime        || '',
      endTime:          profileMap[d._id.toString()]?.endTime          || '',
      availableTime:    profileMap[d._id.toString()]?.availableTime    || '',
      maxPatientsPerDay:profileMap[d._id.toString()]?.maxPatientsPerDay ?? 20,
      consultationFee:  profileMap[d._id.toString()]?.consultationFee  || 0,
    }));

    res.json({ success: true, data: { doctors: result } });
  } catch (err) { next(err); }
};

// ── Public: check availability for a doctor on a specific date ───────────────
exports.checkAvailability = async (req, res, next) => {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) {
      return res.status(400).json({ success: false, message: 'doctorId and date are required' });
    }

    const doctorUser = await User.findById(doctorId);
    if (!doctorUser || doctorUser.role !== 'doctor') {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const profile = await DoctorProfile.findOne({ user: doctorId });
    const dateOnly = toDateOnly(date);
    const dayName  = JS_DAY_MAP[dateOnly.getUTCDay()];

    // Check day availability
    const availableDays = profile?.availableDays || [];
    if (!availableDays.includes(dayName)) {
      return res.json({ success: true, data: { available: false, reason: `Dr. ${doctorUser.name} is not available on ${dayName}` } });
    }

    // Check slot count
    const maxPerDay = profile?.maxPatientsPerDay ?? 20;
    const { start, end } = dayRange(dateOnly);
    const bookedCount = await Appointment.countDocuments({
      doctor: doctorId,
      appointmentDate: { $gte: start, $lte: end },
      status: { $nin: ['cancelled'] },
    });

    if (bookedCount >= maxPerDay) {
      return res.json({ success: true, data: { available: false, reason: `Dr. ${doctorUser.name} is fully booked for this date (${bookedCount}/${maxPerDay} slots)` } });
    }

    res.json({
      success: true,
      data: {
        available:  true,
        bookedCount,
        maxPerDay,
        slotsLeft:  maxPerDay - bookedCount,
        nextToken:  bookedCount + 1,
        dayName,
        startTime:  profile?.startTime || '',
        endTime:    profile?.endTime   || '',
      },
    });
  } catch (err) { next(err); }
};

// ── Create appointment (patient self / receptionist on behalf) ────────────────
exports.createAppointment = async (req, res, next) => {
  try {
    const creatorId   = req.user.id;
    const creatorRole = req.user.role;
    let { patient, doctor, appointmentDate, symptoms } = req.body;

    // ── STEP 0: determine patient ────────────────────────────────────────────
    if (creatorRole === 'patient') {
      patient = creatorId;
    } else {
      if (!patient) return res.status(400).json({ success: false, message: 'Patient is required' });
    }

    if (!doctor)          return res.status(400).json({ success: false, message: 'Doctor is required' });
    if (!appointmentDate) return res.status(400).json({ success: false, message: 'Appointment date is required' });

    // ── STEP 1: validate doctor ──────────────────────────────────────────────
    const doctorUser = await User.findById(doctor);
    if (!doctorUser || doctorUser.role !== 'doctor') {
      return res.status(400).json({ success: false, message: 'Invalid doctor' });
    }
    if (doctorUser.isActive === false) {
      return res.status(400).json({ success: false, message: 'Doctor account is inactive' });
    }

    const patientUser = await User.findById(patient);
    if (!patientUser) return res.status(400).json({ success: false, message: 'Invalid patient' });

    // ── STEP 2: check doctor availability for that day ───────────────────────
    const profile  = await DoctorProfile.findOne({ user: doctor });
    const dateOnly = toDateOnly(appointmentDate);
    const dayName  = JS_DAY_MAP[dateOnly.getUTCDay()];

    if (!profile) {
      return res.status(400).json({ success: false, message: 'Doctor has not set up availability yet' });
    }

    if (!profile.availableDays || !profile.availableDays.includes(dayName)) {
      return res.status(400).json({
        success: false,
        message: `Dr. ${doctorUser.name} is not available on ${dayName}`,
      });
    }

    // ── STEP 3: check maxPatientsPerDay ──────────────────────────────────────
    const maxPerDay = profile.maxPatientsPerDay ?? 20;
    const { start, end } = dayRange(dateOnly);

    const activeCount = await Appointment.countDocuments({
      doctor,
      appointmentDate: { $gte: start, $lte: end },
      status: { $nin: ['cancelled'] },
    });

    if (activeCount >= maxPerDay) {
      return res.status(400).json({
        success: false,
        message: `Fully booked for ${dateOnly.toDateString()} (${maxPerDay}/${maxPerDay} patients)`,
      });
    }

    // ── STEP 4: prevent double booking (same patient + doctor + date) ────────
    const duplicate = await Appointment.findOne({
      doctor,
      patient,
      appointmentDate: { $gte: start, $lte: end },
      status: { $nin: ['cancelled'] },
    });
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: 'You already have an appointment with this doctor on this date',
      });
    }

    // ── STEP 5: assign token = activeCount + 1 ───────────────────────────────
    const tokenNumber = activeCount + 1;

    symptoms = Array.isArray(symptoms) ? symptoms : (symptoms ? [symptoms] : []);

    const appt = await Appointment.create({
      patient,
      doctor,
      appointmentDate: dateOnly,
      tokenNumber,
      symptoms,
      status: 'confirmed',   // auto-accept all bookings
      createdBy: creatorId,
    });

    const populated = await populate(Appointment.findById(appt._id));

    res.status(201).json({
      success: true,
      message: `Appointment booked! Your token number is ${tokenNumber}`,
      data: { appointment: populated },
    });
  } catch (err) {
    // Duplicate key from compound index
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'You already have an appointment with this doctor on this date' });
    }
    next(err);
  }
};

// ── Get appointments based on role ───────────────────────────────────────────
exports.getAppointments = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const role   = req.user.role;
    const { date } = req.query; // optional date filter

    let filter = {};
    if (role === 'patient')     filter.patient = userId;
    else if (role === 'doctor') filter.doctor  = userId;
    else if (role === 'receptionist' || role === 'admin') filter = {};
    else return res.status(403).json({ success: false, message: 'Forbidden' });

    if (date) {
      const { start, end } = dayRange(toDateOnly(date));
      filter.appointmentDate = { $gte: start, $lte: end };
    }

    const appts = await populate(
      Appointment.find(filter).sort({ appointmentDate: 1, tokenNumber: 1 })
    );

    res.json({ success: true, data: { appointments: appts } });
  } catch (err) { next(err); }
};

// ── Today's queue for a doctor (sorted by token) ─────────────────────────────
exports.getTodayQueue = async (req, res, next) => {
  try {
    const doctorId = req.user.id;
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { start, end } = dayRange(toDateOnly(new Date()));

    const queue = await populate(
      Appointment.find({
        doctor: doctorId,
        appointmentDate: { $gte: start, $lte: end },
        status: { $nin: ['cancelled'] },
      }).sort({ tokenNumber: 1 })
    );
    const counts = queue.reduce((acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {});

    res.json({ success: true, data: { queue, counts, date: start } });
  } catch (err) { next(err); }
};

// ── Next patient (doctor advances queue) ─────────────────────────────────────
exports.callNextPatient = async (req, res, next) => {
  try {
    const doctorId = req.user.id;
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { start, end } = dayRange(toDateOnly(new Date()));

    // Mark current in-progress as completed first
    await Appointment.updateMany(
      { doctor: doctorId, appointmentDate: { $gte: start, $lte: end }, status: 'in-progress' },
      { status: 'completed' }
    );

    // Get next confirmed or checked-in by token order
    const next = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate: { $gte: start, $lte: end },
      status: { $in: ['confirmed', 'pending', 'checked-in'] },
    }).sort({ tokenNumber: 1 });

    if (!next) {
      return res.json({ success: true, data: { next: null }, message: 'Queue is empty for today' });
    }

    next.status = 'in-progress';
    await next.save();

    const populated = await populate(Appointment.findById(next._id));

    res.json({ success: true, message: `Now serving Token #${next.tokenNumber}`, data: { next: populated } });
  } catch (err) { next(err); }
};

// ── Update appointment status ─────────────────────────────────────────────────
exports.updateAppointmentStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const role   = req.user.role;
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'checked-in', 'in-progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const appt = await Appointment.findById(id);
    if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found' });

    // Authorization
    if (role === 'admin' || role === 'receptionist') {
      // full access
    } else if (role === 'doctor') {
      if (appt.doctor.toString() !== userId) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
      const doctorAllowed = ['checked-in', 'in-progress', 'completed', 'cancelled'];
      if (!doctorAllowed.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status transition for doctor' });
      }
    } else if (role === 'patient') {
      if (appt.patient.toString() !== userId) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
      if (status !== 'cancelled') {
        return res.status(400).json({ success: false, message: 'Patients can only cancel appointments' });
      }
    } else {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    appt.status = status;
    await appt.save();

    const populated = await populate(Appointment.findById(id));
    res.json({ success: true, message: 'Appointment updated', data: { appointment: populated } });
  } catch (err) { next(err); }
};
