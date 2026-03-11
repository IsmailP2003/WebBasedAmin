const express = require('express');
const { body, validationResult } = require('express-validator');
const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { createAuditEntry } = require('../utils/auditLogger');

const router = express.Router();
router.use(protect);

// Helper: fan out notifications to all users (or filtered set)
async function notifyUsers(announcement, authorId) {
    try {
        const query = { isActive: true, _id: { $ne: authorId } };
        if (announcement.target.type === 'role' && announcement.target.role) {
            query.role = announcement.target.role;
        }
        const users = await User.find(query).select('_id');
        const notes = users.map(u => ({
            user: u._id, type: 'announcement',
            title: `📢 ${announcement.title}`,
            message: announcement.body.slice(0, 120) + (announcement.body.length > 120 ? '…' : ''),
            icon: announcement.priority === 'urgent' ? '🚨' : announcement.pinned ? '📌' : '📢',
            link: '/announcements',
        }));
        if (notes.length) await Notification.insertMany(notes);
    } catch (err) {
        console.error('Notification fan-out failed:', err.message);
    }
}

// GET /api/announcements — list visible announcements
router.get('/', async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        // Build visibility filter
        const orFilter = [
            { 'target.type': 'all' },
            { 'target.type': 'role', 'target.role': req.user.role },
        ];

        const query = {
            $or: orFilter,
            $or: [{ expiresAt: null }, { expiresAt: { $gte: new Date() } }],
        };

        const [announcements, total] = await Promise.all([
            Announcement.find(query)
                .populate('author', 'name role')
                .populate('target.course', 'courseCode name')
                .sort({ pinned: -1, createdAt: -1 })
                .skip(skip).limit(Number(limit)),
            Announcement.countDocuments(query),
        ]);

        res.json({ success: true, data: announcements, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
    } catch (err) { next(err); }
});

// POST /api/announcements — create (admin/teacher)
router.post('/',
    authorize('admin', 'teacher'),
    [
        body('title').notEmpty().trim().withMessage('Title is required'),
        body('body').notEmpty().trim().withMessage('Body is required'),
    ],
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

            const announcement = await Announcement.create({ ...req.body, author: req.user._id });
            await announcement.populate('author', 'name role');

            // Fan out notifications async
            notifyUsers(announcement, req.user._id);

            await createAuditEntry({
                action: 'CREATE_ANNOUNCEMENT', performedBy: req.user,
                targetModel: 'Announcement', targetId: announcement._id,
                details: `Posted announcement: "${announcement.title}"`, req,
            });

            res.status(201).json({ success: true, data: announcement });
        } catch (err) { next(err); }
    }
);

// PATCH /api/announcements/:id/pin — toggle pin (admin only)
router.patch('/:id/pin', authorize('admin'), async (req, res, next) => {
    try {
        const ann = await Announcement.findById(req.params.id);
        if (!ann) return res.status(404).json({ success: false, message: 'Not found' });
        ann.pinned = !ann.pinned;
        await ann.save();
        res.json({ success: true, data: ann, message: ann.pinned ? 'Pinned!' : 'Unpinned' });
    } catch (err) { next(err); }
});

// DELETE /api/announcements/:id
router.delete('/:id', authorize('admin', 'teacher'), async (req, res, next) => {
    try {
        const ann = await Announcement.findById(req.params.id);
        if (!ann) return res.status(404).json({ success: false, message: 'Not found' });
        // Only author or admin can delete
        if (String(ann.author) !== String(req.user._id) && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorised to delete this announcement' });
        }
        await ann.deleteOne();
        res.json({ success: true, message: 'Announcement deleted' });
    } catch (err) { next(err); }
});

module.exports = router;
