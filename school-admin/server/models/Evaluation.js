const mongoose = require('mongoose');

// SUS (System Usability Scale) survey response — stores raw answers and calculates
// the score automatically before saving.
const evaluationSchema = new mongoose.Schema({
  respondentType: {
    type: String,
    enum: ['admin', 'teacher', 'student', 'proxy_user'],
    required: true,
  },
  // Each question rated 1-5
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
  // Calculated automatically in the pre-save hook below
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
  // No name or user ID stored — responses are anonymous by design.
}, { timestamps: true });

// SUS score formula (Brooke, 1996):
// Odd questions are positively worded so: score - 1
// Even questions are negatively worded so: 5 - score
// Sum all 10 adjusted values, then multiply by 2.5 to get 0-100
evaluationSchema.pre('save', function (next) {
  const r = this.responses;
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
