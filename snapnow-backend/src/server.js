// src/server.js

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config();

// Initialize Firebase Admin FIRST
const { initializeFirebaseAdmin } = require('./config/firebase.admin');
initializeFirebaseAdmin();

// Import Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const postRoutes = require('./routes/post.routes');
const commentRoutes = require('./routes/comment.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const moderationRoutes = require('./routes/moderation.routes');
const settingsRoutes = require('./routes/settings.routes');

// Middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Initialize Express App
const app = express();

// Railway bắt buộc phải dùng PORT từ process.env.PORT
const PORT = process.env.PORT || 5000;

// ---------------------------
// Security Middleware
// ---------------------------
app.use(helmet());

// ---------------------------
// CORS Configuration
// ---------------------------
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*', // lúc test Railway để *, sau này gắn domain frontend
  credentials: true,
};
app.use(cors(corsOptions));

// ---------------------------
// Rate Limiting
// ---------------------------
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// ---------------------------
// Body parsers
// ---------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------------------------
// Compression
// ---------------------------
app.use(compression());

// ---------------------------
// Logging
// ---------------------------
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ---------------------------
// Health Check
// ---------------------------
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ---------------------------
// API Routes
// ---------------------------
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/reports', require('./routes/report.routes'));
app.use('/api/trends', require('./routes/trend.routes'));
app.use('/api/settings', settingsRoutes);

// Welcome Route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to SnapNow Dashboard API',
    version: '1.0.0',
    documentation: '/api',
    environment: process.env.NODE_ENV,
  });
});

// 404 Handler
app.use(notFound);

// Global Error Handler
app.use(errorHandler);

// ---------------------------
// Start Server
// ---------------------------
app.listen(PORT, () => {
  console.log(`🚀 SnapNow Dashboard API running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
