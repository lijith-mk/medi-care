require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const connectDB = require('../src/config/db');

const usersToCreate = [
  { name: 'Dr Test', email: 'dr.test@example.com', password: 'Password123', role: 'doctor' },
  { name: 'Reception Test', email: 'reception.test@example.com', password: 'Password123', role: 'receptionist' },
  { name: 'Admin Test', email: 'admin.test@example.com', password: 'Password123', role: 'admin' },
];

const run = async () => {
  await connectDB();
  for (const u of usersToCreate) {
    const existing = await User.findOne({ email: u.email });
    if (existing) {
      console.log('Exists:', u.email, existing._id.toString());
      continue;
    }
    const hashed = await bcrypt.hash(u.password, 10);
    const created = await User.create({ name: u.name, email: u.email, password: hashed, role: u.role });
    console.log('Created:', u.email, created._id.toString());
  }
  await mongoose.connection.close();
};

run().catch(async (err) => {
  console.error(err);
  try { await mongoose.connection.close(); } catch (_) {}
  process.exit(1);
});
