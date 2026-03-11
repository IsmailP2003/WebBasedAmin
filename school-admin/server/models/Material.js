const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    filename: { type: String, required: true },   // stored filename on disk
    originalName: { type: String, required: true },   // original upload filename
    mimetype: { type: String },
    size: { type: Number },                   // bytes
    type: {
        type: String,
        enum: ['lecture', 'assignment', 'reading', 'resource', 'other'],
        default: 'resource',
    },
}, { timestamps: true });

module.exports = mongoose.model('Material', materialSchema);
