const Appointment = require('../models/Appointment');
const LabReport   = require('../models/LabReport');
const cloudinary  = require('../config/cloudinary');

// ── Lab: get all pending lab requests ────────────────────────────────────────
// Returns appointments that have at least one pending labRequest
exports.getPendingRequests = async (req, res, next) => {
  try {
    if (req.user.role !== 'lab') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const appointments = await Appointment.find({
      'labRequests.labStatus': 'pending',
    })
      .populate('patient', 'name email')
      .populate('doctor',  'name email')
      .sort({ appointmentDate: -1 });

    // Flatten to per-request items for easier rendering
    const requests = [];
    appointments.forEach((appt) => {
      appt.labRequests
        .filter((r) => r.labStatus === 'pending')
        .forEach((r) => {
          requests.push({
            appointmentId:   appt._id,
            appointmentDate: appt.appointmentDate,
            tokenNumber:     appt.tokenNumber,
            patientName:     appt.patient?.name || appt.guestPatient?.name || '—',
            patientEmail:    appt.patient?.email || '',
            doctorName:      appt.doctor?.name  || '—',
            labRequestId:    r._id,
            testType:        r.testType,
            requestNotes:    r.notes,
            requestedAt:     r.requestedAt,
            labStatus:       r.labStatus,
          });
        });
    });

    res.json({ success: true, data: { requests } });
  } catch (err) { next(err); }
};

// ── Lab: upload a report and mark the lab request as completed ───────────────
exports.uploadReport = async (req, res, next) => {
  try {
    if (req.user.role !== 'lab') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { appointmentId, labRequestId, testType, notes } = req.body;
    if (!appointmentId) {
      return res.status(400).json({ success: false, message: 'appointmentId is required' });
    }

    const appt = await Appointment.findById(appointmentId)
      .populate('patient', 'name email')
      .populate('doctor',  'name');

    if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found' });

    // Mark the specific lab request as completed (if id provided)
    if (labRequestId) {
      const labReq = appt.labRequests.id(labRequestId);
      if (labReq) {
        labReq.labStatus = 'completed';
        await appt.save();
      }
    }

    const fileUrl  = req.file.path;
    const publicId = req.file.filename || '';
    const mime     = req.file.mimetype || '';
    const fileType = mime === 'application/pdf' ? 'pdf' : 'image';

    const report = await LabReport.create({
      appointment:      appointmentId,
      patient:          appt.patient?._id || null,
      guestPatientName: appt.patient ? '' : (appt.guestPatient?.name || ''),
      doctor:           appt.doctor._id,
      uploadedBy:       req.user.id,
      labRequestId:     labRequestId || null,
      testType:         testType || 'Report',
      fileUrl,
      publicId,
      fileType,
      notes:            notes || '',
    });

    res.status(201).json({
      success: true,
      message: 'Report uploaded successfully.',
      data: { report },
    });
  } catch (err) { next(err); }
};

// ── Get reports for a specific appointment (used by patient + doctor) ─────────
exports.getReportsByAppointment = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const role = req.user.role;

    const appt = await Appointment.findById(appointmentId);
    if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found' });

    // Access control: patient can only see their own, doctor can see their appointments
    if (role === 'patient' && appt.patient?.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    if (role === 'doctor' && appt.doctor.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const reports = await LabReport.find({ appointment: appointmentId })
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: { reports } });
  } catch (err) { next(err); }
};

// ── Get all reports for logged-in patient ─────────────────────────────────────
exports.getMyReports = async (req, res, next) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const reports = await LabReport.find({ patient: req.user.id })
      .populate('uploadedBy', 'name')
      .populate('doctor',     'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: { reports } });
  } catch (err) { next(err); }
};

// ── Get all completed reports uploaded by this lab technician ─────────────────
exports.getMyUploadedReports = async (req, res, next) => {
  try {
    if (req.user.role !== 'lab') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const reports = await LabReport.find({ uploadedBy: req.user.id })
      .populate('doctor',  'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: { reports } });
  } catch (err) { next(err); }
};
