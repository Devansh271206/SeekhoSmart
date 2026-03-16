const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    description: { type: String, default: '' },
    icon:        { type: String, default: '📚' },   // emoji or icon class
    color:       { type: String, default: '#6c63ff' }, // card accent colour
    order:       { type: Number, default: 0 },        // display sort order
  },
  { timestamps: true }
);

module.exports = mongoose.model('Topic', topicSchema);
