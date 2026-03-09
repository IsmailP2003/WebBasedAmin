const express = require('express');
const { body, validationResult } = require('express-validator');
const Student = require('../models/Student');
const Course = require('../models/Course');
const Grade = require('../models/Grade');
const Attendance = require('../models/Attendance');
const { protect, authorize } = require('../middleware/auth');
const { createAuditEntry } = require('../utils/auditLogger');

const router = express.Router();

// All routes protected
router.use(protect);

// GET /api/students — list all students (searchable, paginated)
router.get('/', async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) {
      query.$text = { $search: search };
    }
    if (status) {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [students, total] = await Promise.all([
      Student.find(query)
        .populate('enrolledCourses', 'courseCode name')
        .sort({ lastName: 1, firstName: 1 })
        .skip(skip)
        .limit(Number(limit)),
      Student.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: students,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/students/:id
router.get('/:id', async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('enrolledCourses', 'courseCode name teacher schedule');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });
    res.json({ success: true, data: student });
  } catch (err) {
    next(err);
  }
});

// GET /api/students/:id/report — generate student report data (for CSV)
router.get('/:id/report', authorize('admin', 'teacher'), async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id).populate('enrolledCourses', 'courseCode name');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    const [grades, attendance] = await Promise.all([
      Grade.find({ student: req.params.id }).populate('course', 'courseCode name').sort({ gradedAt: -1 }),
      Attendance.find({ student: req.params.id }).populate('course', 'courseCode name').sort({ date: -1 }),
    ]);

    // Build CSV
    const rows = ['Student ID,Name,Email,Course,Assessment,Score,Max Score,Percentage,Grade,Date'];
    grades.forEach(g => {
      rows.push([
        student.studentId,
        `"${student.fullName}"`,
        student.email,
        g.course?.courseCode || '',
        `"${g.assessmentName}"`,
        g.score,
        g.maxScore,
        g.percentage,
        g.letterGrade,
        new Date(g.gradedAt).toLocaleDateString('en-GB'),
      ].join(','));
    });

    const csv = rows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="student-report-${student.studentId}.csv"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

// POST /api/students — create student (Admin only)
router.post('/',
  authorize('admin'),
  [
    body('studentId').notEmpty().withMessage('Student ID is required').trim().toUpperCase(),
    body('firstName').notEmpty().withMessage('First name is required').trim(),
    body('lastName').notEmpty().withMessage('Last name is required').trim(),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('dateOfBirth').isISO8601().withMessage('Valid date of birth required'),
    body('gender').isIn(['male', 'female', 'other', 'prefer_not_to_say']).withMessage('Invalid gender value'),
    body('dataConsentGiven').isBoolean().withMessage('Data consent must be true or false'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

      const studentData = { ...req.body };
      if (studentData.dataConsentGiven) studentData.consentDate = new Date();

      const student = await Student.create(studentData);

      await createAuditEntry({
        action: 'CREATE_STUDENT',
        performedBy: req.user,
        targetModel: 'Student',
        targetId: student._id,
        details: `Created student ${student.fullName} (${student.studentId})`,
        req,
      });

      res.status(201).json({ success: true, data: student });
    } catch (err) {
      if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(400).json({ success: false, message: `A student with that ${field} already exists.` });
      }
      next(err);
    }
  }
);

// PUT /api/students/:id — update student (Admin only)
router.put('/:id', authorize('admin'), async (req, res, next) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    await createAuditEntry({
      action: 'UPDATE_STUDENT',
      performedBy: req.user,
      targetModel: 'Student',
      targetId: student._id,
      details: `Updated student ${student.fullName} (${student.studentId})`,
      req,
    });

    res.json({ success: true, data: student });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/students/:id — delete student (Admin only)
router.delete('/:id', authorize('admin'), async (req, res, next) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    // Remove from all courses
    await Course.updateMany({ students: req.params.id }, { $pull: { students: req.params.id } });

    await createAuditEntry({
      action: 'DELETE_STUDENT',
      performedBy: req.user,
      targetModel: 'Student',
      targetId: req.params.id,
      details: `Deleted student ${student.fullName} (${student.studentId})`,
      req,
    });

    res.json({ success: true, message: 'Student deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
