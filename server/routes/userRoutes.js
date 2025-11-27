/**
 * User Routes (Admin)
 * @route /api/users
 */

const express = require('express');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/validator');
const { ErrorResponse } = require('../middleware/errorHandler');

const router = express.Router();

// All routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

/**
 * @desc    Get all users
 * @route   GET /api/users
 * @access  Private/Admin
 */
router.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const users = await User.find()
    .select('-password')
    .sort('-createdAt')
    .skip(skip)
    .limit(limit);

  const total = await User.countDocuments();

  res.status(200).json({
    status: 'success',
    count: users.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: {
      users
    }
  });
}));

/**
 * @desc    Get single user
 * @route   GET /api/users/:id
 * @access  Private/Admin
 */
router.get('/:id', asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
}));

/**
 * @desc    Update user
 * @route   PUT /api/users/:id
 * @access  Private/Admin
 */
router.put('/:id', asyncHandler(async (req, res, next) => {
  // Prevent changing sensitive fields
  delete req.body.password;
  delete req.body.email;

  const user = await User.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  ).select('-password');

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    message: 'User updated successfully',
    data: {
      user
    }
  });
}));

/**
 * @desc    Delete user
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
router.delete('/:id', asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  await user.deleteOne();

  res.status(200).json({
    status: 'success',
    message: 'User deleted successfully',
    data: {}
  });
}));

module.exports = router;
