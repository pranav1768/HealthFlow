const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    date: {
      type: Date,
      required: [true, 'Appointment date is required'],
    },
    startTime: {
      type: String, // "10:30"
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    reasonForVisit: {
      type: String,
      maxlength: 500,
      default: '',
    },
    type: {
      type: String,
      enum: ['in_person', 'video'],
      default: 'in_person',
    },
    status: {
      type: String,
      enum: ['pending_payment', 'confirmed', 'completed', 'cancelled', 'no_show'],
      default: 'pending_payment',
    },
    // Snapshot of fee at booking time, in case doctor's fee changes later.
    consultationFeeSnapshot: {
      type: Number,
      required: true,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    cancellationReason: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
    rating: {
      score: { type: Number, min: 1, max: 5, default: null },
      review: { type: String, maxlength: 500, default: null },
      ratedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

appointmentSchema.index({ date: 1, doctor: 1 });
appointmentSchema.index({ patient: 1, date: -1 });
appointmentSchema.index({ status: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
