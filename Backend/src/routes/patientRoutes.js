const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const patientController = require('../controllers/patientController');

router.post('/profile', auth, patientController.createOrUpdateProfile);
router.get('/profile', auth, patientController.getProfile);

module.exports = router;
