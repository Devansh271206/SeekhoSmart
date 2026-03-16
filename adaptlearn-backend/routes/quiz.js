const express    = require('express');
const Quiz       = require('../models/Quiz');
const QuizResult = require('../models/QuizResult');
const User       = require('../models/User');
const Lesson     = require('../models/Lesson');
const { protect } = require('../middleware/auth');

const router = express.Router();

const PASS_THRESHOLD = 70; // percentage

/**
 * POST /api/quiz/:quizId/submit
 * Body: { answers: [{ questionId, selectedIndex }] }
 *
 * 1. Grades the submission
 * 2. Saves a QuizResult
 * 3. Updates user stats + completedLessons/completedTopics
 * 4. Returns score + per-question review
 */
router.post('/:quizId/submit', protect, async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    const { answers } = req.body; // [{ questionId, selectedIndex }]
    if (!Array.isArray(answers)) {
      return res.status(400).json({ success: false, message: '`answers` array is required' });
    }

    /* ── Grade ─────────────────────────────────────────────────────────── */
    let score = 0;
    const gradedAnswers = quiz.questions.map((question) => {
      const submission = answers.find(
        (a) => a.questionId?.toString() === question._id.toString()
      );
      const selectedIndex = submission?.selectedIndex ?? -1;
      const correctIndex  = question.options.findIndex((o) => o.isCorrect);
      const isCorrect     = selectedIndex === correctIndex;

      if (isCorrect) score += 1;

      return {
        questionId:    question._id,
        questionText:  question.text,
        selectedIndex,
        correctIndex,
        isCorrect,
        explanation:   question.explanation,
      };
    });

    const totalQuestions = quiz.questions.length;
    const percentage     = Math.round((score / totalQuestions) * 100);
    const passed         = percentage >= PASS_THRESHOLD;

    /* ── Persist result ────────────────────────────────────────────────── */
    const result = await QuizResult.create({
      user:   req.user._id,
      lesson: quiz.lesson,
      quiz:   quiz._id,
      score,
      totalQuestions,
      percentage,
      passed,
      answers: gradedAnswers,
    });

    /* ── Update user stats ─────────────────────────────────────────────── */
    const userUpdate = {
      $inc: {
        'stats.totalQuizzesTaken': 1,
        'stats.totalCorrect':      score,
        'stats.totalAnswered':     totalQuestions,
      },
    };

    // Mark lesson complete (if passed & not already marked)
    const user = await User.findById(req.user._id);
    const lessonAlreadyDone = user.completedLessons
      .map(String)
      .includes(quiz.lesson.toString());

    if (passed && !lessonAlreadyDone) {
      userUpdate.$addToSet = { completedLessons: quiz.lesson };
    }

    await User.findByIdAndUpdate(req.user._id, userUpdate);

    // Check if all lessons in the topic are now complete
    if (passed && !lessonAlreadyDone) {
      const lesson = await Lesson.findById(quiz.lesson);
      const allTopicLessons = await Lesson.find({ topic: lesson.topic }).select('_id');
      const allIds = allTopicLessons.map((l) => l._id.toString());

      const refreshedUser = await User.findById(req.user._id);
      const doneIds = refreshedUser.completedLessons.map(String);

      const topicComplete = allIds.every((id) => doneIds.includes(id));
      if (topicComplete) {
        await User.findByIdAndUpdate(req.user._id, {
          $addToSet: { completedTopics: lesson.topic },
        });
      }
    }

    /* ── Respond ───────────────────────────────────────────────────────── */
    res.status(201).json({
      success: true,
      data: {
        resultId:      result._id,
        score,
        totalQuestions,
        percentage,
        passed,
        answers:       gradedAnswers,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/quiz/result/:resultId
 * Retrieve a previously saved quiz result
 */
router.get('/result/:resultId', protect, async (req, res, next) => {
  try {
    const result = await QuizResult.findOne({
      _id:  req.params.resultId,
      user: req.user._id,  // users can only see their own results
    }).populate('lesson', 'title topic');

    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
