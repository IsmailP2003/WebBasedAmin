const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student is required'],
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required'],
  },
  assessmentName: {
    type: String,
    required: [true, 'Assessment name is required'],
    trim: true,
    maxlength: [100, 'Assessment name cannot exceed 100 characters'],
  },
  assessmentType: {
    type: String,
    enum: ['assignment', 'exam', 'quiz', 'project', 'presentation', 'other'],
    default: 'assignment',
  },
  score: {
    type: Number,
    required: [true, 'Score is required'],
    min: [0, 'Score cannot be negative'],
  },
  maxScore: {
    type: Number,
    required: [true, 'Max score is required'],
    min: [1, 'Max score must be at least 1'],
  },
  feedback: {
    type: String,
    trim: true,
    maxlength: [500, 'Feedback cannot exceed 500 characters'],
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  gradedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Virtual: percentage
gradeSchema.virtual('percentage').get(function () {
  return Math.round((this.score / this.maxScore) * 100);
});

// Virtual: letter grade
gradeSchema.virtual('letterGrade').get(function () {
  const pct = (this.score / this.maxScore) * 100;
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  return 'F';
});

gradeSchema.set('toJSON', { virtuals: true });
gradeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Grade', gradeSchema);
