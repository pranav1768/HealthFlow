const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    razorpayOrderId: {
      type: String,
      required: true,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    razorpaySignature: {
      type: String,
      default: null,
      select: false, // not needed after verification, no reason to load by default
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    // Amount in paise (Razorpay's native unit) — integer, never a float rupee value.
    amount: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'amount must be an integer (paise)',
      },
    },
    currency: {
      type: String,
      default: 'INR',
    },
    breakdown: {
      consultationFee: { type: Number, required: true }, // paise
      platformFee: { type: Number, required: true, default: 0 }, // paise
      gst: { type: Number, required: true, default: 0 }, // paise
    },
    method: {
      type: String,
      enum: ['upi', 'card', 'netbanking', 'wallet', 'pay_at_clinic', null],
      default: null, // unknown until Razorpay reports it back
    },
    status: {
      type: String,
      enum: ['created', 'pending', 'paid', 'failed', 'refunded'],
      default: 'created',
    },
    failureReason: {
      type: String,
      default: null,
    },
    // Raw webhook event log — useful for support/debugging without re-querying Razorpay.
    webhookEvents: {
      type: [
        {
          event: String,
          receivedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

paymentSchema.index({ razorpayOrderId: 1, status: 1 });
paymentSchema.index({ patient: 1, createdAt: -1 });
paymentSchema.index({ appointment: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
