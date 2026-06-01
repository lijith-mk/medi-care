import api from './api';

export const getAppointments = async () => {
  const res = await api.get('/appointments');
  return res.data;
};

export const createAppointment = async (payload) => {
  const res = await api.post('/appointments', payload);
  return res.data;
};

export default { getAppointments, createAppointment };
