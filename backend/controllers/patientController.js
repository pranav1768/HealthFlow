const Patient = require('../models/Patient');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const getMyProfile = asyncHandler(async (req, res, next) => {
  const patient = await Patient.findOne({ user: req.user._id }).populate('user', 'name email phone avatarUrl');
  if (!patient) return next(new AppError('Patient profile not found.', 404));
  res.status(200).json({ status: 'success', patient });
});

const updateMyProfile = asyncHandler(async (req, res, next) => {
  const { name, phone, dateOfBirth, gender, bloodGroup, allergies, chronicConditions } = req.body;

  // Update User fields
  if (name || phone) {
    const userUpdates = {};
    if (name) userUpdates.name = name;
    if (phone) userUpdates.phone = phone;
    await User.findByIdAndUpdate(req.user._id, userUpdates, { runValidators: true });
  }

  // Update Patient fields
  const patientUpdates = {};
  if (dateOfBirth) patientUpdates.dateOfBirth = new Date(dateOfBirth);
  if (gender) patientUpdates.gender = gender;
  if (bloodGroup) patientUpdates.bloodGroup = bloodGroup;
  if (allergies) patientUpdates.allergies = typeof allergies === 'string' ? allergies.split(',').map(s => s.trim()).filter(Boolean) : allergies;
  if (chronicConditions) patientUpdates.chronicConditions = typeof chronicConditions === 'string' ? chronicConditions.split(',').map(s => s.trim()).filter(Boolean) : chronicConditions;

  const patient = await Patient.findOneAndUpdate(
    { user: req.user._id },
    patientUpdates,
    { new: true, runValidators: true }
  ).populate('user', 'name email phone');

  if (!patient) return next(new AppError('Patient profile not found.', 404));
  res.status(200).json({ status: 'success', patient });
});

const changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return next(new AppError('Both currentPassword and newPassword are required.', 400));
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    return next(new AppError('Current password is incorrect.', 401));
  }

  user.password = newPassword;
  await user.save();
  res.status(200).json({ status: 'success', message: 'Password updated successfully.' });
});

module.exports = { getMyProfile, updateMyProfile, changePassword };
