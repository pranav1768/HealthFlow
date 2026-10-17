const express = require('express');
const { getMyProfile, updateMyProfile, changePassword } = require('../controllers/patientController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.use(protect, restrictTo('patient'));

router.get('/me', getMyProfile);
router.patch('/me', updateMyProfile);
router.patch('/me/password', changePassword);

module.exports = router;
