const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');

const authRoutes = require('./routes/auth');
const doctorRoutes = require('./routes/doctors');
const appointmentRoutes = require('./routes/appointments');
const recordRoutes = require('./routes/records');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');
const patientRoutes = require('./routes/patients');
const emergencyRoutes = require('./routes/emergency');
const { handleWebhook } = require('./controllers/paymentController');
const { generalLimiter } = require('./middleware/rateLimiters');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');

const app = express();

// Fix 12: Trust reverse proxy (Render, Railway, Heroku etc.)
// Without this, rate limiters see the proxy's internal IP instead of the real user IP
app.set('trust proxy', 1);

// Fix 4: Helmet with explicit Content-Security-Policy
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'checkout.razorpay.com'],
      frameSrc: ["'self'", 'api.razorpay.com', 'checkout.razorpay.com'],
      connectSrc: ["'self'", 'api.razorpay.com', '*.supabase.co'],
      imgSrc: ["'self'", 'data:', 'https:', '*.supabase.co'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", 'data:'],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Support multiple allowed origins: comma-separated in CLIENT_URL env var
// In development, allow any localhost port automatically
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      // In development, allow all localhost origins regardless of port
      if (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost')) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: Origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Razorpay webhook: MUST be raw before express.json()
app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  handleWebhook
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());

app.use('/api', generalLimiter);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'HealthFlow API is running.' });
});

app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/emergency', emergencyRoutes);

app.all('*', (req, res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
});

app.use(errorHandler);

module.exports = app;
