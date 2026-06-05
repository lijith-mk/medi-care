const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:             { type: String, required: true },
  email:            { type: String, required: true, unique: true, lowercase: true },
  password:         { type: String, default: null },
  role:             { type: String, enum: ['patient', 'doctor', 'admin', 'receptionist', 'lab'], default: 'patient' },
  phone:            { type: String },
  isActive:         { type: Boolean, default: true },
  age:              { type: Number },
  gender:           { type: String },
  avatarUrl:        { type: String, default: null },
  profileCompleted: { type: Boolean, default: false },
  // Medical Record Number — assigned to patients only, e.g. MHC-2026-00042
  mrn:              { type: String, default: null, sparse: true },
  // Google OAuth
  googleId:         { type: String, default: null },
  authProvider:     { type: String, enum: ['local', 'google'], default: 'local' },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
