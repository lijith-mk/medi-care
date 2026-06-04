const express    = require('express');
const router     = express.Router();
const auth       = require('../middleware/auth');
const authorize  = require('../middleware/roles');
const ctrl       = require('../controllers/appointmentController');

// Public (authenticated) — any logged-in user can list doctors and check availability
router.get('/doctors',      auth, ctrl.getDoctors);
router.get('/availability', auth, ctrl.checkAvailability);

// Book appointment: patient (self) or receptionist/admin on behalf
router.post('/', auth, authorize('patient', 'receptionist', 'admin'), ctrl.createAppointment);

// Get appointments (role-filtered, optional ?date=YYYY-MM-DD)
router.get('/', auth, authorize('patient', 'doctor', 'receptionist', 'admin'), ctrl.getAppointments);

// Doctor queue routes
router.get('/queue/today', auth, authorize('doctor'), ctrl.getTodayQueue);
router.post('/queue/next', auth, authorize('doctor'), ctrl.callNextPatient);

// Update status
router.put('/:id/status', auth, authorize('patient', 'doctor', 'receptionist', 'admin'), ctrl.updateAppointmentStatus);

// Doctor: save consultation notes / diagnosis / prescription
router.put('/:id/consultation', auth, authorize('doctor'), ctrl.saveConsultation);

// Doctor: add lab test request
router.post('/:id/lab-request', auth, authorize('doctor'), ctrl.addLabRequest);

// Doctor: directly start consultation for any patient (bypass queue order for late arrivals)
router.post('/:id/start', auth, authorize('doctor'), ctrl.startConsultation);

module.exports = router;
