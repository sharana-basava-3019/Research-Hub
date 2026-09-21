/**
 * Notification Model
 * Handles system notifications for users
 */

const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient is required']
  },
  type: {
    type: String,
    enum: [
      'COLLABORATION_REQUEST',
      'COLLABORATION_ACCEPTED',
      'COLLABORATION_REJECTED',
      'PROJECT_INVITE',
      'COMMENT',
      'EVENT_REMINDER',
      'DEADLINE_REMINDER',
      'SYSTEM_ANNOUNCEMENT',
      'NEW_FOLLOWER',
      'PROJECT_UPDATE',
      'VERIFICATION_REQUEST',
      'VERIFICATION_APPROVED',
      'VERIFICATION_REJECTED',
      'COLLABORATION_REVOKED',
      'COLLABORATOR_REMOVED',
      'COLLABORATION_EXITED',
      'COLLABORATOR_LEFT'
    ],
    required: [true, 'Notification type is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  link: {
    type: String,
    trim: true
  },
  relatedModel: {
    type: String,
    enum: ['Project', 'Collaboration', 'Event', 'Comment', 'User', 'VerificationRequest'],
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'relatedModel'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
NotificationSchema.index({ recipient: 1, isRead: 1 });
NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to create notification and broadcast real-time event
NotificationSchema.statics.createNotification = async function(data) {
  const notification = await this.create(data);
  try {
    const { emitNotification } = require('../utils/socketEmitter');
    emitNotification(notification.recipient, notification);
  } catch (err) {
    // Socket emission failure should not abort notification creation
  }
  return notification;
};

// Static method to get user's unread count
NotificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({ recipient: userId, isRead: false });
};

// Instance method to mark as read
NotificationSchema.methods.markAsRead = async function() {
  this.isRead = true;
  await this.save();
  return this;
};

module.exports = mongoose.model('Notification', NotificationSchema);
