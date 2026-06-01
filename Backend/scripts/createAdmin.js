require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const connectDB = require('../src/config/db');

const run = async () => {
  const name = process.env.ADMIN_NAME;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!name || !email || !password) {
    console.error('Missing ADMIN_NAME, ADMIN_EMAIL, or ADMIN_PASSWORD in environment variables');
    process.exit(1);
  }

  await connectDB();

  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Admin already exists:', email);
    await mongoose.connection.close();
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await User.create({
    name,
    email,
    password: hashedPassword,
    role: 'admin',
  });

  console.log('Admin created successfully:');
  console.log({ id: admin._id, name: admin.name, email: admin.email, role: admin.role });

  await mongoose.connection.close();
  process.exit(0);
};

run().catch(async (error) => {
  console.error('Failed to create admin:', error);
  try {
    await mongoose.connection.close();
  } catch (_) {}
  process.exit(1);
});
