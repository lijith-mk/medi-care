const mongoose = require('mongoose');

/**
 * DayCounter — one document per (doctor, date).
 * Used as an atomic counter to assign token numbers without race conditions.
 *
 * When two bookings arrive at the exact same millisecond:
 *   - Request A: findOneAndUpdate → count goes 5→6, returns 6  (token 6)
 *   - Request B: findOneAndUpdate → count goes 6→7, returns 7  (token 7)
 * MongoDB's atomic $inc guarantees no two requests ever get the same value.
 */
const dayCounterSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Stored as YYYY-MM-DD string so it is human-readable and unambiguous
  date: {
    type: String,
    required: true,
  },
  // Current highest token assigned for this doctor on this date
  count: {
    type: Number,
    default: 0,
  },
});

// Unique compound index — one counter per doctor per day
dayCounterSchema.index({ doctor: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DayCounter', dayCounterSchema);
