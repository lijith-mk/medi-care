import api from './api';

export const getAppointments = (params = {}) =>
  api.get('/appointments', { params }).then((r) => r.data);

export const createAppointment = (payload) =>
  api.post('/appointments', payload).then((r) => r.data);

export const updateAppointmentStatus = (id, status) =>
  api.put(`/appointments/${id}/status`, { status }).then((r) => r.data);

// Doctor queue
export const getTodayQueue    = ()  => api.get('/appointments/queue/today').then((r) => r.data);
export const callNextPatient  = ()  => api.post('/appointments/queue/next').then((r) => r.data);

// Availability check
export const checkAvailability = (doctorId, date) =>
  api.get('/appointments/availability', { params: { doctorId, date } }).then((r) => r.data);

// Doctor list (used in booking form)
export const getDoctors = () =>
  api.get('/appointments/doctors').then((r) => r.data);

export default { getAppointments, createAppointment, updateAppointmentStatus, getTodayQueue, callNextPatient, checkAvailability, getDoctors };
