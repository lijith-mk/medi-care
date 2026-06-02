const mongoose = require('mongoose');

const labProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  labName: { type: String, default: '' },
  labType: { type: String, default: '' },      // e.g. Pathology, Radiology
  qualification: { type: String, default: '' },
  experience: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('LabProfile', labProfileSchema);
