// JWT middleware — protect checks the token is valid and the user is still active
// authorize is used on routes that need a specific role (e.g. admin only)
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Checks the Bearer token on every protected route.
// Also rejects users that have been deactivated mid-session — just having a valid
// token isn't enough if the account has been suspended.
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorised. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    // Extra check — if an admin deactivates an account, the user is stopped
    // here even if their token hasn't expired yet
    if (!req.user || !req.user.isActive) {
      return res.status(401).json({ success: false, message: 'User account is inactive or not found.' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token. Please log in again.' });
  }
};

// Role check — returns a middleware function so it can be used inline on any route.
// e.g. authorize('admin') or authorize('admin', 'teacher') for shared access.
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not permitted to access this resource.`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
