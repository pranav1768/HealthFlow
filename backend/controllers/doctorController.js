const Doctor = require('../models/Doctor');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/doctors — public search with filters
const searchDoctors = asyncHandler(async (req, res) => {
  const { specialization, search, minRating, page = 1, limit = 20 } = req.query;
  // Only show verified, accepting doctors in public search
  const filter = { isAcceptingAppointments: true, isVerified: true };

  if (specialization) filter.specialization = new RegExp(specialization, 'i');
  if (minRating) filter['rating.average'] = { $gte: Number(minRating) };

  let query = Doctor.find(filter).populate('user', 'name avatarUrl');

  if (search) {
    const userIds = await User.find({ name: new RegExp(search, 'i'), role: 'doctor' }).select('_id');
    query = Doctor.find({
      ...filter,
      $or: [{ specialization: new RegExp(search, 'i') }, { user: { $in: userIds.map((u) => u._id) } }],
    }).populate('user', 'name avatarUrl');
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [doctors, total] = await Promise.all([
    query.skip(skip).limit(Number(limit)).sort({ 'rating.average': -1 }),
    Doctor.countDocuments(filter),
  ]);

  res.status(200).json({ status: 'success', count: doctors.length, total, doctors });
});

const getDoctorById = asyncHandler(async (req, res, next) => {
  const doctor = await Doctor.findById(req.params.id).populate('user', 'name avatarUrl email phone');
  if (!doctor) return next(new AppError('Doctor not found.', 404));
  res.status(200).json({ status: 'success', doctor });
});

const getMyDoctorProfile = asyncHandler(async (req, res, next) => {
  const doctor = await Doctor.findOne({ user: req.user._id }).populate('user', 'name email phone avatarUrl');
  if (!doctor) return next(new AppError('Doctor profile not found.', 404));
  res.status(200).json({ status: 'success', doctor });
});

const updateMyDoctorProfile = asyncHandler(async (req, res, next) => {
  const allowedFields = [
    'specialization',
    'qualifications',
    'bio',
    'consultationFee',
    'clinicAddress',
    'languagesSpoken',
    'isAcceptingAppointments',
  ];
  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const doctor = await Doctor.findOneAndUpdate({ user: req.user._id }, updates, {
    new: true,
    runValidators: true,
  });
  if (!doctor) return next(new AppError('Doctor profile not found.', 404));

  res.status(200).json({ status: 'success', doctor });
});

const updateMyAvailability = asyncHandler(async (req, res, next) => {
  const { availability } = req.body;
  if (!Array.isArray(availability)) {
    return next(new AppError('availability must be an array.', 400));
  }

  const doctor = await Doctor.findOneAndUpdate(
    { user: req.user._id },
    { availability },
    { new: true, runValidators: true }
  );
  if (!doctor) return next(new AppError('Doctor profile not found.', 404));

  res.status(200).json({ status: 'success', doctor });
});

module.exports = {
  searchDoctors,
  getDoctorById,
  getMyDoctorProfile,
  updateMyDoctorProfile,
  updateMyAvailability,
};
