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
  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    return next(new ErrorResponse('Please provide valid email and password', 400));
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
  // Whitelist fields users are allowed to update on their own profile.
  // 'designation' is intentionally excluded — only admins may change it via the admin
  // user-management route — to prevent self-escalation to 'Professor' (which grants
  // the ability to approve project verification requests).
  const fieldsToUpdate = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    institution: req.body.institution,
    department: req.body.department,
    researchInterests: req.body.researchInterests,
    bio: req.body.bio,
    phone: req.body.phone,
    website: req.body.website,
    linkedIn: req.body.linkedIn,
    googleScholar: req.body.googleScholar,
    orcid: req.body.orcid,
    profilePicture: req.body.profilePicture,
    privacySettings: req.body.privacySettings,
    notificationPrefs: req.body.notificationPrefs
  };

  // Also accept socialLinks as a nested object (sent by the Profile page) and
  // map each sub-key to its flat schema counterpart for backward compatibility.
  if (req.body.socialLinks && typeof req.body.socialLinks === 'object') {
    const sl = req.body.socialLinks;
    if (sl.linkedin !== undefined) fieldsToUpdate.linkedIn = sl.linkedin;
    if (sl.googleScholar !== undefined) fieldsToUpdate.googleScholar = sl.googleScholar;
    if (sl.orcid !== undefined) fieldsToUpdate.orcid = sl.orcid;
    if (sl.website !== undefined && fieldsToUpdate.website === undefined) {
      fieldsToUpdate.website = sl.website;
    }
  }

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
    pub => (pub?._id || pub?.id || pub || '').toString() !== (req.params.publicationId || '').toString()
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

/**
 * @desc    Delete own account (self-service)
 * @route   DELETE /api/auth/deleteaccount
 * @access  Private
 */
exports.deleteAccount = asyncHandler(async (req, res, next) => {
  // Require password confirmation to prevent accidental or CSRF-triggered deletion
  const { password } = req.body;
  if (!password) {
    return next(new ErrorResponse('Please provide your password to confirm account deletion', 400));
  }

  const user = await User.findById(req.user.id).select('+password');
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return next(new ErrorResponse('Incorrect password', 401));
  }

  await User.findByIdAndDelete(req.user.id);

  res.status(200).json({
    status: 'success',
    message: 'Account deleted successfully'
  });
});

/**
 * @desc    Update own email address (self-service)
 * @route   PUT /api/auth/updateemail
 * @access  Private
 */
exports.updateEmail = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email) {
    return next(new ErrorResponse('Please provide a new email address', 400));
  }
  if (!password) {
    return next(new ErrorResponse('Please provide your password to confirm email change', 400));
  }

  const user = await User.findById(req.user.id).select('+password');
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Confirm identity before changing email
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return next(new ErrorResponse('Incorrect password', 401));
  }

  // Check if email is already taken by another account
  const existing = await User.findOne({ email: email.toLowerCase() });
  const existingId = (existing?._id || existing?.id || existing || '').toString();
  const currentUserId = (req.user?.id || req.user?._id || req.user || '').toString();
  if (existing && existingId !== currentUserId) {
    return next(new ErrorResponse('Email address is already in use', 400));
  }

  user.email = email.toLowerCase();
  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Email updated successfully',
    data: {
      user: user.getPublicProfile()
    }
  });
});

/**
 * @desc    Get active researchers (publicly visible profiles)
 * @route   GET /api/auth/active-researchers
 * @access  Public
 */
