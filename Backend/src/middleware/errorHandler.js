module.exports = (err, req, res, next) => {
  console.error(err);
  // Handle Mongo duplicate key
  if (err && err.code === 11000) {
    return res.status(409).json({ success: false, message: 'Email already exists' });
  }

  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
};
