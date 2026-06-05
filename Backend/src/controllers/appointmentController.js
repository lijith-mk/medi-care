const Appointment   = require('../models/Appointment');
const User          = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const DayCounter    = require('../models/DayCounter');

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

/** YYYY-MM-DD string used as the DayCounter key */
function toDateKey(dateOnly) {
  return dateOnly.toISOString().split('T')[0];
}

function populate(query) {
  return query
    .populate('patient', 'name email phone mrn')
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

    // Check slot count — use DayCounter for accuracy (matches booking logic)
    const maxPerDay = profile?.maxPatientsPerDay ?? 20;
    const dateKey   = toDateKey(dateOnly);
    const counter   = await DayCounter.findOne({ doctor: doctorId, date: dateKey });
    const bookedCount = counter?.count ?? 0;

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

// ── Create appointment (patient self / receptionist on behalf / walk-in) ──────
exports.createAppointment = async (req, res, next) => {
  try {
    const creatorId   = req.user.id;
    const creatorRole = req.user.role;
    let { patient, guestPatient, doctor, appointmentDate, symptoms } = req.body;

    // ── STEP 0: determine patient or walk-in ─────────────────────────────────
    let isGuest = false;

    if (creatorRole === 'patient') {
      // Patients always book for themselves
      patient = creatorId;
    } else {
      // Receptionist / admin: either registered patient OR walk-in guest
      const hasGuest = guestPatient?.name && String(guestPatient.name).trim();
      if (!patient && !hasGuest) {
        return res.status(400).json({
          success: false,
          message: 'Provide either a registered patient or walk-in guest details',
        });
      }
      if (hasGuest) {
        isGuest = true;
        patient = null; // no User linked
      }
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

    // Validate registered patient exists (skip for walk-ins)
    if (!isGuest) {
      const patientUser = await User.findById(patient);
      if (!patientUser) return res.status(400).json({ success: false, message: 'Invalid patient' });
    }

    // ── STEP 2: check doctor availability for that day ───────────────────────
    const profile  = await DoctorProfile.findOne({ user: doctor });
    const dateOnly = toDateOnly(appointmentDate);
    const dayName  = JS_DAY_MAP[dateOnly.getUTCDay()];
    const dateKey  = toDateKey(dateOnly);
    const { start, end } = dayRange(dateOnly);

    if (!profile) {
      return res.status(400).json({ success: false, message: 'Doctor has not set up availability yet' });
    }
    if (!profile.availableDays || !profile.availableDays.includes(dayName)) {
      return res.status(400).json({
        success: false,
        message: `Dr. ${doctorUser.name} is not available on ${dayName}`,
      });
    }

    // ── STEP 3: check maxPatientsPerDay via DayCounter ───────────────────────
    const maxPerDay    = profile.maxPatientsPerDay ?? 20;
    const existCounter = await DayCounter.findOne({ doctor, date: dateKey });
    const activeCount  = existCounter?.count ?? 0;

    if (activeCount >= maxPerDay) {
      return res.status(400).json({
        success: false,
        message: `Fully booked for ${dateOnly.toDateString()} (${maxPerDay}/${maxPerDay} patients)`,
      });
    }

    // ── STEP 4: prevent double booking for registered patients ───────────────
    if (!isGuest) {
      const duplicate = await Appointment.findOne({
        doctor,
        patient,
        appointmentDate: { $gte: start, $lte: end },
        status: { $nin: ['cancelled', 'skipped'] },
      });
      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: `You already have an active appointment with this doctor on ${dateOnly.toLocaleDateString('en-US', { dateStyle: 'medium' })} (Token #${duplicate.tokenNumber}, status: ${duplicate.status}). Cancel it first to book again.`,
        });
      }
    }

    // ── STEP 5: atomically assign token ─────────────────────────────────────
    const updatedCounter = await DayCounter.findOneAndUpdate(
      { doctor, date: dateKey },
      { $inc: { count: 1 } },
      { new: true, upsert: true }
    );
    const tokenNumber = updatedCounter.count;

    symptoms = Array.isArray(symptoms) ? symptoms : (symptoms ? [symptoms] : []);

    // Build appointment doc
    const apptData = {
      doctor,
      appointmentDate: dateOnly,
      tokenNumber,
      symptoms,
      status: 'confirmed',
      createdBy: creatorId,
    };

    if (isGuest) {
      apptData.guestPatient = {
        name:  String(guestPatient.name).trim(),
        phone: guestPatient.phone ? String(guestPatient.phone).trim() : '',
        age:   guestPatient.age   ? Number(guestPatient.age)          : null,
      };
    } else {
      apptData.patient = patient;
    }

    const appt = await Appointment.create(apptData);
    const populated = await populate(Appointment.findById(appt._id));

    const patientLabel = isGuest
      ? guestPatient.name
      : (await User.findById(patient).select('name'))?.name || 'Patient';

    res.status(201).json({
      success: true,
      message: `Appointment booked for ${patientLabel}! Token number: ${tokenNumber}`,
      data: { appointment: populated },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'This patient already has an appointment with this doctor on this date' });
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

    // Get next confirmed or checked-in (NOT skipped) by token order
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

    const validStatuses = ['pending', 'confirmed', 'checked-in', 'skipped', 'in-progress', 'completed', 'cancelled'];
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
      const doctorAllowed = ['checked-in', 'skipped', 'in-progress', 'completed', 'cancelled'];
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

// ── Doctor: save consultation notes / diagnosis / prescription ───────────────
exports.saveConsultation = async (req, res, next) => {
  try {
    const doctorId = req.user.id;
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { id } = req.params;
    const { notes, diagnosis, prescription } = req.body;

    const appt = await Appointment.findById(id);
    if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found' });
    if (appt.doctor.toString() !== doctorId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    if (notes       !== undefined) appt.notes       = notes;
    if (diagnosis   !== undefined) appt.diagnosis   = diagnosis;
    if (prescription !== undefined) appt.prescription = prescription;

    await appt.save();
    const populated = await populate(Appointment.findById(id));
    res.json({ success: true, message: 'Consultation saved.', data: { appointment: populated } });
  } catch (err) { next(err); }
};

// ── Doctor: add a lab test request to an appointment ────────────────────────
exports.addLabRequest = async (req, res, next) => {
  try {
    const doctorId = req.user.id;
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { id } = req.params;
    const { testType, notes } = req.body;

    if (!testType || !String(testType).trim()) {
      return res.status(400).json({ success: false, message: 'testType is required' });
    }

    const appt = await Appointment.findById(id);
    if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found' });
    if (appt.doctor.toString() !== doctorId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    appt.labRequests.push({
      testType: String(testType).trim(),
      notes:    notes ? String(notes).trim() : '',
    });
    await appt.save();

    const populated = await populate(Appointment.findById(id));
    res.status(201).json({
      success: true,
      message: `Lab request added: ${testType}`,
      data: { appointment: populated },
    });
  } catch (err) { next(err); }
};

// ── Doctor: directly start consultation for any patient (skip queue order) ───
// Used when a skipped/late patient arrives and doctor wants to see them now.
exports.startConsultation = async (req, res, next) => {
  try {
    const doctorId = req.user.id;
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { id } = req.params;
    const appt = await Appointment.findById(id);
    if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found' });
    if (appt.doctor.toString() !== doctorId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    if (['completed', 'cancelled'].includes(appt.status)) {
      return res.status(400).json({ success: false, message: 'Cannot start consultation for a completed or cancelled appointment' });
    }

    // Only one in-progress at a time — complete the current one first if active
    const { start, end } = dayRange(toDateOnly(new Date()));
    await Appointment.updateMany(
      { doctor: doctorId, appointmentDate: { $gte: start, $lte: end }, status: 'in-progress' },
      { status: 'completed' }
    );

    appt.status = 'in-progress';
    await appt.save();

    const populated = await populate(Appointment.findById(id));
    res.json({
      success: true,
      message: `Consultation started for Token #${appt.tokenNumber}`,
      data: { appointment: populated },
    });
  } catch (err) { next(err); }
};
