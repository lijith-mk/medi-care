/**
 * Shows all appointments grouped by patient+doctor+date to find duplicates.
 * Usage: node scripts/checkDuplicates.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const col = mongoose.connection.collection('appointments');

  const all = await col.find({}).toArray();
  console.log(`Total appointments in DB: ${all.length}`);
  console.log('\nAll appointments:');
  all.forEach((a) => {
    console.log({
      id:     a._id.toString(),
      patient: a.patient?.toString() || `GUEST:${a.guestPatient?.name}`,
      doctor:  a.doctor?.toString(),
      date:    new Date(a.appointmentDate).toISOString().split('T')[0],
      token:   a.tokenNumber,
      status:  a.status,
    });
  });

  await mongoose.disconnect();
}

check().catch(console.error);
