const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const getAllowedOrigins = () => {
  const configured = process.env.FRONTEND_URL || 'http://localhost:5173';
  return configured.split(',').map((origin) => origin.trim()).filter(Boolean);
};

const corsOptions = {
  origin(origin, callback) {
    const allowedOrigins = getAllowedOrigins();
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    const error = new Error('Origin not allowed by CORS');
    error.statusCode = 403;
    return callback(error);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
};

const helmetMiddleware = helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://checkout.razorpay.com'],
      frameSrc: ["'self'", 'https://api.razorpay.com', 'https://checkout.razorpay.com'],
      connectSrc: ["'self'", 'https://api.razorpay.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"]
    }
  }
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX || 300),
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: false, message: 'Too many requests. Please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX || 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: false, message: 'Too many auth attempts. Please try again later.' }
});

const paymentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: Number(process.env.PAYMENT_RATE_LIMIT_MAX || 30),
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: false, message: 'Too many payment attempts. Please try again later.' }
});

const uploadOptions = {
  limits: {
    fileSize: Number(process.env.UPLOAD_FILE_SIZE_LIMIT || 2 * 1024 * 1024)
  },
  abortOnLimit: true,
  responseOnLimit: 'Uploaded file is too large'
};

module.exports = {
  corsOptions,
  helmetMiddleware,
  generalLimiter,
  authLimiter,
  paymentLimiter,
  uploadOptions
};
