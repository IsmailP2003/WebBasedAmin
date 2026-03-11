const express = require('express');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/notifications — current user's notifications
router.get('/', async (req, res, next) => {
    try {
        const { unreadOnly, limit = 30 } = req.query;
        const query = { user: req.user._id };
        if (unreadOnly === 'true') query.read = false;

        const [notifications, unreadCount] = await Promise.all([
            Notification.find(query).sort({ createdAt: -1 }).limit(Number(limit)),
            Notification.countDocuments({ user: req.user._id, read: false }),
        ]);

        res.json({ success: true, data: notifications, unreadCount });
    } catch (err) { next(err); }
});

// PATCH /api/notifications/:id/read — mark single as read
router.patch('/:id/read', async (req, res, next) => {
    try {
        await Notification.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { read: true }
        );
        res.json({ success: true });
    } catch (err) { next(err); }
});

// PATCH /api/notifications/read-all — mark all as read
router.patch('/read-all', async (req, res, next) => {
    try {
        await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (err) { next(err); }
});

// DELETE /api/notifications/:id
router.delete('/:id', async (req, res, next) => {
    try {
        await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        res.json({ success: true });
    } catch (err) { next(err); }
});

module.exports = router;
