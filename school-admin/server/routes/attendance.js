// Attendance routes — bulk mark per session, teachers restricted to their own courses
const express = require('express');
const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const { protect, authorize } = require('../middleware/auth');
const { createAuditEntry } = require('../utils/auditLogger');

const router = express.Router();
router.use(protect);

// GET /api/attendance?courseId=&date=&studentId=
router.get('/', async (req, res, next) => {
  try {
    const { courseId, date, studentId } = req.query;
    const query = {};
    if (courseId) query.course = courseId;
    if (studentId) query.student = studentId;
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    // Teachers are only allowed to view attendance for courses they teach.
    // Without this, a teacher could query another teacher's class by passing any courseId.
    if (req.user.role === 'teacher' && courseId) {
      const targetCourse = await Course.findById(courseId);
      if (!targetCourse || String(targetCourse.teacher) !== String(req.user._id)) {
        return res.status(403).json({ success: false, message: 'Unauthorised. You are not assigned to this course.' });
      }
    }

    const records = await Attendance.find(query)
      .populate('student', 'firstName lastName studentId')
      .populate('course', 'courseCode name')
      .populate('markedBy', 'name')
      .sort({ date: -1 });

    res.json({ success: true, data: records, count: records.length });
  } catch (err) { next(err); }
});

// POST /api/attendance — bulk mark attendance for a class session
router.post('/', authorize('admin', 'teacher'), async (req, res, next) => {
  try {
    // Expects: { courseId, date, records: [{ studentId, status, notes }] }
    const { courseId, date, records } = req.body;
    if (!courseId || !date || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: 'courseId, date and records[] are required.' });
    }

    if (req.user.role === 'teacher') {
      const targetCourse = await Course.findById(courseId);
      if (!targetCourse || String(targetCourse.teacher) !== String(req.user._id)) {
        return res.status(403).json({ success: false, message: 'Unauthorised. You are not assigned to this course.' });
      }
    }

    const attendanceDate = new Date(date);
    const ops = records.map(r => ({
      updateOne: {
        filter: { course: courseId, student: r.studentId, date: attendanceDate },
        update: { $set: { status: r.status, notes: r.notes || '', markedBy: req.user._id } },
        upsert: true,
      },
    }));

    // NOTE: attendance is recorded once per student per day.
    // A full production system would track individual sessions/lectures.
    // bulkWrite with upsert handles re-submissions gracefully — re-saving the
    // same day just overwrites the existing record rather than duplicating it.
    await Attendance.bulkWrite(ops);

    await createAuditEntry({
      action: 'MARK_ATTENDANCE', performedBy: req.user,
      targetModel: 'Attendance', targetId: courseId,
      details: `Marked attendance for ${records.length} students in course ${courseId} on ${date}`, req,
    });

    res.status(201).json({ success: true, message: `Attendance marked for ${records.length} students.` });
  } catch (err) { next(err); }
});

// GET /api/attendance/student/:id/summary — attendance % for a student
router.get('/student/:id/summary', async (req, res, next) => {
  try {
    const total = await Attendance.countDocuments({ student: req.params.id });
    const present = await Attendance.countDocuments({ student: req.params.id, status: { $in: ['present', 'late'] } });
    const rate = total > 0 ? Math.round((present / total) * 100) : null;
    res.json({ success: true, data: { total, present, rate } });
  } catch (err) { next(err); }
});

module.exports = router;
