const Doctor = require('../models/Doctor');
const { getIO } = require('../sockets');
const AppError = require('../utils/AppError');

const VALID_TYPES = [
  'cardiac_arrest',
  'respiratory_failure',
  'severe_bleeding',
  'anaphylaxis',
  'stroke',
  'other',
];

exports.triggerEmergency = async (req, res, next) => {
  try {
    const { type, note, patientName } = req.body;

    if (!type || !VALID_TYPES.includes(type)) {
      return next(new AppError('Invalid emergency type.', 400));
    }

    // Get doctor profile for the alert payload
    const doctor = await Doctor.findOne({ user: req.user._id })
      .populate('user', 'name')
      .select('specialization hospital');

    if (!doctor) return next(new AppError('Doctor profile not found.', 404));

    const alert = {
      id: Date.now().toString(),
      type,
      note: note?.trim() || null,
      patientName: patientName?.trim() || null,
      doctor: {
        name: doctor.user.name,
        specialization: doctor.specialization,
        hospital: doctor.hospital,
      },
      triggeredAt: new Date().toISOString(),
    };

    // Broadcast to all connected admins
    const io = getIO();
    io.to('admin').emit('emergency:alert', alert);

    res.status(200).json({ status: 'success', message: 'Emergency alert sent.', alert });
  } catch (err) {
    next(err);
  }
};
