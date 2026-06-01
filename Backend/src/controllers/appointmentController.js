const Appointment = require('../models/Appointment');
const User = require('../models/User');

// Create an appointment (patient self-booking or receptionist on behalf)
exports.createAppointment = async (req, res, next) => {
  try {
    const creatorId = req.user.id;
    const creatorRole = req.user.role;
    let { patient, doctor, appointmentDate, symptoms } = req.body;

    // If patient is booking, force patient to be the authenticated user
    if (creatorRole === 'patient') {
      patient = creatorId;
    } else {
      // receptionist or admin may create on behalf — require patient field
      if (!patient) return res.status(400).json({ success: false, message: 'Patient is required' });
    }

    if (!doctor) return res.status(400).json({ success: false, message: 'Doctor is required' });
    if (!appointmentDate) return res.status(400).json({ success: false, message: 'Appointment date is required' });

    // validate doctor exists and has role 'doctor'
    const doctorUser = await User.findById(doctor);
    if (!doctorUser || doctorUser.role !== 'doctor') return res.status(400).json({ success: false, message: 'Invalid doctor' });

    // validate patient exists
    const patientUser = await User.findById(patient);
    if (!patientUser) return res.status(400).json({ success: false, message: 'Invalid patient' });

    // normalize symptoms to array
    symptoms = Array.isArray(symptoms) ? symptoms : (symptoms ? [symptoms] : []);

    const appt = await Appointment.create({
      patient,
      doctor,
      appointmentDate: new Date(appointmentDate),
      symptoms,
      createdBy: creatorId,
    });

    const populated = await Appointment.findById(appt._id).populate('patient', 'name email').populate('doctor', 'name email');

    res.status(201).json({ success: true, message: 'Appointment created', data: { appointment: populated } });
  } catch (err) {
    next(err);
  }
};

// Get appointments based on role
exports.getAppointments = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let filter = {};
    if (role === 'patient') filter.patient = userId;
    else if (role === 'doctor') filter.doctor = userId;
    else if (role === 'receptionist' || role === 'admin') filter = {}; // full access
    else return res.status(403).json({ success: false, message: 'Forbidden' });

    const appts = await Appointment.find(filter).populate('patient', 'name email').populate('doctor', 'name email').sort({ appointmentDate: 1 });
    res.json({ success: true, message: 'Appointments retrieved', data: { appointments: appts } });
  } catch (err) {
    next(err);
  }
};

// Update appointment status
exports.updateAppointmentStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });

    const appt = await Appointment.findById(id);
    if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found' });

    // Authorization rules:
    // - admin and receptionist can update any status
    // - doctor can update assigned appointment to confirmed/completed/cancelled
    // - patient can cancel their own appointment
    if (role === 'admin' || role === 'receptionist') {
      // allowed
    } else if (role === 'doctor') {
      if (appt.doctor.toString() !== userId) return res.status(403).json({ success: false, message: 'Forbidden' });
      if (!['confirmed', 'completed', 'cancelled'].includes(status)) return res.status(400).json({ success: false, message: 'Doctor can only confirm, complete, or cancel appointments' });
    } else if (role === 'patient') {
      if (appt.patient.toString() !== userId) return res.status(403).json({ success: false, message: 'Forbidden' });
      if (status !== 'cancelled') return res.status(400).json({ success: false, message: 'Patient can only cancel appointments' });
    } else {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    appt.status = status;
    await appt.save();

    const populated = await Appointment.findById(id).populate('patient', 'name email').populate('doctor', 'name email');
    res.json({ success: true, message: 'Appointment updated', data: { appointment: populated } });
  } catch (err) {
    next(err);
  }
};
