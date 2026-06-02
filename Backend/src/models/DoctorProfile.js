const mongoose = require('mongoose');

const doctorProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  specialization: { type: String, default: '' },
  department: { type: String, default: '' },
  qualification: { type: String, default: '' },
  experience: { type: Number, default: 0 },       // years
  consultationFee: { type: Number, default: 0 },  // currency units
  availableDays: [{ type: String }],               // ['Mon', 'Wed', 'Fri']
  availableTime: { type: String, default: '' },    // '10:00 - 16:00'
  bio: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('DoctorProfile', doctorProfileSchema);
