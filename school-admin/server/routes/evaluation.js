const express = require('express');
const Evaluation = require('../models/Evaluation');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// POST /api/evaluation — submit SUS survey
router.post('/', async (req, res, next) => {
  try {
    const { responses, respondentType, openFeedback } = req.body;
    if (!responses || Object.keys(responses).length !== 10) {
      return res.status(400).json({ success: false, message: 'All 10 SUS questions must be answered.' });
    }

    const evaluation = await Evaluation.create({ responses, respondentType, openFeedback });

    res.status(201).json({
      success: true,
      data: {
        susScore: evaluation.susScore,
        rating: evaluation.rating,
        message: 'Thank you for your feedback!',
      },
    });
  } catch (err) { next(err); }
});

// GET /api/evaluation/results — view all responses (Admin only)
router.get('/results', authorize('admin'), async (req, res, next) => {
  try {
    const results = await Evaluation.find().sort({ createdAt: -1 });
    const count = results.length;
    const avgScore = count > 0 ? Math.round(results.reduce((sum, r) => sum + r.susScore, 0) / count * 10) / 10 : 0;

    // Get overall rating
    let overallRating;
    if (avgScore >= 85) overallRating = 'Excellent';
    else if (avgScore >= 71) overallRating = 'Good';
    else if (avgScore >= 52) overallRating = 'OK';
    else if (avgScore >= 39) overallRating = 'Poor';
    else overallRating = 'Awful';

    res.json({
      success: true,
      data: { results, count, avgScore, overallRating },
    });
  } catch (err) { next(err); }
});

module.exports = router;
