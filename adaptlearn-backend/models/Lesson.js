const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema(
  {
    topic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      required: true,
    },
    title:    { type: String, required: true, trim: true },
    content:  { type: String, required: true },        // HTML or Markdown body
    order:    { type: Number, default: 0 },             // order within the topic
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
  },
  { timestamps: true }
);

// Composite index so we can paginate lessons per topic efficiently
lessonSchema.index({ topic: 1, order: 1 });

module.exports = mongoose.model('Lesson', lessonSchema);
