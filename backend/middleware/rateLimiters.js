const rateLimit = require('express-rate-limit');

// Auth routes: brute-force protection on login/register/password-reset.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'fail',
    message: 'Too many auth attempts. Please try again in 15 minutes.',
  },
});

// Payment routes: highest-risk surface — tight limit on order creation/verification.
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'fail',
    message: 'Too many payment requests. Please try again shortly.',
  },
});

// General API limiter — generous, just a backstop.
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, paymentLimiter, generalLimiter };
