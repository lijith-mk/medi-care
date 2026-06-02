require('dotenv').config();
const axios = require('axios');

const API = process.env.API_URL || 'http://localhost:5000/api';
const EMAIL = process.env.ADMIN_EMAIL || 'admin@hospital.com';
const PASSWORD = process.env.ADMIN_PASSWORD;

async function run() {
  if (!PASSWORD) {
    console.error('Missing ADMIN_PASSWORD in environment variables');
    process.exit(1);
  }

  try {
    const loginRes = await axios.post(`${API}/auth/login`, { email: EMAIL, password: PASSWORD });
    const token = loginRes.data.token;
    const auth = { headers: { Authorization: `Bearer ${token}` } };

    const statsRes = await axios.get(`${API}/admin/stats`, auth);
    console.log('STATS', JSON.stringify(statsRes.data.data.stats, null, 2));

    const usersRes = await axios.get(`${API}/admin/users`, auth);
    const users = usersRes.data.data.users || [];
    console.log('USERS_COUNT', users.length);

    const appointmentsRes = await axios.get(`${API}/admin/appointments`, auth);
    const appointments = appointmentsRes.data.data.appointments || [];
    console.log('APPOINTMENTS_COUNT', appointments.length);

    const targetUser = users.find((user) => user.role !== 'admin');
    if (!targetUser) {
      console.log('No non-admin user found; skipping toggle test.');
      process.exit(0);
    }

    const toggleRes = await axios.put(`${API}/admin/users/${targetUser._id}/status`, {}, auth);
    console.log('TOGGLED', JSON.stringify(toggleRes.data.data.user, null, 2));

    await axios.put(`${API}/admin/users/${targetUser._id}/status`, {}, auth);
    console.log('TOGGLED_BACK', targetUser._id);
  } catch (err) {
    if (err.response) {
      console.error('ERROR_RESPONSE', err.response.status, JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('ERROR', err.message || err);
    }
    process.exit(1);
  }
}

run();
