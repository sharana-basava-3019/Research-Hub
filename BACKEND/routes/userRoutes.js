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
 * @desc    Create new user (Admin)
 * @route   POST /api/users
 * @access  Private/Admin
 */
router.post('/', asyncHandler(async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    password,
    institution,
    department,
    designation,
    role
  } = req.body;

  if (!firstName || !lastName || !email || !password || !institution) {
    return next(new ErrorResponse('Please provide first name, last name, email, password, and institution', 400));
  }

  // Check email
  const existingEmail = await User.findOne({ email: email.toLowerCase() });
  if (existingEmail) {
    return next(new ErrorResponse('Email already in use', 400));
  }

  // Determine or generate username
  let username = req.body.username;
  if (!username) {
    const baseUsername = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`.replace(/[^a-z0-9_.]/g, '');
    let candidate = baseUsername || `user_${Date.now()}`;
    let suffix = 1;
    while (await User.usernameExists(candidate)) {
      candidate = `${baseUsername}${suffix++}`;
    }
    username = candidate;
  } else {
    if (await User.usernameExists(username)) {
      return next(new ErrorResponse('Username already taken', 400));
    }
  }

  const user = await User.create({
    firstName,
    lastName,
    email: email.toLowerCase(),
    username,
    password,
    institution,
    department,
    designation: designation || 'Student',
    role: role || 'user'
  });

  res.status(201).json({
    status: 'success',
    message: 'User created successfully',
    data: {
      user: user.getPublicProfile()
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
  // Whitelist allowed fields to prevent privilege escalation (e.g., unauthorized role changes)
  const allowedFields = [
    'firstName',
    'lastName',
    'institution',
    'department',
    'designation',
    'isActive',
    'bio',
    'researchInterests',
    'phone',
    'website',
    'linkedIn',
    'googleScholar',
    'orcid',
    'profilePicture'
  ];

  const updateData = {};
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  const user = await User.findByIdAndUpdate(
    req.params.id,
    updateData,
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
