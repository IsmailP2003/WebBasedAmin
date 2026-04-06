const express = require('express');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { createAuditEntry } = require('../utils/auditLogger');

const router = express.Router();
router.use(protect);

// GET /api/users — list users (admin sees all, others see teachers only)
router.get('/', async (req, res, next) => {
  try {
    const { role, includeInactive } = req.query;
    const query = {};

    if (req.user.role === 'admin') {
      // Admin can optionally include inactive users and filter by role
      if (role) query.role = role;
      if (includeInactive !== 'true') query.isActive = true;
    } else {
      // Non-admins can only ever see active teachers
      query.role = 'teacher';
      query.isActive = true;
    }

    const users = await User.find(query).select('name email role isActive lastLogin createdAt').sort({ createdAt: -1 });
    res.json({ success: true, data: users, count: users.length });
  } catch (err) { next(err); }
});

// POST /api/users — create a new user (Admin only)
router.post('/',
  authorize('admin'),
  [
    body('name').notEmpty().withMessage('Name is required').trim(),
    body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['admin', 'teacher', 'student']).withMessage('Invalid role'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

      const user = await User.create(req.body);

      await createAuditEntry({
        action: 'CREATE_USER', performedBy: req.user,
        targetModel: 'User', targetId: user._id,
        details: `Created ${user.role} account for ${user.name} (${user.email})`,
        req,
      });

      res.status(201).json({ success: true, data: user });
    } catch (err) {
      if (err.code === 11000) return res.status(400).json({ success: false, message: 'A user with that email already exists.' });
      next(err);
    }
  }
);

// PATCH /api/users/:id — update name or role
router.patch('/:id', authorize('admin'), async (req, res, next) => {
  try {
    const allowed = {};
    if (req.body.name) allowed.name = req.body.name;
    if (req.body.role) allowed.role = req.body.role;
    const user = await User.findByIdAndUpdate(req.params.id, allowed, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    await createAuditEntry({
      action: 'UPDATE_USER', performedBy: req.user,
      targetModel: 'User', targetId: user._id,
      details: `Updated user ${user.name} — role: ${user.role}`, req,
    });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

// PATCH /api/users/:id/reactivate — re-enable a deactivated account
router.patch('/:id/reactivate', authorize('admin'), async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    await createAuditEntry({
      action: 'UPDATE_USER', performedBy: req.user,
      targetModel: 'User', targetId: user._id,
      details: `Reactivated account for ${user.name} (${user.email})`, req,
    });
    res.json({ success: true, data: user, message: `${user.name}'s account has been reactivated.` });
  } catch (err) { next(err); }
});

// PATCH /api/users/:id/reset-password — admin sets a new password for any user
router.patch('/:id/reset-password',
  authorize('admin'),
  [body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });

      const user = await User.findById(req.params.id).select('+password');
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

      user.password = req.body.newPassword;
      await user.save(); // pre-save hook hashes it

      await createAuditEntry({
        action: 'PASSWORD_CHANGED',
        performedBy: req.user,
        targetModel: 'User',
        targetId: user._id,
        details: `Admin ${req.user.name} reset password for ${user.name} (${user.email})`,
        req,
      });

      res.json({ success: true, message: `Password reset successfully for ${user.name}.` });
    } catch (err) { next(err); }
  }
);

// DELETE /api/users/:id — deactivate a user (Admin only, soft delete)
router.delete('/:id', authorize('admin'), async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own account.' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    await createAuditEntry({
      action: 'DELETE_USER', performedBy: req.user,
      targetModel: 'User', targetId: user._id,
      details: `Deactivated user ${user.name} (${user.email})`,
      req,
    });

    res.json({ success: true, message: `${user.name}'s account has been deactivated.` });
  } catch (err) { next(err); }
});

module.exports = router;
