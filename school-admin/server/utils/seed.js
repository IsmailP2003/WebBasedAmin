require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Student = require('../models/Student');
const Course = require('../models/Course');
const Attendance = require('../models/Attendance');
const Grade = require('../models/Grade');

const connectDB = require('../config/db');

const seed = async () => {
  await connectDB();
  console.log('🌱 Seeding database...');

  //Clear existing data
  await Promise.all([
    User.deleteMany(), Student.deleteMany(), Course.deleteMany(),
    Attendance.deleteMany(), Grade.deleteMany(),
  ]);
  console.log('🗑️  Cleared existing data');

  //Users
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@schooladmin.com',
    password: 'Admin1234!',
    role: 'admin',
  });

  const teachers = await User.insertMany([
    { name: 'Dr. Sarah Johnson', email: 'sarah.johnson@schooladmin.com', password: 'Teacher1234!', role: 'teacher' },
    { name: 'Mr. David Chen', email: 'david.chen@schooladmin.com', password: 'Teacher1234!', role: 'teacher' },
    { name: 'Ms. Emily Clarke', email: 'emily.clarke@schooladmin.com', password: 'Teacher1234!', role: 'teacher' },
  ]);
  console.log(`✅ Created 1 admin + ${teachers.length} teachers`);

  //Students
  const studentData = [
    { studentId: 'STU001', firstName: 'Aisha', lastName: 'Rahman', email: 'a.rahman@student.school.com', dateOfBirth: new Date('2005-03-14'), gender: 'female', status: 'active', dataConsentGiven: true, consentDate: new Date() },
    { studentId: 'STU002', firstName: 'James', lastName: 'Murray', email: 'j.murray@student.school.com', dateOfBirth: new Date('2005-07-22'), gender: 'male', status: 'active', dataConsentGiven: true, consentDate: new Date() },
    { studentId: 'STU003', firstName: 'Priya', lastName: 'Patel', email: 'p.patel@student.school.com', dateOfBirth: new Date('2006-01-09'), gender: 'female', status: 'active', dataConsentGiven: true, consentDate: new Date() },
    { studentId: 'STU004', firstName: 'Mohammed', lastName: 'Al-Hassan', email: 'm.alhassan@student.school.com', dateOfBirth: new Date('2005-11-30'), gender: 'male', status: 'active', dataConsentGiven: true, consentDate: new Date() },
    { studentId: 'STU005', firstName: 'Lucy', lastName: 'Hartley', email: 'l.hartley@student.school.com', dateOfBirth: new Date('2006-05-18'), gender: 'female', status: 'active', dataConsentGiven: true, consentDate: new Date() },
    { studentId: 'STU006', firstName: 'Kwame', lastName: 'Asante', email: 'k.asante@student.school.com', dateOfBirth: new Date('2005-09-02'), gender: 'male', status: 'active', dataConsentGiven: true, consentDate: new Date() },
    { studentId: 'STU007', firstName: 'Sophie', lastName: 'Williams', email: 's.williams@student.school.com', dateOfBirth: new Date('2006-02-28'), gender: 'female', status: 'active', dataConsentGiven: true, consentDate: new Date() },
    { studentId: 'STU008', firstName: 'Arjun', lastName: 'Sharma', email: 'a.sharma@student.school.com', dateOfBirth: new Date('2005-12-15'), gender: 'male', status: 'active', dataConsentGiven: true, consentDate: new Date() },
    { studentId: 'STU009', firstName: 'Chloe', lastName: 'Martin', email: 'c.martin@student.school.com', dateOfBirth: new Date('2006-08-11'), gender: 'female', status: 'inactive', dataConsentGiven: true, consentDate: new Date() },
    { studentId: 'STU010', firstName: 'Oliver', lastName: 'Thompson', email: 'o.thompson@student.school.com', dateOfBirth: new Date('2005-04-27'), gender: 'male', status: 'active', dataConsentGiven: true, consentDate: new Date() },
  ];
  const students = await Student.insertMany(studentData);
  console.log(`✅ Created ${students.length} students`);

  //Courses
  const courses = await Course.insertMany([
    {
      courseCode: 'CS101', name: 'Introduction to Computer Science', description: 'Fundamentals of computing, algorithms, and problem-solving.',
      teacher: teachers[0]._id, credits: 4,
      schedule: { day: 'Monday', startTime: '09:00', endTime: '11:00', room: 'Lab A' },
      students: students.slice(0, 7).map(s => s._id),
    },
    {
      courseCode: 'MATH201', name: 'Advanced Mathematics', description: 'Calculus, linear algebra, and statistics for engineers.',
      teacher: teachers[1]._id, credits: 4,
      schedule: { day: 'Tuesday', startTime: '10:00', endTime: '12:00', room: 'Room 12' },
      students: students.slice(2, 9).map(s => s._id),
    },
    {
      courseCode: 'ENG102', name: 'English Language & Literature', description: 'Academic writing, critical analysis, and communication skills.',
      teacher: teachers[2]._id, credits: 3,
      schedule: { day: 'Wednesday', startTime: '14:00', endTime: '16:00', room: 'Room 5' },
      students: students.slice(0, 5).map(s => s._id),
    },
    {
      courseCode: 'SCI301', name: 'Applied Sciences', description: 'Physics, chemistry, and biology in real-world contexts.',
      teacher: teachers[0]._id, credits: 4,
      schedule: { day: 'Thursday', startTime: '09:00', endTime: '11:00', room: 'Lab B' },
      students: [students[0]._id, students[1]._id, students[3]._id, students[5]._id, students[7]._id, students[9]._id],
    },
  ]);
  console.log(`✅ Created ${courses.length} courses`);

  //Sync student enrolledCourses
  for (const course of courses) {
    await Student.updateMany(
      { _id: { $in: course.students } },
      { $addToSet: { enrolledCourses: course._id } }
    );
  }

  //Attendance (last 10 days)
  const attendanceRecords = [];
  const today = new Date();
  for (let daysAgo = 9; daysAgo >= 0; daysAgo--) {
    const date = new Date(today);
    date.setDate(today.getDate() - daysAgo);
    date.setHours(9, 0, 0, 0);
    if (date.getDay() === 0 || date.getDay() === 6) continue; // skip weekends

    for (const course of courses) {
      for (const studentId of course.students) {
        //Simulate realistic attendance (~85% present)
        const rand = Math.random();
        const status = rand > 0.85 ? (rand > 0.92 ? 'absent' : 'late') : 'present';
        attendanceRecords.push({
          course: course._id, student: studentId, date,
          status, markedBy: course.teacher,
        });
      }
    }
  }
  await Attendance.insertMany(attendanceRecords, { ordered: false }).catch(() => { });
  console.log(`✅ Created ${attendanceRecords.length} attendance records`);

  //Grades
  const assessments = [
    { name: 'Coursework 1', type: 'assignment', maxScore: 100 },
    { name: 'Mid-Term Exam', type: 'exam', maxScore: 80 },
    { name: 'Quiz 1', type: 'quiz', maxScore: 20 },
    { name: 'Group Project', type: 'project', maxScore: 50 },
  ];
  const gradeRecords = [];
  for (const course of courses) {
    for (const studentId of course.students) {
      for (const assessment of assessments.slice(0, 2)) {
        const score = Math.round((0.45 + Math.random() * 0.55) * assessment.maxScore * 10) / 10;
        gradeRecords.push({
          student: studentId, course: course._id,
          assessmentName: assessment.name, assessmentType: assessment.type,
          score, maxScore: assessment.maxScore,
          gradedBy: course.teacher,
          feedback: score / assessment.maxScore >= 0.7 ? 'Good work, keep it up!' : 'Please see me for extra support.',
        });
      }
    }
  }
  await Grade.insertMany(gradeRecords);
  console.log(`✅ Created ${gradeRecords.length} grade records`);

  console.log('\n🎉 Database seeded successfully!\n');
  console.log('─────────────────────────────────────');
  console.log('📧 Admin login:   admin@schooladmin.com');
  console.log('🔑 Password:      Admin1234!');
  console.log('─────────────────────────────────────');
  console.log('📧 Teacher login: sarah.johnson@schooladmin.com');
  console.log('🔑 Password:      Teacher1234!');
  console.log('─────────────────────────────────────\n');

  mongoose.disconnect();
};

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
