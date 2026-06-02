const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { uploadAvatar, uploadDocument } = require('../middleware/upload');
const uploadController = require('../controllers/uploadController');

// Avatar — any authenticated user
router.post('/avatar', auth, uploadAvatar, uploadController.uploadAvatar);
router.delete('/avatar', auth, uploadController.deleteAvatar);

// Medical documents — patients only (enforced in controller)
router.post('/document', auth, uploadDocument, uploadController.uploadDocument);
router.delete('/document/:docId', auth, uploadController.deleteDocument);

module.exports = router;
