/**
 * Authentication Controller
 * Handles user registration, login, and profile management
 */

const User = require('../models/User');
const { asyncHandler } = require('../middleware/validator');
const { ErrorResponse } = require('../middleware/errorHandler');

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = asyncHandler(async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    username,
    password,
    institution,
    department,
    designation,
    researchInterests
  } = req.body;

  // Check if username already exists
  const usernameExists = await User.usernameExists(username);
  if (usernameExists) {
    return next(new ErrorResponse('Username already taken', 400));
  }

  // Create user
  const user = await User.create({
    firstName,
    lastName,
    email,
    username,
    password,
    institution,
    department,
    designation,
    researchInterests
  });

  // Generate token
  const token = user.generateAuthToken();

  res.status(201).json({
    status: 'success',
    message: 'User registered successfully',
    data: {
      user: user.getPublicProfile(),
      token
    }
  });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide email and password', 400));
  }

  // Check for user (include password)
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if password matches
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if account is active
  if (!user.isActive) {
    return next(new ErrorResponse('Account has been deactivated', 401));
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate token
  const token = user.generateAuthToken();

  res.status(200).json({
    status: 'success',
    message: 'Login successful',
    data: {
      user: user.getPublicProfile(),
      token
    }
  });
});

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id)
    .populate('projects');

  res.status(200).json({
    status: 'success',
    data: {
      user: user.getPublicProfile()
    }
  });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/updateprofile
 * @access  Private
 */
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    institution: req.body.institution,
    department: req.body.department,
    designation: req.body.designation,
    researchInterests: req.body.researchInterests,
    bio: req.body.bio,
    phone: req.body.phone,
    website: req.body.website,
    linkedIn: req.body.linkedIn,
    googleScholar: req.body.googleScholar,
    orcid: req.body.orcid,
    profilePicture: req.body.profilePicture
  };

  // Remove undefined fields
  Object.keys(fieldsToUpdate).forEach(key => 
    fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
  );

  const user = await User.findByIdAndUpdate(
    req.user.id,
    fieldsToUpdate,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    status: 'success',
    message: 'Profile updated successfully',
    data: {
      user: user.getPublicProfile()
    }
  });
});

/**
 * @desc    Update password
 * @route   PUT /api/auth/updatepassword
 * @access  Private
 */
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new ErrorResponse('Please provide current and new password', 400));
  }

  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  const isMatch = await user.comparePassword(currentPassword);

  if (!isMatch) {
    return next(new ErrorResponse('Current password is incorrect', 401));
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Generate new token
  const token = user.generateAuthToken();

  res.status(200).json({
    status: 'success',
    message: 'Password updated successfully',
    data: {
      token
    }
  });
});

/**
 * @desc    Add publication to user profile
 * @route   POST /api/auth/publications
 * @access  Private
 */
exports.addPublication = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  user.publications.push(req.body);
  await user.save();

  res.status(201).json({
    status: 'success',
    message: 'Publication added successfully',
    data: {
      publications: user.publications
    }
  });
});

/**
 * @desc    Delete publication from user profile
 * @route   DELETE /api/auth/publications/:publicationId
 * @access  Private
 */
exports.deletePublication = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  user.publications = user.publications.filter(
    pub => pub._id.toString() !== req.params.publicationId
  );
  
  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Publication deleted successfully',
    data: {
      publications: user.publications
    }
  });
});

/**
 * @desc    Check if username exists
 * @route   GET /api/auth/check-username/:username
 * @access  Public
 */
exports.checkUsername = asyncHandler(async (req, res, next) => {
  const { username } = req.params;
  
  if (!username || username.length < 3) {
    return next(new ErrorResponse('Username must be at least 3 characters', 400));
  }

  const exists = await User.usernameExists(username);
  
  res.status(200).json({
    status: 'success',
    data: {
      exists,
      available: !exists
    }
  });
});

/**
 * @desc    Get user by username
 * @route   GET /api/auth/user/:username
 * @access  Public
 */
exports.getUserByUsername = asyncHandler(async (req, res, next) => {
  const { username } = req.params;
  
  const user = await User.findByUsername(username);
  
  if (!user) {
    return next(new ErrorResponse('User not found with this username', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user: user.getPublicProfile()
    }
  });
});
