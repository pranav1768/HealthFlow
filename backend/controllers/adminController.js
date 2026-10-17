const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const getAllUsers = asyncHandler(async (req, res) => {
  const { role, search, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (search) filter.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];

  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(filter).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
    User.countDocuments(filter),
  ]);

  // Attach doctorId + isVerified for doctor rows so admin can verify them
  const doctorUsers = users.filter(u => u.role === 'doctor');
  const doctorProfiles = doctorUsers.length
    ? await Doctor.find({ user: { $in: doctorUsers.map(u => u._id) } }).select('user isVerified')
    : [];
  const doctorMap = {};
  doctorProfiles.forEach(d => { doctorMap[d.user.toString()] = d; });

  const enriched = users.map(u => {
    const obj = u.toObject();
    if (u.role === 'doctor' && doctorMap[u._id.toString()]) {
      obj.doctorId = doctorMap[u._id.toString()]._id;
      obj.isVerified = doctorMap[u._id.toString()].isVerified;
    }
    return obj;
  });

  res.status(200).json({ status: 'success', count: users.length, total, users: enriched });
});

const updateUserStatus = asyncHandler(async (req, res, next) => {
  const { isActive } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
  if (!user) return next(new AppError('User not found.', 404));
  res.status(200).json({ status: 'success', user: user.toSafeObject() });
});

const verifyDoctor = asyncHandler(async (req, res, next) => {
  const doctor = await Doctor.findByIdAndUpdate(req.params.id, { isVerified: true }, { new: true });
  if (!doctor) return next(new AppError('Doctor not found.', 404));
  res.status(200).json({ status: 'success', doctor });
});

const getAnalytics = asyncHandler(async (req, res) => {
  const { period = 'all' } = req.query;

  // Compute date range from period param
  const now = new Date();
  let dateFrom = null;
  if (period === '7d') dateFrom = new Date(now - 7 * 24 * 60 * 60 * 1000);
  else if (period === '1m') dateFrom = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  else if (period === '6m') dateFrom = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
  else if (period === '1y') dateFrom = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

  const dateFilter = dateFrom ? { createdAt: { $gte: dateFrom } } : {};
  const apptDateFilter = dateFrom ? { date: { $gte: dateFrom } } : {};

  const [totalPatients, totalDoctors, totalAppointments, appointmentsByStatus, revenueAgg] =
    await Promise.all([
      Patient.countDocuments(dateFilter),
      Doctor.countDocuments(dateFilter),
      Appointment.countDocuments(apptDateFilter),
      Appointment.aggregate([
        { $match: apptDateFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Payment.aggregate([
        { $match: { status: 'paid', ...(dateFrom ? { createdAt: { $gte: dateFrom } } : {}) } },
        { $group: { _id: null, totalPaise: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
    ]);

  const revenue = revenueAgg[0] || { totalPaise: 0, count: 0 };

  res.status(200).json({
    status: 'success',
    analytics: {
      totalPatients,
      totalDoctors,
      totalAppointments,
      period,
      appointmentsByStatus: appointmentsByStatus.reduce((acc, row) => {
        acc[row._id] = row.count;
        return acc;
      }, {}),
      totalRevenueRupees: revenue.totalPaise / 100,
      totalPaidTransactions: revenue.count,
    },
  });
});

module.exports = { getAllUsers, updateUserStatus, verifyDoctor, getAnalytics };
