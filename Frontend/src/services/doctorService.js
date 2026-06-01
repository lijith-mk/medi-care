import api from './api';

export const getDoctors = async () => {
  const res = await api.get('/users/doctors');
  return res.data;
};

export default { getDoctors };
