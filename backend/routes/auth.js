const express = require('express');
const { body } = require('express-validator');
const { register, login, logout, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiters');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const AppError = require('../utils/AppError');

const router = express.Router();

router.post(
  '/register',
  authLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').optional().isIn(['patient', 'doctor', 'admin']),
  ],
  register
);

router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.get('/me', protect, getMe);

// Change password — available to all authenticated roles
router.patch('/change-password', protect, asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return next(new AppError('Both currentPassword and newPassword are required.', 400));
  }
  if (newPassword.length < 8) {
    return next(new AppError('New password must be at least 8 characters.', 400));
  }
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    return next(new AppError('Current password is incorrect.', 401));
  }
  user.password = newPassword;
  await user.save();
  res.status(200).json({ status: 'success', message: 'Password updated successfully.' });
}));

module.exports = router;

// Upload profile picture — available to all authenticated roles
const upload = require('../middleware/upload');
const { uploadAttachment } = require('../utils/storage');

router.patch('/avatar', protect, upload.single('avatar'), asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new AppError('No file uploaded.', 400));

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return next(new AppError('Only JPG, PNG, and WebP images are allowed.', 400));
  }

  const ext = req.file.originalname.split('.').pop();
  const storagePath = `avatars/${req.user._id}.${ext}`;

  const url = await uploadAttachment(req.file.buffer, storagePath, req.file.mimetype);

  // Build signed URL for the avatar
  const { getSignedUrl } = require('../utils/storage');
  // Use a long expiry for avatars (30 days)
  const supabase = require('../utils/storage');

  // Update user's avatarUrl directly
  const User = require('../models/User');
  const { createClient } = require('@supabase/supabase-js');
  const supabaseClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'medical-records';

  const { data: signedData } = await supabaseClient.storage
    .from(bucket)
    .createSignedUrl(storagePath, 60 * 60 * 24 * 30); // 30 days

  const avatarUrl = signedData?.signedUrl || url;

  await User.findByIdAndUpdate(req.user._id, { avatarUrl });

  res.status(200).json({ status: 'success', avatarUrl });
}));
