const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    // Path within the Supabase Storage bucket — NOT a signed URL.
    // Signed URLs are generated fresh on read (see utils/storage.js)
    // so they can't go stale or leak via the database.
    storagePath: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    sizeBytes: {
      type: Number,
      default: 0,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const recordSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      default: null, // null if patient self-uploaded
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null,
    },
    type: {
      type: String,
      enum: ['prescription', 'lab_report', 'diagnosis', 'imaging', 'vaccination', 'other'],
      default: 'other',
    },
    title: {
      type: String,
      required: [true, 'Record title is required'],
      trim: true,
    },
    description: {
      type: String,
      maxlength: 2000,
      default: '',
    },
    recordDate: {
      type: Date,
      default: Date.now,
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
    isConfidential: {
      type: Boolean,
      default: false,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

recordSchema.index({ patient: 1, recordDate: -1 });
recordSchema.index({ doctor: 1 });

module.exports = mongoose.model('Record', recordSchema);
