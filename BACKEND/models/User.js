/**
 * User Model
 * Represents researchers/users in the system
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: [true, 'Please provide first name'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Please provide last name'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  username: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [
      /^[a-z0-9_\.]+$/,
      'Username can only contain lowercase letters, numbers, underscores and dots'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password by default
  },

  // Academic Information
  institution: {
    type: String,
    required: [true, 'Please provide institution name'],
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  designation: {
    type: String,
    enum: ['Admin', 'Professor', 'Researcher', 'Student', 'Guest'],
    default: 'Student'
  },
  researchInterests: [{
    type: String,
    trim: true
  }],
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },

  // Contact & Social
  phone: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  linkedIn: {
    type: String,
    trim: true
  },
  googleScholar: {
    type: String,
    trim: true
  },
  orcid: {
    type: String,
    trim: true
  },

  // Profile Picture
  profilePicture: {
    type: String,
    default: 'default-avatar.jpg'
  },

  // Publications
  publications: [{
    title: String,
    journal: String,
    year: Number,
    doi: String,
    url: String
  }],

  // User Role
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },

  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },

  // Privacy Settings
  privacySettings: {
    profileVisibility: {
      type: String,
      enum: ['public', 'registered', 'private'],
      default: 'public'
    },
    showEmail: {
      type: Boolean,
      default: true
    },
    showProjects: {
      type: Boolean,
      default: true
    }
  },

  // Notification Preferences
  notificationPrefs: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    collaborationRequests: {
      type: Boolean,
      default: true
    },
    projectUpdates: {
      type: Boolean,
      default: true
    },
    eventReminders: {
      type: Boolean,
      default: true
    },
    weeklyDigest: {
      type: Boolean,
      default: false
    },
    comments: {
      type: Boolean,
      default: true
    },
    mentions: {
      type: Boolean,
      default: true
    },
    newFollowers: {
      type: Boolean,
      default: true
    }
  },

  // Timestamps
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
UserSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for user's projects
UserSchema.virtual('projects', {
  ref: 'Project',
  localField: '_id',
  foreignField: 'owner',
  justOne: false
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  // Only hash password if it's modified
  if (!this.isModified('password')) {
    return next();
  }

  // Generate salt and hash password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate JWT token
UserSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Method to get public profile
UserSchema.methods.getPublicProfile = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Static method to find user by username
UserSchema.statics.findByUsername = async function(username) {
  return await this.findOne({ username: username.toLowerCase() });
};

// Static method to check if username exists
UserSchema.statics.usernameExists = async function(username) {
  const user = await this.findOne({ username: username.toLowerCase() });
  return !!user;
};

// Index for search optimization (email and username already indexed via unique: true)
UserSchema.index({ institution: 1 });
UserSchema.index({ researchInterests: 1 });

module.exports = mongoose.model('User', UserSchema);
