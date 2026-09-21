/**
 * Authentication Middleware
 * Protects routes and verifies JWT tokens
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes - requires valid JWT token
 */
exports.protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if token exists
  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Not authorized to access this route. Please login.'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not found. Token invalid.'
      });
    }

    // Check if user is active
    if (!req.user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Not authorized. Token invalid or expired.',
      error: error.message
    });
  }
};

/**
 * Grant access to specific roles or designations
 * @param  {...string} roles - Allowed roles or designations
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user?.role;
    const userDesignation = req.user?.designation;

    const isAllowed = roles.includes(userRole) ||
      roles.includes(userDesignation) ||
      (roles.includes('faculty') && ['Professor', 'Researcher', 'Admin'].includes(userDesignation));

    if (!isAllowed) {
      return res.status(403).json({
        status: 'error',
        message: `User with role '${userRole}' and designation '${userDesignation}' is not authorized to access this route`
      });
    }
    next();
  };
};

/**
 * Optional authentication - doesn't require token but attaches user if present
 */
exports.optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      // Token invalid, but we don't fail - just continue without user
      req.user = null;
    }
  }

  next();
};
