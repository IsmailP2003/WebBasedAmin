const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Material = require('../models/Material');
const Course = require('../models/Course');
const { protect, authorize } = require('../middleware/auth');
const { createAuditEntry } = require('../utils/auditLogger');

const router = express.Router({ mergeParams: true }); // courseId from parent
router.use(protect);

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, `${Date.now()}-${safe}`);
    },
});
const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
    fileFilter: (req, file, cb) => {
        const allowed = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'image/png', 'image/jpeg', 'image/gif', 'image/webp',
            'application/zip',
        ];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error('File type not allowed'), false);
    },
});

// GET /api/courses/:courseId/materials
router.get('/', async (req, res, next) => {
    try {
        const materials = await Material.find({ course: req.params.courseId })
            .populate('uploadedBy', 'name role')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: materials });
    } catch (err) { next(err); }
});

// POST /api/courses/:courseId/materials — upload file
router.post('/', authorize('admin', 'teacher'), upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
        const course = await Course.findById(req.params.courseId);
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

        const material = await Material.create({
            title: req.body.title || req.file.originalname,
            description: req.body.description,
            type: req.body.type || 'resource',
            course: req.params.courseId,
            uploadedBy: req.user._id,
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
        });

        await material.populate('uploadedBy', 'name role');
        await createAuditEntry({
            action: 'CREATE_MATERIAL', performedBy: req.user,
            targetModel: 'Material', targetId: material._id,
            details: `Uploaded "${material.title}" to ${course.courseCode}`, req,
        });

        res.status(201).json({ success: true, data: material });
    } catch (err) { next(err); }
});

// GET /api/courses/:courseId/materials/:id/download — serve file
router.get('/:id/download', async (req, res, next) => {
    try {
        const material = await Material.findOne({ _id: req.params.id, course: req.params.courseId });
        if (!material) return res.status(404).json({ success: false, message: 'Material not found' });
        const filePath = path.join(uploadDir, material.filename);
        if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'File not found on server' });
        res.setHeader('Content-Disposition', `attachment; filename="${material.originalName}"`);
        res.download(filePath, material.originalName);
    } catch (err) { next(err); }
});

// DELETE /api/courses/:courseId/materials/:id
router.delete('/:id', authorize('admin', 'teacher'), async (req, res, next) => {
    try {
        const material = await Material.findOne({ _id: req.params.id, course: req.params.courseId });
        if (!material) return res.status(404).json({ success: false, message: 'Not found' });
        if (String(material.uploadedBy) !== String(req.user._id) && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorised' });
        }
        // Remove file from disk
        const filePath = path.join(uploadDir, material.filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        await material.deleteOne();
        res.json({ success: true, message: 'Material deleted' });
    } catch (err) { next(err); }
});

module.exports = router;
