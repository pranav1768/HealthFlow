const crypto = require('crypto');
const { getRazorpayClient } = require('../config/razorpay');
const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { getIO } = require('../sockets');

const PLATFORM_FEE_RUPEES = 20; // flat platform fee — adjust as needed
const GST_RATE = 0.18; // 18% GST on (consultationFee + platformFee)

function rupeesToPaise(rupees) {
  return Math.round(rupees * 100);
}

/**
 * Computes the full breakdown server-side from the appointment's fee snapshot.
 * The client NEVER supplies an amount — this is the only source of truth.
 */
function computeBreakdown(consultationFeeRupees) {
  const consultationFee = rupeesToPaise(consultationFeeRupees);
  const platformFee = rupeesToPaise(PLATFORM_FEE_RUPEES);
  const gst = Math.round((consultationFee + platformFee) * GST_RATE);
  const total = consultationFee + platformFee + gst;
  return { consultationFee, platformFee, gst, total };
}

// POST /api/payments/create-order
const createOrder = asyncHandler(async (req, res, next) => {
  const { appointmentId } = req.body;
  if (!appointmentId) return next(new AppError('appointmentId is required.', 400));

  const patient = await Patient.findOne({ user: req.user._id });
  if (!patient) return next(new AppError('Patient profile not found.', 404));

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) return next(new AppError('Appointment not found.', 404));

  // Ownership check — a patient can only pay for their own appointment.
  if (String(appointment.patient) !== String(patient._id)) {
    return next(new AppError('This appointment does not belong to you.', 403));
  }

  if (appointment.status !== 'pending_payment') {
    return next(new AppError(`Appointment is not awaiting payment (status: ${appointment.status}).`, 400));
  }

  const breakdown = computeBreakdown(appointment.consultationFeeSnapshot);

  const razorpay = getRazorpayClient();
  const order = await razorpay.orders.create({
    amount: breakdown.total,
    currency: 'INR',
    receipt: `appt_${appointment._id}`,
    notes: {
      appointmentId: String(appointment._id),
      patientId: String(patient._id),
    },
  });

  const payment = await Payment.create({
    razorpayOrderId: order.id,
    appointment: appointment._id,
    patient: patient._id,
    amount: breakdown.total,
    currency: 'INR',
    breakdown: {
      consultationFee: breakdown.consultationFee,
      platformFee: breakdown.platformFee,
      gst: breakdown.gst,
    },
    status: 'created',
  });

  res.status(201).json({
    status: 'success',
    orderId: order.id,
    amount: breakdown.total,
    currency: 'INR',
    keyId: process.env.RAZORPAY_KEY_ID,
    breakdown: payment.breakdown,
    paymentRecordId: payment._id,
  });
});

// POST /api/payments/verify
const verifyPayment = asyncHandler(async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return next(new AppError('Missing Razorpay verification fields.', 400));
  }

  const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
  if (!payment) return next(new AppError('Payment record not found for this order.', 404));

  // HMAC SHA256 per Razorpay's documented checkout verification scheme:
  // expected = HMAC_SHA256(order_id + "|" + payment_id, key_secret)
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  // timingSafeEqual throws on length mismatch rather than returning false —
  // guard explicitly so a malformed/short signature is a clean rejection,
  // not a 500.
  let isValid = false;
  try {
    isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf8'),
      Buffer.from(razorpay_signature, 'utf8')
    );
  } catch (_lengthMismatch) {
    isValid = false;
  }

  if (!isValid) {
    payment.status = 'failed';
    payment.failureReason = 'Signature verification failed.';
    await payment.save();
    return next(new AppError('Payment signature verification failed.', 400));
  }

  payment.razorpayPaymentId = razorpay_payment_id;
  payment.razorpaySignature = razorpay_signature;
  payment.status = 'paid';
  await payment.save();

  const appointment = await Appointment.findByIdAndUpdate(
    payment.appointment,
    { status: 'confirmed', payment: payment._id },
    { new: true }
  );

  // Live-update the doctor's appointments list.
  try {
    if (appointment) {
      const doctor = await Doctor.findById(appointment.doctor).select('_id');
      if (doctor) {
        getIO().to(`doctor:${doctor._id}`).emit('appointment:confirmed', {
          appointmentId: appointment._id,
          patientId: appointment.patient,
        });
      }
    }
  } catch (_socketErr) {
    // Socket emission failure should never fail the payment response — continue silently
  }

  res.status(200).json({ status: 'success', payment, appointment });
});

// POST /api/payments/webhook
// Source of truth for async events (payment.captured, payment.failed, refund.*).
// This is what flips status if the user closes the tab before /verify completes.
const handleWebhook = asyncHandler(async (req, res, next) => {
  const signature = req.headers['x-razorpay-signature'];
  if (!signature) return next(new AppError('Missing webhook signature.', 400));

  // req.body must be the raw buffer here — see server.js route wiring,
  // which mounts this route with express.raw() before the JSON parser.
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(req.body) // raw buffer
    .digest('hex');

  const isValid = (() => {
    try {
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'utf8'),
        Buffer.from(signature, 'utf8')
      );
    } catch (_lengthMismatch) {
      return false;
    }
  })();

  if (!isValid) {
    return next(new AppError('Invalid webhook signature.', 400));
  }

  const payload = JSON.parse(req.body.toString('utf8'));
  const event = payload.event;

  const orderId =
    payload.payload?.payment?.entity?.order_id ||
    payload.payload?.order?.entity?.id;

  if (orderId) {
    const payment = await Payment.findOne({ razorpayOrderId: orderId });
    if (payment) {
      payment.webhookEvents.push({ event });

      if (event === 'payment.captured') {
        payment.status = 'paid';
        payment.razorpayPaymentId = payload.payload.payment.entity.id;
        payment.method = payload.payload.payment.entity.method || payment.method;
        await Appointment.findByIdAndUpdate(payment.appointment, {
          status: 'confirmed',
          payment: payment._id,
        });
      } else if (event === 'payment.failed') {
        payment.status = 'failed';
        payment.failureReason = payload.payload.payment.entity.error_description || 'Payment failed.';
      } else if (event.startsWith('refund.')) {
        payment.status = 'refunded';
      }

      await payment.save();
    }
  }

  // Razorpay just needs a 200 to know we received it.
  res.status(200).json({ status: 'ok' });
});

// GET /api/payments/:id/status — explicit poll, not silent retry.
const getPaymentStatus = asyncHandler(async (req, res, next) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) return next(new AppError('Payment not found.', 404));

  const patient = await Patient.findOne({ user: req.user._id });
  const isOwner = patient && String(payment.patient) === String(patient._id);
  if (!isOwner && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to view this payment.', 403));
  }

  res.status(200).json({
    status: 'success',
    paymentStatus: payment.status,
    payment,
  });
});

// GET /api/payments/history
const getPaymentHistory = asyncHandler(async (req, res, next) => {
  const { status, from, to, page = 1, limit = 20 } = req.query;
  const filter = {};

  if (req.user.role === 'patient') {
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) return next(new AppError('Patient profile not found.', 404));
    filter.patient = patient._id;
  }
  // admin: no patient filter, sees all

  if (status) filter.status = status;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .populate({ path: 'appointment', select: 'date startTime doctor' })
      .populate({ path: 'patient', populate: { path: 'user', select: 'name email' } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Payment.countDocuments(filter),
  ]);

  res.status(200).json({
    status: 'success',
    count: payments.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    payments,
  });
});

module.exports = {
  createOrder,
  verifyPayment,
  handleWebhook,
  getPaymentStatus,
  getPaymentHistory,
};
