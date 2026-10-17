const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// Patient books a slot. Status starts as 'pending_payment' — it only becomes
// 'confirmed' once Payment verification succeeds (see paymentController).
const createAppointment = asyncHandler(async (req, res, next) => {
  const { doctorId, date, startTime, endTime, reasonForVisit, type } = req.body;

  if (!doctorId || !date || !startTime || !endTime) {
    return next(new AppError('doctorId, date, startTime and endTime are required.', 400));
  }

  // Prevent booking in the past
  const bookingDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (bookingDate < today) {
    return next(new AppError('Cannot book an appointment for a past date.', 400));
  }

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) return next(new AppError('Doctor not found.', 404));
  if (!doctor.isAcceptingAppointments) {
    return next(new AppError('This doctor is not currently accepting appointments.', 400));
  }

  const patient = await Patient.findOne({ user: req.user._id });
  if (!patient) return next(new AppError('Patient profile not found.', 404));

  // Prevent double-booking the same doctor/date/startTime.
  const clash = await Appointment.findOne({
    doctor: doctorId,
    date: new Date(date),
    startTime,
    status: { $in: ['pending_payment', 'confirmed'] },
  });
  if (clash) {
    return next(new AppError('This slot is no longer available.', 409));
  }

  const appointment = await Appointment.create({
    patient: patient._id,
    doctor: doctorId,
    date,
    startTime,
    endTime,
    reasonForVisit,
    type: type || 'in_person',
    consultationFeeSnapshot: doctor.consultationFee,
    status: 'pending_payment',
  });

  res.status(201).json({ status: 'success', appointment });
});

const getMyAppointments = asyncHandler(async (req, res, next) => {
  const { status } = req.query;
  let filter = {};

  if (req.user.role === 'patient') {
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) return next(new AppError('Patient profile not found.', 404));
    filter.patient = patient._id;
  } else if (req.user.role === 'doctor') {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) return next(new AppError('Doctor profile not found.', 404));
    filter.doctor = doctor._id;
  }
  // admin: no filter, sees all

  if (status) filter.status = status;

  const appointments = await Appointment.find(filter)
    .populate({ path: 'patient', populate: { path: 'user', select: 'name email phone' } })
    .populate({ path: 'doctor', populate: { path: 'user', select: 'name email phone' } })
    .sort({ date: -1 });

  res.status(200).json({ status: 'success', count: appointments.length, appointments });
});

const getAppointmentById = asyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate({ path: 'patient', populate: { path: 'user', select: 'name email phone' } })
    .populate({ path: 'doctor', populate: { path: 'user', select: 'name email phone' } });

  if (!appointment) return next(new AppError('Appointment not found.', 404));
  res.status(200).json({ status: 'success', appointment });
});

const updateAppointmentStatus = asyncHandler(async (req, res, next) => {
  const { status, cancellationReason } = req.body;
  const validStatuses = ['confirmed', 'completed', 'cancelled', 'no_show'];

  if (!validStatuses.includes(status)) {
    return next(new AppError('Invalid status value.', 400));
  }

  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) return next(new AppError('Appointment not found.', 404));

  appointment.status = status;
  if (status === 'cancelled') {
    appointment.cancelledBy = req.user._id;
    appointment.cancellationReason = cancellationReason || null;
  }
  await appointment.save();

  res.status(200).json({ status: 'success', appointment });
});

const rateAppointment = asyncHandler(async (req, res, next) => {
  const { score, review } = req.body;
  if (!score || score < 1 || score > 5) {
    return next(new AppError('Score must be between 1 and 5.', 400));
  }

  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) return next(new AppError('Appointment not found.', 404));
  if (appointment.status !== 'completed') {
    return next(new AppError('You can only rate completed appointments.', 400));
  }
  if (appointment.rating?.score) {
    return next(new AppError('You have already rated this appointment.', 400));
  }

  // Verify the patient owns this appointment
  const patient = await Patient.findOne({ user: req.user._id });
  if (!patient || appointment.patient.toString() !== patient._id.toString()) {
    return next(new AppError('Not authorised to rate this appointment.', 403));
  }

  appointment.rating = { score, review: review?.trim() || null, ratedAt: new Date() };
  await appointment.save();

  // Recalculate doctor's average rating
  const allRated = await Appointment.find({
    doctor: appointment.doctor,
    'rating.score': { $ne: null },
  }).select('rating.score');

  const avg = allRated.reduce((s, a) => s + a.rating.score, 0) / allRated.length;
  await Doctor.findByIdAndUpdate(appointment.doctor, {
    'rating.average': Math.round(avg * 10) / 10,
    'rating.count': allRated.length,
  });

  res.status(200).json({ status: 'success', appointment });
});

module.exports = {
  createAppointment,
  getMyAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  rateAppointment,
};
