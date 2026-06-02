import api from './api';

// Patient profile (legacy route — keeps document upload working)
export const getPatientProfile = async () => {
  const res = await api.get('/patient/profile');
  return res.data;
};

export const updatePatientProfile = async (payload) => {
  const res = await api.post('/patient/profile', payload);
  return res.data;
};

// Universal extended profile (doctor / lab / receptionist)
export const getProfile = async () => {
  const res = await api.get('/profile');
  return res.data;
};

export const updateProfile = async (payload) => {
  const res = await api.put('/profile', payload);
  return res.data;
};

export default { getProfile, updateProfile, getPatientProfile, updatePatientProfile };
