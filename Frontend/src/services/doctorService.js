import api from './api';

// Uses the appointment router which returns doctors + their profile (availability, fees, etc.)
export const getDoctors = () =>
  api.get('/appointments/doctors').then((r) => r.data);

export default { getDoctors };
