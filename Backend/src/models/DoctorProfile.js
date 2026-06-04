const mongoose = require('mongoose');

const doctorProfileSchema = new mongoose.Schema({
  user:             { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  specialization:   { type: String, default: '' },
  department:       { type: String, default: '' },
  qualification:    { type: String, default: '' },
  experience:       { type: Number, default: 0 },      // years
  consultationFee:  { type: Number, default: 0 },
  // Availability
  availableDays:    [{ type: String }],                // ['Mon', 'Wed', 'Fri']
  startTime:        { type: String, default: '' },     // '10:00'
  endTime:          { type: String, default: '' },     // '16:00'
  // Keep legacy string for backward compat with existing saved data
  availableTime:    { type: String, default: '' },     // '10:00 - 16:00' (derived)
  maxPatientsPerDay:{ type: Number, default: 20 },     // daily token limit
  bio:              { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('DoctorProfile', doctorProfileSchema);
