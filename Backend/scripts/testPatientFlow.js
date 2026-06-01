const axios = require('axios');

const API = process.env.API_URL || 'http://localhost:5000/api';

async function run() {
  try {
    const timestamp = Date.now();
    const email = `testpatient_${timestamp}@example.com`;
    const password = 'TestPass123!';

    console.log('Registering patient', email);
    const reg = await axios.post(`${API}/auth/register`, { name: 'Test Patient', email, password });
    const token = reg.data.token;
    console.log('Registered. Token length:', token?.length || 0);

    const authHeader = { headers: { Authorization: `Bearer ${token}` } };

    console.log('Fetching doctors...');
    const doctorsRes = await axios.get(`${API}/users/doctors`, authHeader);
    const doctors = doctorsRes.data.data.doctors || [];
    console.log('Found doctors:', doctors.length);
    if (doctors.length === 0) {
      console.warn('No doctors found; aborting appointment creation.');
      return;
    }

    const doctorId = doctors[0]._id;
    const apptDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
    console.log('Creating appointment with doctor', doctorId, 'at', apptDate);
    const createRes = await axios.post(`${API}/appointments`, { doctor: doctorId, appointmentDate: apptDate, symptoms: 'Cough and fever' }, authHeader);
    console.log('Appointment created:', createRes.data.data.appointment._id);

    console.log('Listing appointments for patient...');
    const listRes = await axios.get(`${API}/appointments`, authHeader);
    console.log('Appointments count:', listRes.data.data.appointments.length);
    console.log(JSON.stringify(listRes.data.data.appointments.slice(0,5), null, 2));
  } catch (err) {
    if (err.response) console.error('Error response:', err.response.status, err.response.data);
    else console.error(err.message);
    process.exit(1);
  }
}

run();
