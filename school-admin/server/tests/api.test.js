require('dotenv').config({ path: '.env.test' });
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Student = require('../models/Student');

let adminToken;
let teacherToken;
let testStudentId;

beforeAll(async () => {
  // Connect to test DB
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/school-admin-test');
  await User.deleteMany();
  await Student.deleteMany();

  // Create test admin
  const admin = await User.create({
    name: 'Test Admin', email: 'admin@test.com', password: 'Admin1234!', role: 'admin',
  });
  // Create test teacher
  const teacher = await User.create({
    name: 'Test Teacher', email: 'teacher@test.com', password: 'Teacher1234!', role: 'teacher',
  });

  // Login to get tokens
  const adminRes = await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'Admin1234!' });
  adminToken = adminRes.body.token;

  const teacherRes = await request(app).post('/api/auth/login').send({ email: 'teacher@test.com', password: 'Teacher1234!' });
  teacherToken = teacherRes.body.token;
});

afterAll(async () => {
  await User.deleteMany();
  await Student.deleteMany();
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

// ── Auth Tests ────────────────────────────────────────
describe('POST /api/auth/login', () => {
  it('should login with valid credentials and return a JWT', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'Admin1234!' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('admin');
  });

  it('should reject invalid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'wrongpassword' });
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject missing email', async () => {
    const res = await request(app).post('/api/auth/login').send({ password: 'Admin1234!' });
    expect(res.statusCode).toBe(400);
  });
});

describe('GET /api/auth/me', () => {
  it('should return current user when authenticated', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe('admin@test.com');
  });

  it('should return 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });
});

// ── Student Tests ─────────────────────────────────────
describe('POST /api/students', () => {
  it('admin should create a student', async () => {
    const res = await request(app)
      .post('/api/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        studentId: 'TEST001', firstName: 'Jane', lastName: 'Doe',
        email: 'jane.doe@test.com', dateOfBirth: '2006-01-01',
        gender: 'female', dataConsentGiven: true,
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.studentId).toBe('TEST001');
    testStudentId = res.body.data._id;
  });

  it('should reject duplicate student ID', async () => {
    const res = await request(app)
      .post('/api/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        studentId: 'TEST001', firstName: 'Duplicate', lastName: 'Student',
        email: 'duplicate@test.com', dateOfBirth: '2006-01-01',
        gender: 'male', dataConsentGiven: true,
      });
    expect(res.statusCode).toBe(400);
  });

  it('teacher should NOT be able to create student (403)', async () => {
    const res = await request(app)
      .post('/api/students')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        studentId: 'TEST002', firstName: 'Blocked', lastName: 'User',
        email: 'blocked@test.com', dateOfBirth: '2006-01-01',
        gender: 'male', dataConsentGiven: true,
      });
    expect(res.statusCode).toBe(403);
  });
});

describe('GET /api/students', () => {
  it('should return list of students for authenticated user', async () => {
    const res = await request(app).get('/api/students').set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
  });

  it('should return 401 without authentication', async () => {
    const res = await request(app).get('/api/students');
    expect(res.statusCode).toBe(401);
  });
});

describe('PUT /api/students/:id', () => {
  it('admin should update a student', async () => {
    const res = await request(app)
      .put(`/api/students/${testStudentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ firstName: 'Jane Updated' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.firstName).toBe('Jane Updated');
  });
});

describe('DELETE /api/students/:id', () => {
  it('admin should delete a student', async () => {
    const res = await request(app)
      .delete(`/api/students/${testStudentId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ── Health Check ─────────────────────────────────────
describe('GET /api/health', () => {
  it('should return 200 with health status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
