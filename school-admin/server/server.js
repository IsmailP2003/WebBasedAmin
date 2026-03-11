require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

// Route imports
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const courseRoutes = require('./routes/courses');
const attendanceRoutes = require('./routes/attendance');
const gradeRoutes = require('./routes/grades');
const analyticsRoutes = require('./routes/analytics');
const auditRoutes = require('./routes/audit');
const evaluationRoutes = require('./routes/evaluation');
const userRoutes = require('./routes/users');
const announcementRoutes = require('./routes/announcements');
const notificationRoutes = require('./routes/notifications');
const materialRoutes = require('./routes/materials');

const app = express();

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.CLIENT_URL : 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting — protects against brute force (OWASP A07)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
});
app.use('/api/', limiter);
app.use('/api/auth', authLimiter);

// Body parsing (increased limit to handle file metadata)
app.use(express.json({ limit: '25kb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically (with auth guard done at route level)
app.use('/uploads', express.static(require('path').join(__dirname, '../uploads')));

// HTTP logging (dev only)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/evaluation', evaluationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/courses/:courseId/materials', materialRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'School Admin API is running', timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`\n🚀 School Admin Server running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  });
}

module.exports = app;
