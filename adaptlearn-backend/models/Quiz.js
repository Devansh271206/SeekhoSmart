const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema(
  {
    text:      { type: String, required: true },
    isCorrect: { type: Boolean, default: false },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    text:    { type: String, required: true },
    options: {
      type: [optionSchema],
      validate: {
        validator: (arr) => arr.length >= 2 && arr.length <= 6,
        message: 'Each question must have 2–6 options',
      },
    },
    explanation: { type: String, default: '' }, // shown in results review
  },
  { _id: true }
);

const quizSchema = new mongoose.Schema(
  {
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
      unique: true,  // one quiz per lesson
    },
    questions: {
      type: [questionSchema],
      validate: {
        validator: (arr) => arr.length >= 1,
        message: 'A quiz must have at least one question',
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Quiz', quizSchema);
