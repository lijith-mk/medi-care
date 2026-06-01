const User = require('../models/User');

exports.getDoctors = async (req, res, next) => {
  try {
    const doctors = await User.find({ role: 'doctor' }).select('name email');
    res.json({ success: true, message: 'Doctors retrieved', data: { doctors } });
  } catch (err) {
    next(err);
  }
};
