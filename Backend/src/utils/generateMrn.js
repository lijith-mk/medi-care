const MrnCounter = require('../models/MrnCounter');

/**
 * Atomically generate the next MRN.
 * Format: MHC-YYYY-NNNNN  e.g.  MHC-2026-00042
 */
async function generateMrn() {
  const year = new Date().getFullYear();

  const counter = await MrnCounter.findOneAndUpdate(
    { _id: 'mrn' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const padded = String(counter.seq).padStart(5, '0');
  return `MHC-${year}-${padded}`;
}

module.exports = generateMrn;
