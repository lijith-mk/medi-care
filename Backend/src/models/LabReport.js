const mongoose = require('mongoose');

const labReportSchema = new mongoose.Schema({
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
  },
  // The registered patient (null for walk-ins)
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  // Walk-in reference (name only, for display)
  guestPatientName: { type: String, default: '' },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,   // lab technician who uploaded
  },
  // Which lab request this report fulfils (subdoc _id from appointment.labRequests)
  labRequestId: { type: mongoose.Schema.Types.ObjectId, default: null },
  testType:     { type: String, required: true },  // "Blood Test", "X-Ray", etc.
  fileUrl:      { type: String, required: true },  // Cloudinary URL
  publicId:     { type: String, default: '' },     // Cloudinary public_id for deletion
  fileType:     { type: String, default: 'pdf' },  // 'pdf' | 'image'
  notes:        { type: String, default: '' },     // lab technician notes
}, { timestamps: true });

module.exports = mongoose.model('LabReport', labReportSchema);
