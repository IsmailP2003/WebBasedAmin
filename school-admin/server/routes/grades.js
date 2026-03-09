const express = require('express');
const { body, validationResult } = require('express-validator');
const Grade = require('../models/Grade');
const { protect, authorize } = require('../middleware/auth');
const { createAuditEntry } = require('../utils/auditLogger');

const router = express.Router();
router.use(protect);

// GET /api/grades?studentId=&courseId=
router.get('/', async (req, res, next) => {
  try {
    const { studentId, courseId } = req.query;
    const query = {};
    if (studentId) query.student = studentId;
    if (courseId) query.course = courseId;

    const grades = await Grade.find(query)
      .populate('student', 'firstName lastName studentId')
      .populate('course', 'courseCode name')
      .populate('gradedBy', 'name')
      .sort({ gradedAt: -1 });

    res.json({ success: true, data: grades, count: grades.length });
  } catch (err) { next(err); }
});

// GET /api/grades/course/:courseId/summary — average per student in a course
router.get('/course/:courseId/summary', async (req, res, next) => {
  try {
    const summary = await Grade.aggregate([
      { $match: { course: require('mongoose').Types.ObjectId.createFromHexString(req.params.courseId) } },
      {
        $group: {
          _id: '$student',
          avgScore: { $avg: { $multiply: [{ $divide: ['$score', '$maxScore'] }, 100] } },
          gradeCount: { $sum: 1 },
        },
      },
      {
        $lookup: { from: 'students', localField: '_id', foreignField: '_id', as: 'student' },
      },
      { $unwind: '$student' },
      {
        $project: {
          student: { firstName: 1, lastName: 1, studentId: 1 },
          avgScore: { $round: ['$avgScore', 1] },
          gradeCount: 1,
        },
      },
      { $sort: { avgScore: -1 } },
    ]);
    res.json({ success: true, data: summary });
  } catch (err) { next(err); }
});

// POST /api/grades (Teacher or Admin)
router.post('/',
  authorize('admin', 'teacher'),
  [
    body('student').notEmpty().withMessage('Student is required'),
    body('course').notEmpty().withMessage('Course is required'),
    body('assessmentName').notEmpty().withMessage('Assessment name is required'),
    body('score').isFloat({ min: 0 }).withMessage('Score must be a non-negative number'),
    body('maxScore').isFloat({ min: 1 }).withMessage('Max score must be at least 1'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

      if (req.body.score > req.body.maxScore) {
        return res.status(400).json({ success: false, message: 'Score cannot exceed max score.' });
      }

      const grade = await Grade.create({ ...req.body, gradedBy: req.user._id });

      await createAuditEntry({
        action: 'ADD_GRADE', performedBy: req.user,
        targetModel: 'Grade', targetId: grade._id,
        details: `Added grade for ${grade.assessmentName}: ${grade.score}/${grade.maxScore} (${grade.letterGrade})`, req,
      });

      res.status(201).json({ success: true, data: grade });
    } catch (err) { next(err); }
  }
);

// PUT /api/grades/:id
router.put('/:id', authorize('admin', 'teacher'), async (req, res, next) => {
  try {
    const grade = await Grade.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!grade) return res.status(404).json({ success: false, message: 'Grade not found.' });

    await createAuditEntry({
      action: 'UPDATE_GRADE', performedBy: req.user,
      targetModel: 'Grade', targetId: grade._id,
      details: `Updated grade ${grade.assessmentName} to ${grade.score}/${grade.maxScore}`, req,
    });

    res.json({ success: true, data: grade });
  } catch (err) { next(err); }
});

// DELETE /api/grades/:id (Admin only)
router.delete('/:id', authorize('admin'), async (req, res, next) => {
  try {
    const grade = await Grade.findByIdAndDelete(req.params.id);
    if (!grade) return res.status(404).json({ success: false, message: 'Grade not found.' });

    await createAuditEntry({
      action: 'DELETE_GRADE', performedBy: req.user,
      targetModel: 'Grade', targetId: req.params.id,
      details: `Deleted grade ${grade.assessmentName}`, req,
    });

    res.json({ success: true, message: 'Grade deleted.' });
  } catch (err) { next(err); }
});

module.exports = router;
