import api from './api';

export const getProfile = async () => {
  const res = await api.get('/patient/profile');
  return res.data;
};

export const updateProfile = async (payload) => {
  const res = await api.post('/patient/profile', payload);
  return res.data;
};

export default { getProfile, updateProfile };
