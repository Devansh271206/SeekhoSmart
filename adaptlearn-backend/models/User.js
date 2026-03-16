const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never return password in queries
    },
    // Adaptive learning state
    completedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
    completedTopics:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topic'  }],
    // Overall stats
    stats: {
      totalQuizzesTaken: { type: Number, default: 0 },
      totalCorrect:      { type: Number, default: 0 },
      totalAnswered:     { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance method — compare password
userSchema.methods.matchPassword = async function (candidatePwd) {
  return bcrypt.compare(candidatePwd, this.password);
};

module.exports = mongoose.model('User', userSchema);
