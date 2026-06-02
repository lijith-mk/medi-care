const mongoose = require('mongoose');

const receptionistProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  deskNumber: { type: String, default: '' },
  shift: { type: String, enum: ['Morning', 'Afternoon', 'Evening', 'Night', ''], default: '' },
}, { timestamps: true });

module.exports = mongoose.model('ReceptionistProfile', receptionistProfileSchema);
