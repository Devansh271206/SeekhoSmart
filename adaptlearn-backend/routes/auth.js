const express = require('express');
const jwt     = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const User        = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

/** Sign and return a JWT for the given user id */
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

/** Send token + basic user info */
const sendAuthResponse = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id:    user._id,
      name:  user.name,
      email: user.email,
    },
  });
};

/* ─── Validation chains ───────────────────────────────────────────────────── */

const signupValidation = [
  body('name')
    .trim().notEmpty().withMessage('Name is required')
    .isLength({ max: 80 }).withMessage('Name max 80 characters'),
  body('email')
    .isEmail().withMessage('Valid email required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

/* ─── Routes ──────────────────────────────────────────────────────────────── */

/**
 * POST /api/auth/signup
 * Register a new user
 */
router.post('/signup', signupValidation, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }

    const user = await User.create({ name, email, password });
    sendAuthResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/login
 * Authenticate an existing user
 */
router.post('/login', loginValidation, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { email, password } = req.body;

    // Explicitly select password (it's excluded by default)
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    sendAuthResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me
 * Return current authenticated user's profile
 */
router.get('/me', protect, async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('completedTopics', 'title icon')
    .populate('completedLessons', 'title topic');

  res.json({ success: true, user });
});

module.exports = router;
