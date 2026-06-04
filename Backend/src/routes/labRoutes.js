const express    = require('express');
const router     = express.Router();
const auth       = require('../middleware/auth');
const authorize  = require('../middleware/roles');
const labCtrl    = require('../controllers/labController');
const { uploadLabReport } = require('../middleware/upload');

// Lab technician routes
router.get('/requests',         auth, authorize('lab'), labCtrl.getPendingRequests);
router.post('/reports/upload',  auth, authorize('lab'), uploadLabReport, labCtrl.uploadReport);
router.get('/reports/mine',     auth, authorize('lab'), labCtrl.getMyUploadedReports);

// Shared routes (patient, doctor, lab, admin can view reports by appointment)
router.get('/reports/appointment/:appointmentId',
  auth, authorize('patient', 'doctor', 'lab', 'admin', 'receptionist'),
  labCtrl.getReportsByAppointment
);

// Patient: all my reports
router.get('/reports/my', auth, authorize('patient'), labCtrl.getMyReports);

module.exports = router;
