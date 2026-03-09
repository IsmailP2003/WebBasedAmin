const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'CREATE_STUDENT', 'UPDATE_STUDENT', 'DELETE_STUDENT',
      'CREATE_COURSE', 'UPDATE_COURSE', 'DELETE_COURSE',
      'ENROL_STUDENT', 'REMOVE_STUDENT_FROM_COURSE',
      'MARK_ATTENDANCE', 'UPDATE_ATTENDANCE',
      'ADD_GRADE', 'UPDATE_GRADE', 'DELETE_GRADE',
      'USER_LOGIN', 'USER_LOGOUT',
      'CREATE_USER', 'UPDATE_USER', 'DELETE_USER',
    ],
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  targetModel: {
    type: String,
    enum: ['Student', 'Course', 'Attendance', 'Grade', 'User'],
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  details: {
    type: String,
    maxlength: [500, 'Details cannot exceed 500 characters'],
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
}, { timestamps: true });

// TTL index: auto-delete audit logs after 1 year (data minimisation - GDPR Art. 5)
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
