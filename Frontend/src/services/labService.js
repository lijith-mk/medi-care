import api from './api';

// Lab technician
export const getPendingRequests    = () => api.get('/lab/requests').then((r) => r.data);
export const getMyUploadedReports  = () => api.get('/lab/reports/mine').then((r) => r.data);

export const uploadLabReport = (formData) =>
  api.post('/lab/reports/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);

// Shared
export const getReportsByAppointment = (appointmentId) =>
  api.get(`/lab/reports/appointment/${appointmentId}`).then((r) => r.data);

// Patient
export const getMyReports = () => api.get('/lab/reports/my').then((r) => r.data);

export default {
  getPendingRequests, getMyUploadedReports, uploadLabReport,
  getReportsByAppointment, getMyReports,
};
