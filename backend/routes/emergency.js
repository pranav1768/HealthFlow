const express = require('express');
const { protect, restrictTo } = require('../middleware/auth');
const { triggerEmergency } = require('../controllers/emergencyController');

const router = express.Router();

router.use(protect, restrictTo('doctor'));
router.post('/alert', triggerEmergency);

module.exports = router;
