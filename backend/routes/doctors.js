const express = require('express');
const {
  searchDoctors,
  getDoctorById,
  getMyDoctorProfile,
  updateMyDoctorProfile,
  updateMyAvailability,
} = require('../controllers/doctorController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// Public
router.get('/', searchDoctors);
router.get('/:id', getDoctorById);

// Doctor-only
router.get('/me/profile', protect, restrictTo('doctor'), getMyDoctorProfile);
router.patch('/me/profile', protect, restrictTo('doctor'), updateMyDoctorProfile);
router.patch('/me/availability', protect, restrictTo('doctor'), updateMyAvailability);

module.exports = router;
