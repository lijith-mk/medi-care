const mongoose = require('mongoose');

/**
 * Single-document counter for MRN (Medical Record Number) sequences.
 * Atomically incremented on every patient registration.
 */
const mrnCounterSchema = new mongoose.Schema({
  _id:  { type: String, default: 'mrn' },
  seq:  { type: Number, default: 0 },
});

module.exports = mongoose.model('MrnCounter', mrnCounterSchema);
