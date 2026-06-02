require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const connectDB = require('../src/config/db');

async function run() {
  try {
    await connectDB();
    const admin = await User.findOne({ role: 'admin' }).select('name email role isActive createdAt');
    if (!admin) {
      console.log('NO_ADMIN');
    } else {
      console.log('ADMIN_FOUND');
      console.log(JSON.stringify(admin, null, 2));
    }
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('ERROR', err.message || err);
    try { await mongoose.connection.close(); } catch (_) {}
    process.exit(1);
  }
}

run();
