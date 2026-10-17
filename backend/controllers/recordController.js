const crypto = require('crypto');
const Record = require('../models/Record');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { uploadAttachment, getSignedUrl, deleteAttachment } = require('../utils/storage');

async function attachSignedUrls(record) {
  const obj = record.toObject ? record.toObject() : record;
  obj.attachments = await Promise.all(
    (obj.attachments || []).map(async (att) => ({
      ...att,
      url: await getSignedUrl(att.storagePath),
    }))
  );
  return obj;
}

// POST /api/records — create a record, optionally with file attachments
const createRecord = asyncHandler(async (req, res, next) => {
  const { patientId, type, title, description, recordDate, appointmentId, isConfidential } = req.body;

  let patient;
  if (req.user.role === 'patient') {
    patient = await Patient.findOne({ user: req.user._id });
  } else {
    if (!patientId) return next(new AppError('patientId is required.', 400));
    patient = await Patient.findById(patientId);
  }
  if (!patient) return next(new AppError('Patient not found.', 404));

  let doctor = null;
  if (req.user.role === 'doctor') {
    doctor = await Doctor.findOne({ user: req.user._id });
  }

  const attachments = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const storagePath = `${patient._id}/${Date.now()}-${crypto.randomUUID()}-${file.originalname}`;
      await uploadAttachment(file.buffer, storagePath, file.mimetype);
      attachments.push({
        storagePath,
        fileName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      });
    }
  }

  const record = await Record.create({
    patient: patient._id,
    doctor: doctor ? doctor._id : null,
    appointment: appointmentId || null,
    type: type || 'other',
    title,
    description,
    recordDate: recordDate || Date.now(),
    isConfidential: !!isConfidential,
    attachments,
    uploadedBy: req.user._id,
  });

  const withUrls = await attachSignedUrls(record);
  res.status(201).json({ status: 'success', record: withUrls });
});

// GET /api/records — list, scoped by role
const getRecords = asyncHandler(async (req, res, next) => {
  const filter = {};

  if (req.user.role === 'patient') {
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) return next(new AppError('Patient profile not found.', 404));
    filter.patient = patient._id;
  } else if (req.query.patientId) {
    filter.patient = req.query.patientId;
  }

  if (req.query.type) filter.type = req.query.type;

  const records = await Record.find(filter)
    .populate({ path: 'patient', populate: { path: 'user', select: 'name email' } })
    .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } })
    .sort({ recordDate: -1 });
  const withUrls = await Promise.all(records.map(attachSignedUrls));

  res.status(200).json({ status: 'success', count: withUrls.length, records: withUrls });
});

const getRecordById = asyncHandler(async (req, res, next) => {
  const record = await Record.findById(req.params.id);
  if (!record) return next(new AppError('Record not found.', 404));

  const withUrls = await attachSignedUrls(record);
  res.status(200).json({ status: 'success', record: withUrls });
});

const deleteRecord = asyncHandler(async (req, res, next) => {
  const record = await Record.findById(req.params.id);
  if (!record) return next(new AppError('Record not found.', 404));

  await Promise.all(record.attachments.map((att) => deleteAttachment(att.storagePath)));
  await record.deleteOne();

  res.status(200).json({ status: 'success', message: 'Record deleted.' });
});

module.exports = { createRecord, getRecords, getRecordById, deleteRecord };
