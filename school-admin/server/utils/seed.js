require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User       = require('../models/User');
const Student    = require('../models/Student');
const Course     = require('../models/Course');
const Attendance = require('../models/Attendance');
const Grade      = require('../models/Grade');
const Announcement = require('../models/Announcement');

const connectDB = require('../config/db');

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.round((min + Math.random() * (max - min)) * 10) / 10;

const seed = async () => {
  await connectDB();
  console.log('🌱 Seeding database...');

  // ── Clear ────────────────────────────────────────────────────────────
  await Promise.all([
    User.deleteMany(), Student.deleteMany(), Course.deleteMany(),
    Attendance.deleteMany(), Grade.deleteMany(),
    Announcement.deleteMany().catch(() => {}),
  ]);
  console.log('🗑️  Cleared existing data');

  // ── Users ─────────────────────────────────────────────────────────────
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@schooladmin.com',
    password: 'Admin1234!',
    role: 'admin',
  });

  // Hash passwords first since insertMany bypasses Mongoose pre-save hooks
  const teacherPassword = await bcrypt.hash('Teacher1234!', 12);
  const teachers = await User.insertMany([
    { name: 'Dr. Sarah Johnson',   email: 'sarah.johnson@schooladmin.com',   password: teacherPassword, role: 'teacher' },
    { name: 'Mr. David Chen',      email: 'david.chen@schooladmin.com',      password: teacherPassword, role: 'teacher' },
    { name: 'Ms. Emily Clarke',    email: 'emily.clarke@schooladmin.com',    password: teacherPassword, role: 'teacher' },
    { name: 'Dr. Marcus Reid',     email: 'marcus.reid@schooladmin.com',     password: teacherPassword, role: 'teacher' },
    { name: 'Mrs. Fatima Malik',   email: 'fatima.malik@schooladmin.com',    password: teacherPassword, role: 'teacher' },
  ]);
  console.log(`✅ Created 1 admin + ${teachers.length} teachers`);

  // ── Students (with linked User accounts for login) ─────────────────────
  const studentData = [
    { studentId: 'STU001', firstName: 'Aisha',    lastName: 'Rahman',    email: 'a.rahman@student.school.com',    dateOfBirth: new Date('2005-03-14'), gender: 'female',         status: 'active',    dataConsentGiven: true,  consentDate: new Date() },
    { studentId: 'STU002', firstName: 'James',    lastName: 'Murray',    email: 'j.murray@student.school.com',    dateOfBirth: new Date('2005-07-22'), gender: 'male',           status: 'active',    dataConsentGiven: true,  consentDate: new Date() },
    { studentId: 'STU003', firstName: 'Priya',    lastName: 'Patel',     email: 'p.patel@student.school.com',     dateOfBirth: new Date('2006-01-09'), gender: 'female',         status: 'active',    dataConsentGiven: true,  consentDate: new Date() },
    { studentId: 'STU004', firstName: 'Mohammed', lastName: 'Al-Hassan', email: 'm.alhassan@student.school.com',  dateOfBirth: new Date('2005-11-30'), gender: 'male',           status: 'active',    dataConsentGiven: true,  consentDate: new Date() },
    { studentId: 'STU005', firstName: 'Lucy',     lastName: 'Hartley',   email: 'l.hartley@student.school.com',   dateOfBirth: new Date('2006-05-18'), gender: 'female',         status: 'active',    dataConsentGiven: true,  consentDate: new Date() },
    { studentId: 'STU006', firstName: 'Kwame',    lastName: 'Asante',    email: 'k.asante@student.school.com',    dateOfBirth: new Date('2005-09-02'), gender: 'male',           status: 'active',    dataConsentGiven: true,  consentDate: new Date() },
    { studentId: 'STU007', firstName: 'Sophie',   lastName: 'Williams',  email: 's.williams@student.school.com',  dateOfBirth: new Date('2006-02-28'), gender: 'female',         status: 'active',    dataConsentGiven: true,  consentDate: new Date() },
    { studentId: 'STU008', firstName: 'Arjun',    lastName: 'Sharma',    email: 'a.sharma@student.school.com',    dateOfBirth: new Date('2005-12-15'), gender: 'male',           status: 'active',    dataConsentGiven: true,  consentDate: new Date() },
    { studentId: 'STU009', firstName: 'Chloe',    lastName: 'Martin',    email: 'c.martin@student.school.com',    dateOfBirth: new Date('2006-08-11'), gender: 'female',         status: 'inactive',  dataConsentGiven: true,  consentDate: new Date() },
    { studentId: 'STU010', firstName: 'Oliver',   lastName: 'Thompson',  email: 'o.thompson@student.school.com',  dateOfBirth: new Date('2005-04-27'), gender: 'male',           status: 'active',    dataConsentGiven: true,  consentDate: new Date() },
    { studentId: 'STU011', firstName: 'Zara',     lastName: 'Ahmed',     email: 'z.ahmed@student.school.com',     dateOfBirth: new Date('2005-06-12'), gender: 'female',         status: 'active',    dataConsentGiven: true,  consentDate: new Date() },
    { studentId: 'STU012', firstName: 'Noah',     lastName: 'Davies',    email: 'n.davies@student.school.com',    dateOfBirth: new Date('2006-03-03'), gender: 'male',           status: 'active',    dataConsentGiven: true,  consentDate: new Date() },
    { studentId: 'STU013', firstName: 'Mia',      lastName: 'Robinson',  email: 'm.robinson@student.school.com',  dateOfBirth: new Date('2005-10-21'), gender: 'female',         status: 'active',    dataConsentGiven: true,  consentDate: new Date() },
    { studentId: 'STU014', firstName: 'Leon',     lastName: 'Okafor',    email: 'l.okafor@student.school.com',    dateOfBirth: new Date('2005-08-16'), gender: 'male',           status: 'active',    dataConsentGiven: true,  consentDate: new Date() },
    { studentId: 'STU015', firstName: 'Amara',    lastName: 'Diallo',    email: 'a.diallo@student.school.com',    dateOfBirth: new Date('2006-01-30'), gender: 'female',         status: 'active',    dataConsentGiven: false, consentDate: null },
    { studentId: 'STU016', firstName: 'Tom',      lastName: 'Anderson',  email: 't.anderson@student.school.com',  dateOfBirth: new Date('2005-05-07'), gender: 'male',           status: 'active',    dataConsentGiven: true,  consentDate: new Date() },
    { studentId: 'STU017', firstName: 'Isabel',   lastName: 'Ferreira',  email: 'i.ferreira@student.school.com',  dateOfBirth: new Date('2006-07-19'), gender: 'female',         status: 'active',    dataConsentGiven: true,  consentDate: new Date() },
    { studentId: 'STU018', firstName: 'Jake',     lastName: 'Peters',    email: 'j.peters@student.school.com',    dateOfBirth: new Date('2005-02-14'), gender: 'male',           status: 'suspended', dataConsentGiven: true,  consentDate: new Date() },
    { studentId: 'STU019', firstName: 'Layla',    lastName: 'Hassan',    email: 'la.hassan@student.school.com',   dateOfBirth: new Date('2005-09-29'), gender: 'female',         status: 'active',    dataConsentGiven: true,  consentDate: new Date() },
    { studentId: 'STU020', firstName: 'Ethan',    lastName: 'Brown',     email: 'e.brown@student.school.com',     dateOfBirth: new Date('2006-04-11'), gender: 'male',           status: 'active',    dataConsentGiven: true,  consentDate: new Date() },
  ];
  const students = await Student.insertMany(studentData);
  console.log(`✅ Created ${students.length} students`);

  // Create User accounts for 4 students (so they can log in)
  const studentPassword = await bcrypt.hash('Student1234!', 12);
  const studentUsers = await User.insertMany([
    { name: 'Aisha Rahman',    email: 'a.rahman@student.school.com',    password: studentPassword, role: 'student' },
    { name: 'James Murray',    email: 'j.murray@student.school.com',    password: studentPassword, role: 'student' },
    { name: 'Priya Patel',     email: 'p.patel@student.school.com',     password: studentPassword, role: 'student' },
    { name: 'Oliver Thompson', email: 'o.thompson@student.school.com',  password: studentPassword, role: 'student' },
  ]);
  console.log(`✅ Created ${studentUsers.length} student login accounts`);

  // ── Courses (10 courses, all 5 days covered, different rooms) ──────────
  const [t0, t1, t2, t3, t4] = teachers;
  const all = students.map(s => s._id);
  const half1 = students.slice(0, 10).map(s => s._id);
  const half2 = students.slice(10, 20).map(s => s._id);
  const grp = (from, to) => students.slice(from, to).map(s => s._id);

  const courses = await Course.insertMany([
    {
      courseCode: 'CS101', name: 'Introduction to Computer Science',
      description: 'Fundamental computing concepts, algorithms, data structures and problem-solving techniques.',
      teacher: t0._id, credits: 4,
      schedule: { day: 'Monday', startTime: '09:00', endTime: '11:00', room: 'Lab A' },
      students: grp(0, 10),
    },
    {
      courseCode: 'CS201', name: 'Web Development Fundamentals',
      description: 'HTML, CSS, JavaScript and modern frameworks for building responsive web applications.',
      teacher: t0._id, credits: 3,
      schedule: { day: 'Wednesday', startTime: '13:00', endTime: '15:00', room: 'Lab A' },
      students: grp(0, 8),
    },
    {
      courseCode: 'MATH201', name: 'Advanced Mathematics',
      description: 'Calculus, linear algebra, differential equations and statistical analysis.',
      teacher: t1._id, credits: 4,
      schedule: { day: 'Tuesday', startTime: '10:00', endTime: '12:00', room: 'Room 12' },
      students: grp(2, 14),
    },
    {
      courseCode: 'MATH102', name: 'Statistics & Data Analysis',
      description: 'Probability, hypothesis testing, regression, and data visualisation methods.',
      teacher: t1._id, credits: 3,
      schedule: { day: 'Thursday', startTime: '14:00', endTime: '16:00', room: 'Room 12' },
      students: grp(5, 18),
    },
    {
      courseCode: 'ENG102', name: 'English Language & Literature',
      description: 'Academic writing, critical analysis, rhetoric, and professional communication.',
      teacher: t2._id, credits: 3,
      schedule: { day: 'Wednesday', startTime: '09:00', endTime: '11:00', room: 'Room 5' },
      students: grp(0, 12),
    },
    {
      courseCode: 'ENG201', name: 'Creative Writing & Journalism',
      description: 'Short fiction, feature writing, editorial skills and media ethics.',
      teacher: t2._id, credits: 2,
      schedule: { day: 'Friday', startTime: '11:00', endTime: '13:00', room: 'Room 6' },
      students: grp(4, 16),
    },
    {
      courseCode: 'SCI301', name: 'Applied Sciences',
      description: 'Physics, chemistry and biology concepts applied to real-world engineering challenges.',
      teacher: t3._id, credits: 4,
      schedule: { day: 'Monday', startTime: '13:00', endTime: '15:00', room: 'Lab B' },
      students: grp(0, 6).concat(grp(10, 16)),
    },
    {
      courseCode: 'SCI401', name: 'Environmental Science',
      description: 'Climate systems, ecology, sustainability practices and environmental policy.',
      teacher: t3._id, credits: 3,
      schedule: { day: 'Thursday', startTime: '09:00', endTime: '11:00', room: 'Lab B' },
      students: grp(3, 15),
    },
    {
      courseCode: 'BUS101', name: 'Business Studies',
      description: 'Principles of management, marketing, finance and entrepreneurship.',
      teacher: t4._id, credits: 3,
      schedule: { day: 'Tuesday', startTime: '14:00', endTime: '16:00', room: 'Room 8' },
      students: grp(6, 20),
    },
    {
      courseCode: 'BUS202', name: 'Economics & Finance',
      description: 'Micro and macroeconomics, financial markets, investment theory and banking.',
      teacher: t4._id, credits: 4,
      schedule: { day: 'Friday', startTime: '09:00', endTime: '11:00', room: 'Room 9' },
      students: grp(8, 20),
    },
  ]);
  console.log(`✅ Created ${courses.length} courses`);

  // Sync enrolledCourses array on students
  for (const course of courses) {
    await Student.updateMany(
      { _id: { $in: course.students } },
      { $addToSet: { enrolledCourses: course._id } }
    );
  }

  // ── Attendance (last 4 weeks, weekdays only) ──────────────────────────
  const attendanceRecords = [];
  const today = new Date();
  // Simulate per-student attendance variation: some students are unreliable
  const absenteeProfiles = {};
  students.forEach(s => {
    // Assign each student an underlying attendance probability (60-98%)
    absenteeProfiles[s._id.toString()] = 0.6 + Math.random() * 0.38;
  });

  for (let daysAgo = 28; daysAgo >= 1; daysAgo--) {
    const date = new Date(today);
    date.setDate(today.getDate() - daysAgo);
    date.setHours(9, 0, 0, 0);
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    for (const course of courses) {
      for (const studentId of course.students) {
        const prob = absenteeProfiles[studentId.toString()] ?? 0.85;
        const rand = Math.random();
        let status;
        if (rand < prob * 0.92)         status = 'present';
        else if (rand < prob)            status = 'late';
        else if (rand < prob + 0.06)     status = 'excused';
        else                             status = 'absent';
        attendanceRecords.push({
          course: course._id, student: studentId, date,
          status, markedBy: course.teacher,
        });
      }
    }
  }
  await Attendance.insertMany(attendanceRecords, { ordered: false }).catch(() => {});
  console.log(`✅ Created ${attendanceRecords.length} attendance records`);

  // ── Grades (varied assessments per course) ────────────────────────────
  const courseAssessments = [
    [
      { name: 'Programming Basics Quiz',  type: 'quiz',        maxScore: 20  },
      { name: 'Algorithm Coursework',     type: 'assignment',  maxScore: 100 },
      { name: 'Mid-Term Exam',            type: 'exam',        maxScore: 80  },
      { name: 'Group Hackathon Project',  type: 'project',     maxScore: 50  },
    ],
    [
      { name: 'HTML/CSS Assignment',      type: 'assignment',  maxScore: 50  },
      { name: 'JavaScript Quiz',          type: 'quiz',        maxScore: 25  },
      { name: 'React Portfolio Project',  type: 'project',     maxScore: 100 },
    ],
    [
      { name: 'Calculus Quiz',            type: 'quiz',        maxScore: 30  },
      { name: 'Linear Algebra Assignment',type: 'assignment',  maxScore: 80  },
      { name: 'Mid-Term Examination',     type: 'exam',        maxScore: 100 },
      { name: 'Statistics Analysis',      type: 'project',     maxScore: 60  },
    ],
    [
      { name: 'Probability Assignment',   type: 'assignment',  maxScore: 50  },
      { name: 'Data Analysis Project',    type: 'project',     maxScore: 75  },
      { name: 'Stats Exam',               type: 'exam',        maxScore: 80  },
    ],
    [
      { name: 'Essay 1',                  type: 'assignment',  maxScore: 50  },
      { name: 'Literary Analysis',        type: 'assignment',  maxScore: 60  },
      { name: 'Mid-Term Essay Exam',      type: 'exam',        maxScore: 80  },
    ],
    [
      { name: 'Short Story Assignment',   type: 'assignment',  maxScore: 40  },
      { name: 'News Article',             type: 'assignment',  maxScore: 30  },
      { name: 'Feature Writing Final',    type: 'project',     maxScore: 80  },
    ],
    [
      { name: 'Physics Lab Report',       type: 'assignment',  maxScore: 50  },
      { name: 'Chemistry Quiz',           type: 'quiz',        maxScore: 20  },
      { name: 'Applied Science Exam',     type: 'exam',        maxScore: 100 },
      { name: 'Engineering Design',       type: 'project',     maxScore: 75  },
    ],
    [
      { name: 'Ecology Field Report',     type: 'assignment',  maxScore: 60  },
      { name: 'Climate Change Debate',    type: 'presentation',maxScore: 30  },
      { name: 'Environmental Exam',       type: 'exam',        maxScore: 80  },
    ],
    [
      { name: 'Marketing Plan',           type: 'project',     maxScore: 80  },
      { name: 'Business Case Study',      type: 'assignment',  maxScore: 50  },
      { name: 'Management Quiz',          type: 'quiz',        maxScore: 25  },
      { name: 'Business Studies Exam',    type: 'exam',        maxScore: 100 },
    ],
    [
      { name: 'Microeconomics Essay',     type: 'assignment',  maxScore: 60  },
      { name: 'Market Analysis Presentation', type: 'presentation', maxScore: 40 },
      { name: 'Economics Exam',           type: 'exam',        maxScore: 100 },
    ],
  ];

  const gradeRecords = [];
  courses.forEach((course, ci) => {
    const assessments = courseAssessments[ci] || courseAssessments[0];
    course.students.forEach(studentId => {
      assessments.forEach(assessment => {
        // Give each student a slightly different performance level
        const base = 0.42 + Math.random() * 0.58;
        const score = Math.round(base * assessment.maxScore * 10) / 10;
        const feedback =
          score / assessment.maxScore >= 0.85 ? 'Excellent work — outstanding performance!' :
          score / assessment.maxScore >= 0.70 ? 'Good work, keep it up!' :
          score / assessment.maxScore >= 0.55 ? 'Satisfactory. Review the feedback carefully.' :
          'Below the expected standard. Please see me during office hours.';
        gradeRecords.push({
          student: studentId,
          course: course._id,
          assessmentName: assessment.name,
          assessmentType: assessment.type,
          score,
          maxScore: assessment.maxScore,
          gradedBy: course.teacher,
          feedback,
        });
      });
    });
  });
  await Grade.insertMany(gradeRecords);
  console.log(`✅ Created ${gradeRecords.length} grade records`);

  // ── Announcements ─────────────────────────────────────────────────────
  try {
    await Announcement.insertMany([
      {
        title: 'Welcome to Academic Year 2025-26!',
        body: 'Welcome back to all students and staff. Please ensure your timetables are confirmed and all course enrolments are up to date before the end of week.',
        author: admin._id,
        priority: 'important',
        pinned: true,
      },
      {
        title: 'Exam Period: 12–23 May',
        body: 'End-of-year examinations will run from 12 May to 23 May. Timetables will be published on the noticeboard and emailed to all registered students. Revision sessions begin 1 May.',
        author: admin._id,
        priority: 'urgent',
        pinned: true,
      },
      {
        title: 'IT Systems Maintenance — Saturday 19 April',
        body: 'The school administration system will be offline from 22:00 on Saturday 19 April until 06:00 on Sunday 20 April for scheduled maintenance. Please save any work in progress before this time.',
        author: admin._id,
        priority: 'important',
      },
      {
        title: 'Library Extended Hours During Exam Period',
        body: 'The school library will be open 08:00–20:00 Monday to Friday throughout the exam period. Quiet study areas and computer workstations are available on a first-come, first-served basis.',
        author: admin._id,
        priority: 'normal',
      },
      {
        title: 'GDPR Reminder: Data Consent Forms',
        body: 'All students must have a current data consent form on file. Students without consent (marked in the system) must return a completed form to the admin office by 30 April.',
        author: admin._id,
        priority: 'urgent',
      },
    ]);
    console.log('✅ Created 5 announcements');
  } catch (e) {
    console.log('⚠️  Announcements skipped (schema may differ):', e.message);
  }

  // ── Summary ────────────────────────────────────────────────────────────
  console.log('\n🎉 Database seeded successfully!\n');
  console.log('─────────────────────────────────────────────────────');
  console.log('📧 Admin:          admin@schooladmin.com');
  console.log('🔑 Password:       Admin1234!');
  console.log('─────────────────────────────────────────────────────');
  console.log('📧 Teachers (all use password: Teacher1234!)');
  console.log('   Dr. Sarah Johnson  → sarah.johnson@schooladmin.com  → CS101, CS201');
  console.log('   Mr. David Chen     → david.chen@schooladmin.com     → MATH201, MATH102');
  console.log('   Ms. Emily Clarke   → emily.clarke@schooladmin.com   → ENG102, ENG201');
  console.log('   Dr. Marcus Reid    → marcus.reid@schooladmin.com    → SCI301, SCI401');
  console.log('   Mrs. Fatima Malik  → fatima.malik@schooladmin.com   → BUS101, BUS202');
  console.log('─────────────────────────────────────────────────────');
  console.log('📧 Students (all use password: Student1234!)');
  console.log('   Aisha Rahman    → a.rahman@student.school.com');
  console.log('   James Murray    → j.murray@student.school.com');
  console.log('   Priya Patel     → p.patel@student.school.com');
  console.log('   Oliver Thompson → o.thompson@student.school.com');
  console.log('─────────────────────────────────────────────────────\n');

  mongoose.disconnect();
};

seed().catch(err => {
  console.error('Seed failed:', err);
  mongoose.disconnect();
  process.exit(1);
});
