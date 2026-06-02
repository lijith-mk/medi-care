const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { uploadAvatar, uploadDocument } = require('../middleware/upload');
const uploadController = require('../controllers/uploadController');

// Wrap multer middleware so its errors are forwarded to Express error handler
function multerHandler(multerMw) {
  return (req, res, next) => {
    multerMw(req, res, (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message || 'File upload error' });
      }
      next();
    });
  };
}

// Avatar — any authenticated user
router.post('/avatar', auth, multerHandler(uploadAvatar), uploadController.uploadAvatar);
router.delete('/avatar', auth, uploadController.deleteAvatar);

// Medical documents — patients only (enforced in controller)
router.post('/document', auth, multerHandler(uploadDocument), uploadController.uploadDocument);
router.delete('/document/:docId', auth, uploadController.deleteDocument);

module.exports = router;
