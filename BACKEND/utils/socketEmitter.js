/**
 * Socket.io Event Emitter Utility
 * Centralizes real-time broadcasting to users and project rooms
 */

let ioInstance = null;

/**
 * Set the global Socket.io instance
 * @param {Object} io - Socket.io Server instance
 */
exports.setIO = (io) => {
  ioInstance = io;
};

/**
 * Get the global Socket.io instance
 * @returns {Object|null}
 */
exports.getIO = () => {
  return ioInstance;
};

/**
 * Emit a real-time notification to a specific user
 * @param {String} userId - Recipient User ID
 * @param {Object} notification - Notification document/payload
 */
exports.emitNotification = (userId, notification) => {
  if (!ioInstance || !userId) return;
  const userRoom = `user_${userId.toString()}`;
  ioInstance.to(userRoom).emit('new_notification', notification);
};

/**
 * Emit collaboration request/response update to a user
 * @param {String} userId - Target User ID
 * @param {Object} collaborationData - Collaboration payload
 */
exports.emitCollaborationUpdate = (userId, collaborationData) => {
  if (!ioInstance || !userId) return;
  const userRoom = `user_${userId.toString()}`;
  ioInstance.to(userRoom).emit('collaboration_update', collaborationData);
};

/**
 * Emit a new comment to everyone viewing a project
 * @param {String} projectId - Project ID
 * @param {Object} comment - Comment payload
 */
exports.emitComment = (projectId, comment) => {
  if (!ioInstance || !projectId) return;
  const projectRoom = `project_${projectId.toString()}`;
  ioInstance.to(projectRoom).emit('new_comment', comment);
};

/**
 * Emit verification update to project owner / professor
 * @param {String} userId - Target User ID
 * @param {Object} verificationData - Verification payload
 */
exports.emitVerificationUpdate = (userId, verificationData) => {
  if (!ioInstance || !userId) return;
  const userRoom = `user_${userId.toString()}`;
  ioInstance.to(userRoom).emit('verification_update', verificationData);
};
