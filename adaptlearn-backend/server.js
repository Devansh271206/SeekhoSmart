require('dotenv').config();

const express    = require('express');
const path       = require('path');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');

const connectDB      = require('./config/db');
const errorHandler   = require('./middleware/errorHandler');

const authRoutes     = require('./routes/auth');
const topicsRoutes   = require('./routes/topics');
const lessonsRoutes  = require('./routes/lessons');
const quizRoutes     = require('./routes/quiz');
const progressRoutes = require('./routes/progress');

/* ── Connect DB ───────────────────────────────────────────────────────────── */
connectDB();

/* ── App setup ────────────────────────────────────────────────────────────── */
const app = express();

// Security headers
app.use(helmet());

// CORS — allow your frontend origin
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Parse JSON bodies
app.use(express.json({ limit: '10kb' }));

// HTTP request logging (dev only)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Global rate limiter — 100 requests / 15 min per IP
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
  })
);

// Serve static files from the parent directory (frontend)
app.use(express.static(path.join(__dirname, '..')));

/* ── Routes ───────────────────────────────────────────────────────────────── */
app.use('/api/auth',     authRoutes);
app.use('/api/topics',   topicsRoutes);
app.use('/api/lessons',  lessonsRoutes);
app.use('/api/quiz',     quizRoutes);
app.use('/api/progress', progressRoutes);

// Health check
app.get('/api/health', (_req, res) =>
  res.json({ success: true, message: 'AdaptLearn API is running 🚀' })
);

// 404 catch-all
app.use((_req, res) =>
  res.status(404).json({ success: false, message: 'Route not found' })
);

/* ── Global error handler ─────────────────────────────────────────────────── */
app.use(errorHandler);

/* ── Start server ─────────────────────────────────────────────────────────── */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀  Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
