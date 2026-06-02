import api from './api';

export const createAdminUser = async (payload) => {
  const res = await api.post('/admin/users', payload);
  return res.data;
};

export const getAdminUsers = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.role) searchParams.set('role', params.role);
  if (params.q) searchParams.set('q', params.q);
  if (params.page) searchParams.set('page', params.page);
  if (params.limit) searchParams.set('limit', params.limit);

  const res = await api.get(`/admin/users${searchParams.toString() ? `?${searchParams.toString()}` : ''}`);
  return res.data;
};

export const toggleUserStatus = async (id) => {
  const res = await api.put(`/admin/users/${id}/status`);
  return res.data;
};

export const getAdminAppointments = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set('status', params.status);
  if (params.from) searchParams.set('from', params.from);
  if (params.to) searchParams.set('to', params.to);
  if (params.q) searchParams.set('q', params.q);
  if (params.page) searchParams.set('page', params.page);
  if (params.limit) searchParams.set('limit', params.limit);

  const res = await api.get(`/admin/appointments${searchParams.toString() ? `?${searchParams.toString()}` : ''}`);
  return res.data;
};

export const getAdminStats = async () => {
  const res = await api.get('/admin/stats');
  return res.data;
};

export default {
  getAdminUsers,
  toggleUserStatus,
  getAdminAppointments,
  getAdminStats,
};
