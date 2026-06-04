const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patient:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  appointmentDate: { type: Date, required: true },   // stored as date-only (midnight UTC)
  tokenNumber:     { type: Number, required: true },  // sequential per doctor per day
  symptoms:        { type: [String], default: [] },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'checked-in', 'in-progress', 'completed', 'cancelled'],
    default: 'confirmed',  // auto-accept all bookings
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// Compound index: one active appointment per patient per doctor per day
appointmentSchema.index(
  { doctor: 1, patient: 1, appointmentDate: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $nin: ['cancelled'] } },
  }
);

// Hard guarantee: no two appointments can ever share the same token for the same doctor+day
appointmentSchema.index(
  { doctor: 1, appointmentDate: 1, tokenNumber: 1 },
  { unique: true }
);

module.exports = mongoose.model('Appointment', appointmentSchema);
