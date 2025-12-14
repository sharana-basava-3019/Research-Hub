/**
 * Test notification creation
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Load environment variables
dotenv.config();

const testNotification = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Find a user to create notification for
    const user = await User.findOne();
    if (!user) {
      console.log('No users found');
      return;
    }

    console.log(`Creating test notification for user: ${user.firstName} ${user.lastName}`);

    // Create test notification
    const notification = await Notification.create({
      recipient: user._id,
      type: 'PROJECT_UPDATE',
      title: 'Test Notification',
      message: 'This is a test notification to verify the system is working',
      link: '/projects',
      relatedModel: 'Project',
      relatedId: user._id
    });

    console.log('Test notification created:', notification._id);

    // Get unread count
    const unreadCount = await Notification.getUnreadCount(user._id);
    console.log(`User has ${unreadCount} unread notifications`);

    // Fetch notifications
    const notifications = await Notification.find({ recipient: user._id })
      .sort('-createdAt')
      .limit(5);

    console.log(`Found ${notifications.length} notifications for user`);
    
    mongoose.disconnect();
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
    mongoose.disconnect();
  }
};

if (require.main === module) {
  testNotification();
}

module.exports = testNotification;