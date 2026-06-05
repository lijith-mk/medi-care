const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  // Registered patient (null for walk-ins)
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  // Walk-in guest info (filled when patient is null)
  guestPatient: {
    name:  { type: String, default: '' },
    phone: { type: String, default: '' },
    age:   { type: Number, default: null },
  },
  doctor:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  appointmentDate: { type: Date, required: true },
  tokenNumber:     { type: Number, required: true },
  symptoms:        { type: [String], default: [] },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'checked-in', 'skipped', 'in-progress', 'completed', 'cancelled'],
    default: 'confirmed',
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // ── Doctor consultation fields ──────────────────────────────────────────
  notes:        { type: String, default: '' },       // doctor's notes
  diagnosis:    { type: String, default: '' },       // final diagnosis
  prescription: { type: String, default: '' },       // prescribed medicines

  // ── Lab requests issued by doctor ──────────────────────────────────────
  labRequests: [{
    testType:    { type: String, required: true },   // e.g. "Blood Test", "X-Ray"
    notes:       { type: String, default: '' },      // instructions for lab
    labStatus:   { type: String, enum: ['pending', 'completed'], default: 'pending' },
    requestedAt: { type: Date, default: Date.now },
  }],

}, { timestamps: true });

// One active appointment per registered patient per doctor per day
appointmentSchema.index(
  { doctor: 1, patient: 1, appointmentDate: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: {
      patient: { $exists: true, $ne: null },
      status:  { $nin: ['cancelled', 'skipped'] },
    },
  }
);

// Hard guarantee: no two appointments share the same token for the same doctor+day
appointmentSchema.index(
  { doctor: 1, appointmentDate: 1, tokenNumber: 1 },
  { unique: true }
);

module.exports = mongoose.model('Appointment', appointmentSchema);

// One active appointment per registered patient per doctor per day
// (sparse: only applies when patient field is set)
appointmentSchema.index(
  { doctor: 1, patient: 1, appointmentDate: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: {
      patient: { $exists: true, $ne: null },
      status:  { $nin: ['cancelled'] },
    },
  }
);

// Hard guarantee: no two appointments share the same token for the same doctor+day
appointmentSchema.index(
  { doctor: 1, appointmentDate: 1, tokenNumber: 1 },
  { unique: true }
);

module.exports = mongoose.model('Appointment', appointmentSchema);
