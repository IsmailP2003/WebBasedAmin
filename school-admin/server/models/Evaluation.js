const mongoose = require('mongoose');

// Stores SUS (System Usability Scale) survey responses
const evaluationSchema = new mongoose.Schema({
  respondentType: {
    type: String,
    enum: ['admin', 'teacher', 'student', 'proxy_user'],
    required: true,
  },
  // 10 SUS questions rated 1-5
  responses: {
    q1: { type: Number, min: 1, max: 5, required: true }, // I would like to use this system frequently
    q2: { type: Number, min: 1, max: 5, required: true }, // Unnecessarily complex
    q3: { type: Number, min: 1, max: 5, required: true }, // Easy to use
    q4: { type: Number, min: 1, max: 5, required: true }, // Need support to use
    q5: { type: Number, min: 1, max: 5, required: true }, // Well integrated
    q6: { type: Number, min: 1, max: 5, required: true }, // Too much inconsistency
    q7: { type: Number, min: 1, max: 5, required: true }, // Most people would learn quickly
    q8: { type: Number, min: 1, max: 5, required: true }, // Very cumbersome
    q9: { type: Number, min: 1, max: 5, required: true }, // Felt confident using
    q10: { type: Number, min: 1, max: 5, required: true }, // Needed to learn a lot before
  },
  // SUS score calculated server-side
  susScore: {
    type: Number,
    min: 0,
    max: 100,
  },
  rating: {
    type: String,
    enum: ['Excellent', 'Good', 'OK', 'Poor', 'Awful'],
  },
  openFeedback: {
    type: String,
    maxlength: [1000, 'Feedback cannot exceed 1000 characters'],
  },
  // Anonymised — no personal identifiers stored
}, { timestamps: true });

// Calculate SUS score before saving
evaluationSchema.pre('save', function (next) {
  const r = this.responses;
  // SUS formula: odd questions (1,3,5,7,9): score - 1; even (2,4,6,8,10): 5 - score; multiply sum by 2.5
  const sum =
    (r.q1 - 1) + (5 - r.q2) + (r.q3 - 1) + (5 - r.q4) + (r.q5 - 1) +
    (5 - r.q6) + (r.q7 - 1) + (5 - r.q8) + (r.q9 - 1) + (5 - r.q10);
  this.susScore = sum * 2.5;

  if (this.susScore >= 85) this.rating = 'Excellent';
  else if (this.susScore >= 71) this.rating = 'Good';
  else if (this.susScore >= 52) this.rating = 'OK';
  else if (this.susScore >= 39) this.rating = 'Poor';
  else this.rating = 'Awful';

  next();
});

module.exports = mongoose.model('Evaluation', evaluationSchema);
