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
  // Medical
  medicalHistory: { type: String, default: '' },
  allergies: [{ type: String }],
  chronicDiseases: [{ type: String }],
  currentMedications: [{ type: String }],
  bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''], default: '' },
  // Physical
  height: { type: Number },   // cm
  weight: { type: Number },   // kg
  // Personal
  address: { type: String, default: '' },
  // Emergency
  emergencyContact: {
    name:  { type: String, default: '' },
    phone: { type: String, default: '' },
  },
  // Documents
  documents: [medicalDocumentSchema],
}, { timestamps: true });

module.exports = mongoose.model('PatientProfile', patientProfileSchema);
