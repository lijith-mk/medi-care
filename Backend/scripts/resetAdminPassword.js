require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const connectDB = require('../src/config/db');

async function run() {
  try {
    const email = process.env.ADMIN_EMAIL || 'admin@hospital.com';
    const password = process.env.ADMIN_PASSWORD;

    if (!password) {
      console.error('Missing ADMIN_PASSWORD in environment variables');
      process.exit(1);
    }

    await connectDB();

    const admin = await User.findOne({ email, role: 'admin' });
    if (!admin) {
      console.error('Admin not found for email:', email);
      await mongoose.connection.close();
      process.exit(1);
    }

    admin.password = await bcrypt.hash(password, 10);
    admin.isActive = true;
    await admin.save();

    console.log('Admin password reset successfully:', { email: admin.email, role: admin.role, isActive: admin.isActive });
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Failed to reset admin password:', err);
    try {
      await mongoose.connection.close();
    } catch (_) {}
    process.exit(1);
  }
}

run();
