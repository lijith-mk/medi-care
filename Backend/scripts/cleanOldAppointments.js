/**
 * Cancels all old appointments that have no tokenNumber (created before
 * the token system was implemented).
 * Usage: node scripts/cleanOldAppointments.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

async function clean() {
  await mongoose.connect(process.env.MONGO_URI);
  const col = mongoose.connection.collection('appointments');

  // Find appointments with no tokenNumber
  const result = await col.updateMany(
    { tokenNumber: { $exists: false } },
    { $set: { status: 'cancelled' } }
  );

  console.log(`✓ Cancelled ${result.modifiedCount} old appointments without token numbers.`);
  await mongoose.disconnect();
}

clean().catch(console.error);
