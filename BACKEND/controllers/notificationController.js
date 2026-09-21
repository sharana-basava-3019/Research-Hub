/**
 * Notification Controller
 * Handles notification operations
 */

const Notification = require('../models/Notification');
const { asyncHandler } = require('../middleware/validator');
const { ErrorResponse } = require('../middleware/errorHandler');

/**
 * @desc    Get user's notifications
 * @route   GET /api/notifications
 * @access  Private
 */
exports.getNotifications = asyncHandler(async (req, res, next) => {
  const { isRead, type, priority } = req.query;
  
  const query = { recipient: req.user._id };
  
  if (isRead !== undefined) {
    query.isRead = isRead === 'true';
  }
  
  if (type) {
    query.type = type;
  }
  
  if (priority) {
    query.priority = priority;
  }

  const notifications = await Notification.find(query)
    .sort('-createdAt')
    .limit(50);

  const unreadCount = await Notification.getUnreadCount(req.user._id);

  res.status(200).json({
    status: 'success',
    count: notifications.length,
    unreadCount,
    data: {
      notifications
    }
  });
});

/**
 * @desc    Get notification by ID
 * @route   GET /api/notifications/:id
 * @access  Private
 */
exports.getNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(new ErrorResponse('Notification not found', 404));
  }

  // Check if user is the recipient
  const recipientId = (notification.recipient?._id || notification.recipient || '').toString();
  const currentUserId = (req.user?._id || req.user?.id || req.user || '').toString();
  if (recipientId !== currentUserId) {
    return next(new ErrorResponse('Not authorized to view this notification', 403));
  }

  res.status(200).json({
    status: 'success',
    data: {
      notification
    }
  });
});

/**
 * @desc    Mark notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
exports.markAsRead = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(new ErrorResponse('Notification not found', 404));
  }

  // Check if user is the recipient
  const recipientId = (notification.recipient?._id || notification.recipient || '').toString();
  const currentUserId = (req.user?._id || req.user?.id || req.user || '').toString();
  if (recipientId !== currentUserId) {
    return next(new ErrorResponse('Not authorized', 403));
  }

  await notification.markAsRead();

  res.status(200).json({
    status: 'success',
    message: 'Notification marked as read',
    data: {
      notification
    }
  });
});

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/notifications/mark-all-read
 * @access  Private
 */
exports.markAllAsRead = asyncHandler(async (req, res, next) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true }
  );

  res.status(200).json({
    status: 'success',
    message: 'All notifications marked as read'
  });
});

/**
 * @desc    Delete notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
exports.deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(new ErrorResponse('Notification not found', 404));
  }

  // Check if user is the recipient
  const recipientId = (notification.recipient?._id || notification.recipient || '').toString();
  const currentUserId = (req.user?._id || req.user?.id || req.user || '').toString();
  if (recipientId !== currentUserId) {
    return next(new ErrorResponse('Not authorized', 403));
  }

  await notification.deleteOne();

  res.status(200).json({
    status: 'success',
    message: 'Notification deleted'
  });
});

/**
 * @desc    Get unread count
 * @route   GET /api/notifications/unread/count
 * @access  Private
 */
exports.getUnreadCount = asyncHandler(async (req, res, next) => {
  const count = await Notification.getUnreadCount(req.user._id);

  res.status(200).json({
    status: 'success',
    data: {
      count
    }
  });
});
