/**
 * Run once to drop the old compound index and let Mongoose recreate it
 * with the updated partialFilterExpression (now excludes 'skipped' too).
 *
 * Usage: node scripts/fixIndexes.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

async function fix() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const col = mongoose.connection.collection('appointments');

  // List current indexes
  const indexes = await col.indexes();
  console.log('Current indexes:', indexes.map((i) => i.name));

  // Drop the old compound index by its field spec
  try {
    await col.dropIndex({ doctor: 1, patient: 1, appointmentDate: 1 });
    console.log('✓ Dropped old compound index');
  } catch (e) {
    console.log('Index not found or already dropped:', e.message);
  }

  // Mongoose will recreate it with the new partialFilterExpression on next app start
  console.log('✓ Done. Restart the server — Mongoose will recreate the index automatically.');
  await mongoose.disconnect();
}

fix().catch(console.error);
