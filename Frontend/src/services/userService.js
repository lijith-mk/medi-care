import api from './api';

export const getUsers = async (role) => {
  const res = await api.get(`/users?role=${encodeURIComponent(role)}`);
  return res.data;
};

export default { getUsers };
