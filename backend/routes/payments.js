const express = require('express');
const {
  createOrder,
  verifyPayment,
  handleWebhook,
  getPaymentStatus,
  getPaymentHistory,
} = require('../controllers/paymentController');
const { protect, restrictTo } = require('../middleware/auth');
const { paymentLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

// NOTE: /webhook is intentionally NOT mounted on this router.
// It needs express.raw() body parsing (for HMAC verification against the
// exact raw bytes Razorpay signed) and must NOT pass through express.json()
// first. It's mounted directly in server.js before the global JSON parser.
// See server.js for the route wiring and rationale.

router.use(protect);
router.use(paymentLimiter);

router.post('/create-order', restrictTo('patient'), createOrder);
router.post('/verify', restrictTo('patient'), verifyPayment);
// IMPORTANT: /history must be before /:id/status — otherwise Express matches /:id = 'history'
router.get('/history', getPaymentHistory);
router.get('/:id/status', getPaymentStatus);

module.exports = router;
