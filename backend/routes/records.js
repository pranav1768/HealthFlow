const express = require('express');
const { createRecord, getRecords, getRecordById, deleteRecord } = require('../controllers/recordController');
const { protect, restrictTo } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(protect);

router.post('/', restrictTo('patient', 'doctor'), upload.array('attachments', 5), createRecord);
router.get('/', getRecords);
router.get('/:id', getRecordById);
router.delete('/:id', restrictTo('patient', 'doctor', 'admin'), deleteRecord);

module.exports = router;
