const jwt = require('jsonwebtoken');

/**
 * Generate a JWT containing user id and role.
 * Expires in 30 days.
 * Accepts either a user object or an id and role.
 */
module.exports = (userOrId, role) => {
  const id = typeof userOrId === 'object' ? (userOrId._id || userOrId.id) : userOrId;
  const payload = { id, role: role || (userOrId && userOrId.role) };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });
};
