const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    questionId:      { type: mongoose.Schema.Types.ObjectId, required: true },
    questionText:    { type: String },
    selectedIndex:   { type: Number },        // index of chosen option
    isCorrect:       { type: Boolean },
    correctIndex:    { type: Number },        // index of the right option
    explanation:     { type: String },
  },
  { _id: false }
);

const quizResultSchema = new mongoose.Schema(
  {
    user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
    quiz:   { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz',   required: true },

    score:          { type: Number, required: true },  // number correct
    totalQuestions: { type: Number, required: true },
    percentage:     { type: Number, required: true },  // 0–100

    answers: [answerSchema],
    passed:  { type: Boolean, default: false },        // ≥ 70 % = pass
  },
  { timestamps: true }
);

// Index for fast progress queries
quizResultSchema.index({ user: 1, lesson: 1 });
quizResultSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('QuizResult', quizResultSchema);
