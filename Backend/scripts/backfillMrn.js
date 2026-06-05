/**
 * Assigns MRN to all existing patients who don't have one yet.
 * Run once: node scripts/backfillMrn.js
 */
require('dotenv').config();
const mongoose    = require('mongoose');
const User        = require('../src/models/User');
const MrnCounter  = require('../src/models/MrnCounter');

async function generateMrn() {
  const year = new Date().getFullYear();
  const counter = await MrnCounter.findOneAndUpdate(
    { _id: 'mrn' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `MHC-${year}-${String(counter.seq).padStart(5, '0')}`;
}

async function backfill() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected');

  const patients = await User.find({ role: 'patient', mrn: null });
  console.log(`Found ${patients.length} patients without MRN`);

  for (const p of patients) {
    const mrn = await generateMrn();
    await User.findByIdAndUpdate(p._id, { mrn });
    console.log(`  ${p.name} (${p.email}) → ${mrn}`);
  }

  console.log('✓ Done');
  await mongoose.disconnect();
}

backfill().catch(console.error);