exports.getActiveResearchers = asyncHandler(async (req, res, next) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 8, 50);

  const users = await User.find({ isActive: true })
    .select('firstName lastName username institution department designation researchInterests profilePicture publications')
    .populate('projects', 'title description status researchArea isOpenForCollaboration')
    .limit(limit)
    .sort('-createdAt');

  const formatted = users.map(u => ({
    _id: u._id,
    id: u._id,
    firstName: u.firstName,
    lastName: u.lastName,
    name: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
    username: u.username,
    institution: u.institution,
    department: u.department,
    designation: u.designation,
    researchInterests: u.researchInterests || [],
    expertise: u.researchInterests || [],
    profilePicture: u.profilePicture,
    avatar: u.profilePicture,
    publications: u.publications || [],
    projects: Array.isArray(u.projects) ? u.projects.map(p => ({
      _id: p._id,
      id: p._id,
      title: p.title,
      description: p.description,
      status: p.status,
      researchArea: p.researchArea,
      isOpenForCollaboration: p.isOpenForCollaboration
    })) : [],
    projectCount: Array.isArray(u.projects) ? u.projects.length : 0
  }));

  res.status(200).json({
    status: 'success',
    count: formatted.length,
    data: {
      users: formatted
    }
  });
});

/**
 * @desc    Resend email verification
 * @route   POST /api/auth/resend-verification
 * @access  Private
 */
exports.resendVerification = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  if (user.isEmailVerified) {
    return res.status(200).json({
      status: 'success',
      message: 'Email is already verified'
    });
  }

  // Simulated email dispatch (production would send SMTP token email)
  res.status(200).json({
    status: 'success',
    message: `Verification email sent to ${user.email}. Please check your inbox.`
  });
});

/**
 * @desc    Search users for collaborator invitation / mentions
 * @route   GET /api/auth/search-users
 * @access  Private
 */
exports.searchUsers = asyncHandler(async (req, res, next) => {
  const rawQuery = (req.query.q || req.query.query || req.query.search || '').trim();

  if (!rawQuery || rawQuery.length < 1) {
    return res.status(200).json({
      status: 'success',
      count: 0,
      data: { users: [] }
    });
  }

  // Helper to escape regex special characters
  const escapeRegex = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

  // Strip leading @ for queries like "@alice"
  const cleanQuery = rawQuery.replace(/^@+/, '').trim();
  if (!cleanQuery) {
    return res.status(200).json({
      status: 'success',
      count: 0,
      data: { users: [] }
    });
  }

  const queryRegex = new RegExp(escapeRegex(cleanQuery), 'i');

  const orConditions = [
    { username: queryRegex },
    { email: queryRegex },
    { firstName: queryRegex },
    { lastName: queryRegex },
    // Match full name using $expr with $concat (e.g. "Alice Johnson")
    {
      $expr: {
        $regexMatch: {
          input: { $concat: ["$firstName", " ", "$lastName"] },
          regex: escapeRegex(cleanQuery),
          options: "i"
        }
      }
    }
  ];

  // Also handle multi-word split queries
  const words = cleanQuery.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    const firstWord = words[0];
    const restWords = words.slice(1).join(' ');
    orConditions.push(
      {
        $and: [
          { firstName: new RegExp(escapeRegex(firstWord), 'i') },
          { lastName: new RegExp(escapeRegex(restWords), 'i') }
        ]
      },
      {
        $and: [
          { firstName: new RegExp(escapeRegex(restWords), 'i') },
          { lastName: new RegExp(escapeRegex(firstWord), 'i') }
        ]
      }
    );
  }

  const filter = {
    $or: orConditions
  };

  // Exclude current authenticated user if logged in
  if (req.user && req.user.id) {
    filter._id = { $ne: req.user.id };
  }

  const users = await User.find(filter)
    .select('firstName lastName username email institution department designation profilePicture')
    .limit(20)
    .lean();

  const formatted = users.map(u => ({
    _id: u._id,
    id: u._id,
    firstName: u.firstName,
    lastName: u.lastName,
    fullName: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
    username: u.username,
    email: u.email,
    institution: u.institution,
    department: u.department,
    designation: u.designation,
    profilePicture: u.profilePicture
  }));

  res.status(200).json({
    status: 'success',
    count: formatted.length,
    data: {
      users: formatted
    }
  });
});
