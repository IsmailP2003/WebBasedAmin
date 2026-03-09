const express = require('express');
const { body, validationResult } = require('express-validator');
const Course = require('../models/Course');
const Student = require('../models/Student');
const { protect, authorize } = require('../middleware/auth');
const { createAuditEntry } = require('../utils/auditLogger');

const router = express.Router();
router.use(protect);

// GET /api/courses
router.get('/', async (req, res, next) => {
  try {
    const courses = await Course.find()
      .populate('teacher', 'name email')
      .populate('students', 'firstName lastName studentId')
      .sort({ courseCode: 1 });
    res.json({ success: true, data: courses, count: courses.length });
  } catch (err) { next(err); }
});

// GET /api/courses/:id
router.get('/:id', async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('teacher', 'name email')
      .populate('students', 'firstName lastName studentId email status');
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
    res.json({ success: true, data: course });
  } catch (err) { next(err); }
});

// POST /api/courses (Admin only)
router.post('/',
  authorize('admin'),
  [
    body('courseCode').notEmpty().withMessage('Course code is required').trim().toUpperCase(),
    body('name').notEmpty().withMessage('Course name is required').trim(),
    body('teacher').notEmpty().withMessage('Teacher is required'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

      const course = await Course.create(req.body);
      await course.populate('teacher', 'name email');

      await createAuditEntry({
        action: 'CREATE_COURSE', performedBy: req.user,
        targetModel: 'Course', targetId: course._id,
        details: `Created course ${course.courseCode}: ${course.name}`, req,
      });

      res.status(201).json({ success: true, data: course });
    } catch (err) {
      if (err.code === 11000) return res.status(400).json({ success: false, message: 'A course with that code already exists.' });
      next(err);
    }
  }
);

// PUT /api/courses/:id (Admin only)
router.put('/:id', authorize('admin'), async (req, res, next) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('teacher', 'name email');
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

    await createAuditEntry({
      action: 'UPDATE_COURSE', performedBy: req.user,
      targetModel: 'Course', targetId: course._id,
      details: `Updated course ${course.courseCode}`, req,
    });

    res.json({ success: true, data: course });
  } catch (err) { next(err); }
});

// DELETE /api/courses/:id (Admin only)
router.delete('/:id', authorize('admin'), async (req, res, next) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

    // Remove course ref from all enrolled students
    await Student.updateMany({ enrolledCourses: req.params.id }, { $pull: { enrolledCourses: req.params.id } });

    await createAuditEntry({
      action: 'DELETE_COURSE', performedBy: req.user,
      targetModel: 'Course', targetId: req.params.id,
      details: `Deleted course ${course.courseCode}: ${course.name}`, req,
    });

    res.json({ success: true, message: 'Course deleted successfully.' });
  } catch (err) { next(err); }
});

// POST /api/courses/:id/enrol — enrol a student
router.post('/:id/enrol', authorize('admin'), async (req, res, next) => {
  try {
    const { studentId } = req.body;
    const [course, student] = await Promise.all([
      Course.findById(req.params.id),
      Student.findById(studentId),
    ]);

    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    if (course.students.includes(studentId)) {
      return res.status(400).json({ success: false, message: 'Student is already enrolled in this course.' });
    }

    course.students.push(studentId);
    student.enrolledCourses.push(course._id);
    await Promise.all([course.save(), student.save()]);

    await createAuditEntry({
      action: 'ENROL_STUDENT', performedBy: req.user,
      targetModel: 'Course', targetId: course._id,
      details: `Enrolled ${student.fullName} in ${course.courseCode}`, req,
    });

    res.json({ success: true, message: `${student.fullName} enrolled in ${course.courseCode}`, data: course });
  } catch (err) { next(err); }
});

// DELETE /api/courses/:id/enrol/:studentId — remove student from course
router.delete('/:id/enrol/:studentId', authorize('admin'), async (req, res, next) => {
  try {
    const [course, student] = await Promise.all([
      Course.findById(req.params.id),
      Student.findById(req.params.studentId),
    ]);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    course.students.pull(req.params.studentId);
    student.enrolledCourses.pull(req.params.id);
    await Promise.all([course.save(), student.save()]);

    await createAuditEntry({
      action: 'REMOVE_STUDENT_FROM_COURSE', performedBy: req.user,
      targetModel: 'Course', targetId: course._id,
      details: `Removed ${student.fullName} from ${course.courseCode}`, req,
    });

    res.json({ success: true, message: `${student.fullName} removed from ${course.courseCode}` });
  } catch (err) { next(err); }
});

module.exports = router;
