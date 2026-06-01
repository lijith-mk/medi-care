export const roleHome = {
  patient: '/patient',
  doctor: '/doctor',
  admin: '/admin',
  receptionist: '/receptionist',
  lab: '/lab',
};

export const getRoleHome = (role) => roleHome[role] || '/login';
