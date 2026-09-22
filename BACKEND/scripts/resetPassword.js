/**
 * CLI Script: Reset password for an existing Research Hub user
 * Usage: node scripts/resetPassword.js <email> <newPassword>
 */

const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables from BACKEND/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const resetPassword = async () => {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error('Usage: node scripts/resetPassword.js <email> <newPassword>');
    process.exit(1);
  }

  const mongoURI = (process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/research-hub')
    .replace('//localhost', '//127.0.0.1');

  try {
    await mongoose.connect(mongoURI, {
      family: 4,
      serverSelectionTimeoutMS: 10000,
    });

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({
      $or: [
        { email: cleanEmail },
        { email: email.trim() }
      ]
    });

    if (!user) {
      console.error('User not found.');
      await mongoose.connection.close();
      process.exit(1);
    }

    // Ensure required schema fields exist if record came from another schema
    if (!user.firstName && user.get('name')) {
      const parts = String(user.get('name')).trim().split(' ');
      user.firstName = parts[0] || 'User';
      user.lastName = parts.slice(1).join(' ') || 'Member';
    } else if (!user.firstName) {
      user.firstName = 'User';
      user.lastName = 'Member';
    }
    if (!user.institution) {
      user.institution = 'Research Hub';
    }

    // Set new password (triggers User pre-save bcrypt hashing middleware)
    user.password = newPassword;
    await user.save();

    console.log('Password reset successful.');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error resetting password:', error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

resetPassword();
