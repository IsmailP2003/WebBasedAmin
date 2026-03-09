const express = require('express');
const Student = require('../models/Student');
const Course = require('../models/Course');
const Attendance = require('../models/Attendance');
const Grade = require('../models/Grade');
const AuditLog = require('../models/AuditLog');
const { protect, authorize } = require('../middleware/auth');
const mongoose = require('mongoose');

const router = express.Router();
router.use(protect, authorize('admin', 'teacher'));

// GET /api/analytics/summary — overall stats for the dashboard
router.get('/summary', async (req, res, next) => {
  try {
    const [totalStudents, totalCourses, totalAttendance, presentCount, avgGradeResult, recentActivity] = await Promise.all([
      Student.countDocuments({ status: 'active' }),
      Course.countDocuments({ isActive: true }),
      Attendance.countDocuments(),
      Attendance.countDocuments({ status: { $in: ['present', 'late'] } }),
      Grade.aggregate([
        {
          $group: {
            _id: null,
            avg: { $avg: { $multiply: [{ $divide: ['$score', '$maxScore'] }, 100] } },
          },
        },
      ]),
      AuditLog.find()
        .populate('performedBy', 'name role')
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    const overallAttendanceRate = totalAttendance > 0
      ? Math.round((presentCount / totalAttendance) * 100)
      : 0;

    const avgGrade = avgGradeResult[0] ? Math.round(avgGradeResult[0].avg * 10) / 10 : 0;

    res.json({
      success: true,
      data: {
        totalStudents,
        totalCourses,
        overallAttendanceRate,
        avgGrade,
        recentActivity,
      },
    });
  } catch (err) { next(err); }
});

// GET /api/analytics/attendance-rate — per-course attendance rates (for bar chart)
router.get('/attendance-rate', async (req, res, next) => {
  try {
    const courses = await Course.find({ isActive: true }, 'courseCode name');
    const results = await Promise.all(
      courses.map(async (course) => {
        const total = await Attendance.countDocuments({ course: course._id });
        const present = await Attendance.countDocuments({ course: course._id, status: { $in: ['present', 'late'] } });
        return {
          courseCode: course.courseCode,
          name: course.name,
          rate: total > 0 ? Math.round((present / total) * 100) : 0,
          total,
        };
      })
    );
    res.json({ success: true, data: results });
  } catch (err) { next(err); }
});

// GET /api/analytics/grade-distribution — grade band distribution (for doughnut)
router.get('/grade-distribution', async (req, res, next) => {
  try {
    const grades = await Grade.find();
    const bands = { 'A+ (90-100%)': 0, 'A (80-89%)': 0, 'B (70-79%)': 0, 'C (60-69%)': 0, 'D (50-59%)': 0, 'F (<50%)': 0 };
    grades.forEach(g => {
      const pct = (g.score / g.maxScore) * 100;
      if (pct >= 90) bands['A+ (90-100%)']++;
      else if (pct >= 80) bands['A (80-89%)']++;
      else if (pct >= 70) bands['B (70-79%)']++;
      else if (pct >= 60) bands['C (60-69%)']++;
      else if (pct >= 50) bands['D (50-59%)']++;
      else bands['F (<50%)']++;
    });
    res.json({ success: true, data: bands });
  } catch (err) { next(err); }
});

// GET /api/analytics/monthly-enrolments — for trend line chart
router.get('/monthly-enrolments', async (req, res, next) => {
  try {
    const data = await Student.aggregate([
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 },
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formatted = data.map(d => ({
      label: `${months[d._id.month - 1]} ${d._id.year}`,
      count: d.count,
    }));

    res.json({ success: true, data: formatted });
  } catch (err) { next(err); }
});

module.exports = router;
