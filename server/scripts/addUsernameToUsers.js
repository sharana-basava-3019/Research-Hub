/**
 * Script to add username field to existing users
 * Generates unique usernames from email addresses
 */

const mongoose = require('mongoose');
const path = require('path');
const User = require('../models/User');

// Load environment variables from parent directory
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const addUsernameToUsers = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/research-hub';
    await mongoose.connect(mongoUri);

    console.log('📊 Connected to MongoDB');

    // Find all users without username
    const users = await User.find({ username: { $exists: false } });
    console.log(`\n📝 Found ${users.length} users without username`);

    if (users.length === 0) {
      console.log('✅ All users already have usernames!');
      process.exit(0);
    }

    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        // Generate username from email (before @)
        let baseUsername = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_.]/g, '_');
        let username = baseUsername;
        let counter = 1;

        // Check if username exists and make it unique
        while (await User.usernameExists(username)) {
          username = `${baseUsername}${counter}`;
          counter++;
        }

        // Update user with new username
        user.username = username;
        await user.save();

        console.log(`✅ Added username '@${username}' for ${user.email}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error updating ${user.email}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Successfully updated: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log('\n✨ Migration completed!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

addUsernameToUsers();
