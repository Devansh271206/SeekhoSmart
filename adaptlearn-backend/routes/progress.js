const express    = require('express');
const User       = require('../models/User');
const QuizResult = require('../models/QuizResult');
const Lesson     = require('../models/Lesson');
const Topic      = require('../models/Topic');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/progress
 * Full progress summary for the logged-in user
 * Used by progress.html and dashboard.html
 */
router.get('/', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('completedLessons', 'title topic difficulty')
      .populate('completedTopics',  'title icon color');

    // Count totals
    const totalTopics  = await Topic.countDocuments();
    const totalLessons = await Lesson.countDocuments();

    const completedLessonsCount = user.completedLessons.length;
    const completedTopicsCount  = user.completedTopics.length;

    const overallPct = totalLessons > 0
      ? Math.round((completedLessonsCount / totalLessons) * 100)
      : 0;

    const accuracy = user.stats.totalAnswered > 0
      ? Math.round((user.stats.totalCorrect / user.stats.totalAnswered) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        stats: {
          totalLessons:     completedLessonsCount,
          totalTopics:      completedTopicsCount,
          accuracy,
          totalQuizzes:     user.stats.totalQuizzesTaken,
          overallPct,
          availableTopics:  totalTopics,
          availableLessons: totalLessons,
        },
        completedTopics:  user.completedTopics,
        completedLessons: user.completedLessons,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/progress/recommended
 * Returns up to 4 recommended (incomplete) lessons for the dashboard
 * Adaptive logic: prioritise lessons whose topic the user has started
 */
router.get('/recommended', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const doneIds = user.completedLessons.map(String);

    // Lessons not yet completed
    const remaining = await Lesson.find({
      _id: { $nin: doneIds },
    })
      .sort('order')
      .populate('topic', 'title icon color')
      .lean();

    // Boost lessons whose topic the user has already started
    const startedTopicIds = new Set(
      (await Lesson.find({ _id: { $in: doneIds } }).distinct('topic')).map(String)
    );

    const scored = remaining.map((l) => ({
      ...l,
      _score: startedTopicIds.has(l.topic._id.toString()) ? 1 : 0,
    }));

    scored.sort((a, b) => b._score - a._score || a.order - b.order);

    const recommended = scored.slice(0, 4).map(({ _score, ...l }) => l);

    res.json({ success: true, data: recommended });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/progress/history
 * Last 20 quiz attempts by the user
 */
router.get('/history', protect, async (req, res, next) => {
  try {
    const results = await QuizResult.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('lesson', 'title');

    res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
