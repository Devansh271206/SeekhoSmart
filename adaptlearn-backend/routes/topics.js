const express = require('express');
const Topic   = require('../models/Topic');
const Lesson  = require('../models/Lesson');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/topics
 * List all topics (public — used on topics.html)
 */
router.get('/', async (req, res, next) => {
  try {
    const topics = await Topic.find().sort('order');
    res.json({ success: true, data: topics });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/topics/:id
 * Single topic details
 */
router.get('/:id', async (req, res, next) => {
  try {
    const topic = await Topic.findById(req.params.id);
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }
    res.json({ success: true, data: topic });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/topics/:id/lessons
 * All lessons for a topic (ordered)
 */
router.get('/:id/lessons', async (req, res, next) => {
  try {
    const lessons = await Lesson.find({ topic: req.params.id }).sort('order');
    res.json({ success: true, data: lessons });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
