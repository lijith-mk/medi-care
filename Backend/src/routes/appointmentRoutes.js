const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/roles');
const appointmentController = require('../controllers/appointmentController');

// Create appointment: patient (self) or receptionist/admin on behalf
router.post('/', auth, authorize('patient', 'receptionist', 'admin'), appointmentController.createAppointment);

// Get appointments: patient -> own, doctor -> assigned, receptionist/admin -> all
router.get('/', auth, authorize('patient', 'doctor', 'receptionist', 'admin'), appointmentController.getAppointments);

// Update appointment status: patients (cancel), doctor (confirm/complete/cancel), receptionist/admin (any)
router.put('/:id', auth, authorize('patient', 'doctor', 'receptionist', 'admin'), appointmentController.updateAppointmentStatus);

module.exports = router;
