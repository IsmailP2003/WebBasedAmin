const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: { type: String, enum: ['announcement', 'grade', 'attendance', 'system', 'alert'], default: 'system' },
    read: { type: Boolean, default: false, index: true },
    link: { type: String }, // optional route e.g. "/grades"
    icon: { type: String, default: '🔔' },
}, { timestamps: true });

// Auto-delete read notifications older than 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30, partialFilterExpression: { read: true } });

module.exports = mongoose.model('Notification', notificationSchema);
