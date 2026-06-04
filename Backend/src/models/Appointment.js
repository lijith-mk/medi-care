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
  appointmentDate: { type: Date, required: true },  // stored as date-only (midnight UTC)
  tokenNumber:     { type: Number, required: true }, // sequential per doctor per day
  symptoms:        { type: [String], default: [] },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'checked-in', 'in-progress', 'completed', 'cancelled'],
    default: 'confirmed',
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

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
