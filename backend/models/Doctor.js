const mongoose = require('mongoose');

const availabilitySlotSchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: Number, // 0 = Sunday ... 6 = Saturday
      required: true,
      min: 0,
      max: 6,
    },
    startTime: {
      type: String, // "09:00" 24hr format
      required: true,
    },
    endTime: {
      type: String, // "17:00"
      required: true,
    },
    slotDurationMinutes: {
      type: Number,
      default: 30,
    },
  },
  { _id: false }
);

const doctorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      trim: true,
    },
    qualifications: {
      type: [String],
      default: [],
    },
    registrationNumber: {
      type: String,
      trim: true,
    },
    yearsOfExperience: {
      type: Number,
      default: 0,
      min: 0,
    },
    bio: {
      type: String,
      maxlength: 1000,
      default: '',
    },
    // Server-side source of truth for payment amount — never trust client.
    consultationFee: {
      type: Number, // INR, whole rupees (converted to paise at order-create time)
      required: [true, 'Consultation fee is required'],
      min: 0,
    },
    clinicAddress: {
      line1: String,
      city: String,
      state: String,
      pincode: String,
    },
    languagesSpoken: {
      type: [String],
      default: ['English'],
    },
    availability: {
      type: [availabilitySlotSchema],
      default: [],
    },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isAcceptingAppointments: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

doctorSchema.index({ user: 1 }, { unique: true });
doctorSchema.index({ specialization: 1 });
doctorSchema.index({ 'rating.average': -1 });

module.exports = mongoose.model('Doctor', doctorSchema);
