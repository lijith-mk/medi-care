const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/roles');
const adminController = require('../controllers/adminController');

router.get('/users', auth, authorize('admin'), adminController.getAllUsers);
router.put('/users/:id/status', auth, authorize('admin'), adminController.toggleUserStatus);
router.get('/appointments', auth, authorize('admin'), adminController.getAllAppointments);
router.get('/stats', auth, authorize('admin'), adminController.getStats);

module.exports = router;
