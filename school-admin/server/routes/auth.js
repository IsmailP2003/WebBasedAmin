const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { createAuditEntry } = require('../utils/auditLogger');

const router = express.Router();

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/login
router.post('/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { email, password } = req.body;
      const user = await User.findOne({ email }).select('+password');

      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      if (!user.isActive) {
        return res.status(401).json({ success: false, message: 'Your account has been deactivated.' });
      }

      // Update last login
      await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

      // Audit log
      await createAuditEntry({
        action: 'USER_LOGIN',
        performedBy: user._id,
        targetModel: 'User',
        targetId: user._id,
        details: `User ${user.name} (${user.email}) logged in`,
        req,
      });

      const token = signToken(user._id);

      res.json({
        success: true,
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/auth/me — get current user
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// PATCH /api/auth/change-password — change own password
// Teachers are NOT allowed to change their own password; an admin must reset it for them.
router.patch('/change-password', protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  async (req, res, next) => {
    try {
      // Block teachers — password changes for teachers must go through admin reset
      if (req.user.role === 'teacher') {
        return res.status(403).json({
          success: false,
          message: 'Teachers cannot change their own password. Please contact an administrator.',
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
      }

      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user._id).select('+password');

      if (!user || !(await user.comparePassword(currentPassword))) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
      }
      if (currentPassword === newPassword) {
        return res.status(400).json({ success: false, message: 'New password must differ from the current one.' });
      }

      user.password = newPassword;
      await user.save(); // pre-save hook hashes it

      await createAuditEntry({
        action: 'PASSWORD_CHANGED',
        performedBy: user._id,
        targetModel: 'User',
        targetId: user._id,
        details: `${user.name} changed their password`,
        req,
      });

      res.json({ success: true, message: 'Password updated successfully.' });
    } catch (err) { next(err); }
  }
);

module.exports = router;
