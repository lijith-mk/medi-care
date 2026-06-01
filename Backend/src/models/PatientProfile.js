const mongoose = require('mongoose');

const patientProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  medicalHistory: { type: String },
  allergies: [{ type: String }],
  chronicDiseases: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('PatientProfile', patientProfileSchema);
