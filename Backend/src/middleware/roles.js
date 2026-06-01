module.exports = (...allowedRoles) => (req, res, next) => {
  const role = req.user && req.user.role;
  if (!role || !allowedRoles.includes(role)) return res.status(403).json({ message: 'Forbidden' });
  next();
};
