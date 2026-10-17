const { validationResult } = require('express-validator');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { signToken } = require('../utils/token');

function sendAuthResponse(user, statusCode, res) {
  const token = signToken(user._id, user.role);

  const isProduction = process.env.NODE_ENV === 'production';

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: isProduction,
    // 'none' required for cross-origin (Vercel frontend + Render backend)
    // 'lax' is fine for same-origin (local dev)
    sameSite: isProduction ? 'none' : 'lax',
  };

  res.cookie('token', token, cookieOptions);
  res.status(statusCode).json({
    status: 'success',
    token,
    user: user.toSafeObject(),
  });
}

const register = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError(errors.array()[0].msg, 400));
  }

  const { name, email, password, role, phone, specialization, consultationFee } = req.body;

  // Block admin account creation via public API — admins are seeded only
  if (role === 'admin') {
    return next(new AppError('Admin accounts cannot be created via registration.', 403));
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return next(new AppError('An account with this email already exists.', 409));
  }

  // Doctors require specialization + fee at signup since they drive payment amounts.
  if (role === 'doctor' && (!specialization || consultationFee == null)) {
    return next(
      new AppError('Doctors must provide specialization and consultationFee at registration.', 400)
    );
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || 'patient',
    phone,
  });

  if (user.role === 'patient') {
    await Patient.create({ user: user._id });
  } else if (user.role === 'doctor') {
    await Doctor.create({
      user: user._id,
      specialization,
      consultationFee,
    });
  }

  sendAuthResponse(user, 201, res);
});

const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Email and password are required.', 400));
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Incorrect email or password.', 401));
  }

  if (!user.isActive) {
    return next(new AppError('This account has been deactivated.', 403));
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  sendAuthResponse(user, 200, res);
});

const logout = asyncHandler(async (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('token', 'loggedout', {
    expires: new Date(Date.now() + 1000),
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  });
  res.status(200).json({ status: 'success' });
});

const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ status: 'success', user: req.user.toSafeObject() });
});

module.exports = { register, login, logout, getMe };
