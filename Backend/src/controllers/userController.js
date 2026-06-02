const User = require('../models/User');

// Generic users by role endpoint
exports.getUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    if (!role) return res.status(400).json({ success: false, message: 'role query param is required' });
    const users = await User.find({ role }).select('name email');
    res.json({ success: true, message: 'Users retrieved', data: { users } });
  } catch (err) {
    next(err);
  }
};

exports.getDoctors = async (req, res, next) => {
  req.query.role = 'doctor';
  return exports.getUsers(req, res, next);
};
