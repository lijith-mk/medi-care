const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['patient', 'doctor', 'admin', 'receptionist', 'lab'], default: 'patient' },
  phone: { type: String },
  isActive: { type: Boolean, default: true },
  age: { type: Number },
  gender: { type: String },
  avatarUrl: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
