const mongoose = require('mongoose');

const medicalDocumentSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['image', 'pdf', 'other'], default: 'other' },
  uploadedAt: { type: Date, default: Date.now },
});

const patientProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  medicalHistory: { type: String },
  allergies: [{ type: String }],
  chronicDiseases: [{ type: String }],
  documents: [medicalDocumentSchema],
}, { timestamps: true });

module.exports = mongoose.model('PatientProfile', patientProfileSchema);
