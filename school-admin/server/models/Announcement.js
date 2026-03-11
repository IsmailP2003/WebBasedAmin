const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true, trim: true, maxlength: 5000 },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    target: {
        type: { type: String, enum: ['all', 'role', 'course'], default: 'all' },
        role: { type: String, enum: ['admin', 'teacher', 'student'] },
        course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    },
    pinned: { type: Boolean, default: false },
    priority: { type: String, enum: ['normal', 'important', 'urgent'], default: 'normal' },
    expiresAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
