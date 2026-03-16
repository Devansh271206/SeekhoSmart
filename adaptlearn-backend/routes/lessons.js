const express = require('express');
const Lesson  = require('../models/Lesson');
const Quiz    = require('../models/Quiz');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/lessons/:id
 * Single lesson content
 */
router.get('/:id', async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate('topic', 'title icon');
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }
    res.json({ success: true, data: lesson });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/lessons/:id/quiz
 * Retrieve the quiz for a lesson
 * Strips isCorrect from options so answers aren't exposed
 */
router.get('/:id/quiz', async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ lesson: req.params.id });
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'No quiz for this lesson' });
    }

    // Remove isCorrect before sending to client
    const safeQuiz = {
      _id: quiz._id,
      lesson: quiz.lesson,
      questions: quiz.questions.map((q) => ({
        _id:         q._id,
        text:        q.text,
        options:     q.options.map((o) => ({ text: o.text })),
        explanation: q.explanation,
      })),
    };

    res.json({ success: true, data: safeQuiz });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/lessons/:id/next
 * Returns the next lesson in the same topic (adaptive navigation)
 */
router.get('/:id/next', async (req, res, next) => {
  try {
    const current = await Lesson.findById(req.params.id);
    if (!current) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    const next = await Lesson.findOne({
      topic: current.topic,
      order: { $gt: current.order },
    }).sort('order');

    res.json({ success: true, data: next || null });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
