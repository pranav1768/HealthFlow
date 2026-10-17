const express = require('express');
const {
  createAppointment,
  getMyAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  rateAppointment,
} = require('../controllers/appointmentController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', restrictTo('patient'), createAppointment);
router.get('/', getMyAppointments);
router.get('/:id', getAppointmentById);
router.patch('/:id/status', restrictTo('doctor', 'admin', 'patient'), updateAppointmentStatus);
router.post('/:id/rate', restrictTo('patient'), rateAppointment);

module.exports = router;
