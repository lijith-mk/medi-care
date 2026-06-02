const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const userController = require('../controllers/userController');

// GET /api/users?role=patient
router.get('/', auth, userController.getUsers);

// legacy route
router.get('/doctors', auth, userController.getDoctors);

module.exports = router;
