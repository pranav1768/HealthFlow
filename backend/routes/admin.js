const express = require('express');
const { getAllUsers, updateUserStatus, verifyDoctor, getAnalytics } = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.use(protect, restrictTo('admin'));

router.get('/users', getAllUsers);
router.patch('/users/:id/status', updateUserStatus);
router.patch('/doctors/:id/verify', verifyDoctor);
router.get('/analytics', getAnalytics);

module.exports = router;
