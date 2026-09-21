/**
 * Collaboration Controller
 * Handles collaboration requests between researchers
 */

const Collaboration = require('../models/Collaboration');
const Project = require('../models/Project');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { emitCollaborationUpdate } = require('../utils/socketEmitter');
const { asyncHandler } = require('../middleware/validator');
const { ErrorResponse } = require('../middleware/errorHandler');

/**
 * @desc    Get user's collaborations
 * @route   GET /api/collaborations
 * @access  Private
 */
exports.getCollaborations = asyncHandler(async (req, res, next) => {
  const { status, type, projectId, receiverId } = req.query;

  let query = {};

  // Filter by status
  if (status) {
    query.status = status;
  }

  // Filter by projectId
  if (projectId) {
    query.project = projectId;
  }

  // Filter by receiverId
  if (receiverId) {
    query.receiver = receiverId;
  }

  // Filter by type (sent or received)
  if (type === 'sent') {
    query.sender = req.user.id;
  } else if (type === 'received') {
    query.receiver = req.user.id;
  } else if (!receiverId) {
    // Both sent and received (only if receiverId not specified)
    query.$or = [
      { sender: req.user.id },
      { receiver: req.user.id }
    ];
  }

  const collaborations = await Collaboration.find(query)
    .populate('sender', 'firstName lastName institution profilePicture researchInterests')
    .populate('receiver', 'firstName lastName institution profilePicture')
    .populate('project', 'title description researchArea owner collaborators maxCollaborators')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    count: collaborations.length,
    data: {
      collaborations
    }
  });
});

/**
 * @desc    Get collaboration by ID
 * @route   GET /api/collaborations/:id
 * @access  Private
 */
exports.getCollaboration = asyncHandler(async (req, res, next) => {
  const collaboration = await Collaboration.findById(req.params.id)
    .populate('sender', 'firstName lastName institution profilePicture researchInterests')
    .populate('receiver', 'firstName lastName institution profilePicture')
    .populate('project');

  if (!collaboration) {
    return next(new ErrorResponse('Collaboration request not found', 404));
  }

  const currentUserId = (req.user?._id || req.user?.id || req.user || '').toString();
  const senderId = (collaboration.sender?._id || collaboration.sender || '').toString();
  const receiverId = (collaboration.receiver?._id || collaboration.receiver || '').toString();

  // Check if user is involved
  if (
    senderId !== currentUserId &&
    receiverId !== currentUserId &&
    req.user?.role !== 'admin'
  ) {
    return next(new ErrorResponse('Not authorized to view this collaboration', 403));
  }

  res.status(200).json({
    status: 'success',
    data: {
      collaboration
    }
  });
});

/**
 * @desc    Send collaboration request
 * @route   POST /api/collaborations
 * @access  Private
 */
exports.sendCollaborationRequest = asyncHandler(async (req, res, next) => {
  const { receiverId, receiverUsername, projectId, message, proposedRole, collaborationType } = req.body;

  if (!projectId) {
    return next(new ErrorResponse('Project ID is required', 400));
  }

  // Validate project and fetch with populated owner
  const project = await Project.findById(projectId).populate('owner', 'firstName lastName username email');
  if (!project) {
    return next(new ErrorResponse('Project not found', 404));
  }

  const currentUserId = (req.user?._id || req.user?.id || req.user || '').toString();
  if (!currentUserId) {
    return next(new ErrorResponse('User identification error. Please log in again.', 401));
  }

  // Determine collaboration type and validate permissions
  const isOwner = project.isOwner(currentUserId);
  const mode = collaborationType || (isOwner ? 'invite' : 'request');

  let receiver;

  if (mode === 'invite') {
    // INVITE MODE: Owner inviting someone to their project
    if (!isOwner) {
      return next(new ErrorResponse('Only project owner can send invitations for this project', 403));
    }
    
    // Check if project is open for collaboration
    if (!project.isOpenForCollaboration) {
      return next(new ErrorResponse('This project is not open for collaboration', 400));
    }

    // In invite mode, receiver ID or username is strictly required
    if (!receiverId && !receiverUsername) {
      return next(new ErrorResponse('A valid collaborator is required to send an invitation', 400));
    }

    if (receiverId) {
      receiver = await User.findById(receiverId);
    }

    if (!receiver && receiverUsername && receiverUsername.trim() !== '') {
      const clean = receiverUsername.replace(/^@+/, '').toLowerCase().trim();
      receiver = await User.findByUsername(clean) || await User.findOne({ email: clean });
    }

    if (!receiver) {
      return next(new ErrorResponse(`Collaborator was not found in the system`, 404));
    }

    const targetReceiverId = (receiver._id || receiver.id || receiver || '').toString();

    // Validate receiver is not the sender
    if (targetReceiverId === currentUserId) {
      return next(new ErrorResponse('You cannot invite yourself to collaborate on your own project', 400));
    }
    
    // Check if receiver is already a collaborator
    if (project.isCollaborator(targetReceiverId)) {
      return next(new ErrorResponse('User is already a collaborator on this project', 400));
    }
  } else {
    // REQUEST MODE: Non-owner requesting to join project
    if (isOwner) {
      return next(new ErrorResponse('You own this project. Use "Invite to My Project" workflow to invite collaborators.', 400));
    }
    
    // Check if project is open for collaboration
    if (!project.isOpenForCollaboration) {
      return next(new ErrorResponse('This project is not open for collaboration', 400));
    }
    
    // Check if sender is already a collaborator
    if (project.isCollaborator(currentUserId)) {
      return next(new ErrorResponse('You are already a collaborator on this project', 400));
    }
    
    // In request mode, the receiver MUST ALWAYS be the project owner.
    // Automatically identify the selected project's owner.
    if (project.owner && (project.owner._id || project.owner.id)) {
      receiver = project.owner;
    } else if (project.owner) {
      receiver = await User.findById(project.owner);
    }

    if (!receiver) {
      return next(new ErrorResponse('Project owner not found', 404));
    }

    const targetReceiverId = (receiver._id || receiver.id || receiver || '').toString();

    if (targetReceiverId === currentUserId) {
      return next(new ErrorResponse('Cannot send collaboration request to yourself', 400));
    }
  }

  const senderId = req.user._id || req.user.id || req.user;
  const receiverDocId = receiver._id || receiver.id || receiver;

  // Check if request already exists
  const existingRequest = await Collaboration.requestExists(
    senderId,
    receiverDocId,
    projectId
  );

  if (existingRequest) {
    return next(new ErrorResponse('Collaboration request already exists for this project', 400));
  }

  // Create collaboration request
  const collaboration = await Collaboration.create({
    sender: senderId,
    receiver: receiverDocId,
    project: projectId,
    message,
    proposedRole: proposedRole || 'Collaborator',
    collaborationType: mode
  });

  await collaboration.populate([
    { path: 'sender', select: 'firstName lastName institution username' },
    { path: 'receiver', select: 'firstName lastName institution username' },
    { path: 'project', select: 'title description' }
  ]);

  // Create notification and emit real-time socket event for receiver
  try {
    const notifType = mode === 'invite' ? 'PROJECT_INVITE' : 'COLLABORATION_REQUEST';
    const notifTitle = mode === 'invite' ? 'New Project Invitation' : 'New Collaboration Request';
    const notifMsg = mode === 'invite'
      ? `${req.user.firstName || 'A researcher'} ${req.user.lastName || ''} invited you to collaborate on "${project.title}"`
      : `${req.user.firstName || 'A researcher'} ${req.user.lastName || ''} requested to join your project "${project.title}"`;

    await Notification.createNotification({
      recipient: receiverDocId,
      type: notifType,
      title: notifTitle,
      message: notifMsg,
      link: '/collaborations',
      relatedProject: projectId,
      relatedUser: senderId
    });

    emitCollaborationUpdate(receiverDocId, {
      type: notifType,
      collaboration
    });
  } catch (notifErr) {
    console.error('Failed to create notification or emit socket event:', notifErr.message);
  }

  const successMessage = mode === 'invite' 
    ? 'Collaboration invitation sent successfully' 
    : 'Collaboration request sent successfully to project owner';

  res.status(201).json({
    status: 'success',
    message: successMessage,
    data: {
      collaboration
    }
  });
});

/**
 * @desc    Accept collaboration request
 * @route   PUT /api/collaborations/:id/accept
 * @access  Private
 */
exports.acceptCollaboration = asyncHandler(async (req, res, next) => {
  const collaboration = await Collaboration.findById(req.params.id);

  if (!collaboration) {
    return next(new ErrorResponse('Collaboration request not found', 404));
  }

  const currentUserId = (req.user?._id || req.user?.id || req.user || '').toString();
  const receiverId = (collaboration.receiver?._id || collaboration.receiver || '').toString();

  // Check if user is the receiver
  if (receiverId !== currentUserId) {
    return next(new ErrorResponse('Not authorized to accept this request', 403));
  }

  // Check if already responded
  if (collaboration.status !== 'Pending') {
    return next(new ErrorResponse(`Request already ${collaboration.status.toLowerCase()}`, 400));
  }

  // Accept the collaboration
  await collaboration.accept(req.body.message);

  await collaboration.populate([
    { path: 'sender', select: 'firstName lastName institution' },
    { path: 'receiver', select: 'firstName lastName institution' },
    { path: 'project', select: 'title description' }
  ]);

  // Notify sender about acceptance
  try {
    const senderId = collaboration.sender?._id || collaboration.sender;
    if (senderId) {
      await Notification.createNotification({
        recipient: senderId,
        type: 'COLLABORATION_ACCEPTED',
        title: 'Collaboration Accepted!',
        message: `${req.user.firstName} ${req.user.lastName} accepted your collaboration request for "${collaboration.project?.title || 'project'}"`,
        link: `/projects/${collaboration.project?._id || ''}`,
        relatedModel: 'Collaboration',
        relatedId: collaboration._id,
        priority: 'high'
      });

      emitCollaborationUpdate(senderId, {
        type: 'COLLABORATION_ACCEPTED',
        collaboration
      });
    }
  } catch (err) {
    console.error('Error dispatching collaboration acceptance notification:', err.message);
  }

  res.status(200).json({
    status: 'success',
    message: 'Collaboration request accepted successfully',
    data: {
      collaboration
    }
  });
});

/**
 * @desc    Reject collaboration request
 * @route   PUT /api/collaborations/:id/reject
 * @access  Private
 */
exports.rejectCollaboration = asyncHandler(async (req, res, next) => {
  const collaboration = await Collaboration.findById(req.params.id);

  if (!collaboration) {
    return next(new ErrorResponse('Collaboration request not found', 404));
  }

  const currentUserId = (req.user?._id || req.user?.id || req.user || '').toString();
  const receiverId = (collaboration.receiver?._id || collaboration.receiver || '').toString();

  // Check if user is the receiver
  if (receiverId !== currentUserId) {
    return next(new ErrorResponse('Not authorized to reject this request', 403));
  }

  // Check if already responded
  if (collaboration.status !== 'Pending') {
    return next(new ErrorResponse(`Request already ${collaboration.status.toLowerCase()}`, 400));
  }

  // Reject the collaboration
  await collaboration.reject(req.body.message);

  await collaboration.populate([
    { path: 'sender', select: 'firstName lastName institution' },
    { path: 'receiver', select: 'firstName lastName institution' },
    { path: 'project', select: 'title description' }
  ]);

  // Notify sender about rejection
  try {
    const senderId = collaboration.sender?._id || collaboration.sender;
    if (senderId) {
      await Notification.createNotification({
        recipient: senderId,
        type: 'COLLABORATION_REJECTED',
        title: 'Collaboration Update',
        message: `${req.user.firstName} ${req.user.lastName} declined your collaboration request for "${collaboration.project?.title || 'project'}"`,
        link: '/collaborations',
        relatedModel: 'Collaboration',
        relatedId: collaboration._id,
        priority: 'normal'
      });

      emitCollaborationUpdate(senderId, {
        type: 'COLLABORATION_REJECTED',
        collaboration
      });
    }
  } catch (err) {
    console.error('Error dispatching collaboration rejection notification:', err.message);
  }

  res.status(200).json({
    status: 'success',
    message: 'Collaboration request rejected',
    data: {
      collaboration
    }
  });
});

/**
 * @desc    Cancel collaboration request
 * @route   DELETE /api/collaborations/:id
 * @access  Private
 */
exports.cancelCollaboration = asyncHandler(async (req, res, next) => {
  const collaboration = await Collaboration.findById(req.params.id);

  if (!collaboration) {
    return next(new ErrorResponse('Collaboration request not found', 404));
  }

  const currentUserId = (req.user?._id || req.user?.id || req.user || '').toString();
  const senderId = (collaboration.sender?._id || collaboration.sender || '').toString();

  // Check if user is the sender
  if (senderId !== currentUserId && req.user?.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to cancel this request', 403));
  }

  // Can only cancel pending requests
  if (collaboration.status !== 'Pending') {
    return next(new ErrorResponse('Can only cancel pending requests', 400));
  }

  await collaboration.cancel();

  res.status(200).json({
    status: 'success',
    message: 'Collaboration request cancelled',
    data: {}
  });
});

/**
 * @desc    Get collaboration statistics for a user
 * @route   GET /api/collaborations/stats
 * @access  Private
 */
exports.getCollaborationStats = asyncHandler(async (req, res, next) => {
  // Use ObjectId for consistency and security
  const userId = req.user._id;
  
  const stats = await Collaboration.aggregate([
    {
      $match: {
        $or: [
          { sender: userId },
          { receiver: userId }
        ]
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const formattedStats = {
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
    cancelled: 0
  };

  stats.forEach(stat => {
    formattedStats[stat._id.toLowerCase()] = stat.count;
    formattedStats.total += stat.count;
  });

  res.status(200).json({
    status: 'success',
    data: {
      stats: formattedStats
    }
  });
});

/**
 * @desc    Revoke collaboration invitation or remove accepted collaborator
 * @route   PUT /api/collaborations/:id/revoke
 * @access  Private
 */
exports.revokeCollaboration = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;
  const collaboration = await Collaboration.findById(req.params.id)
    .populate('project', 'title owner')
    .populate('sender', 'firstName lastName')
    .populate('receiver', 'firstName lastName');

  if (!collaboration) {
    return next(new ErrorResponse('Collaboration request not found', 404));
  }

  const currentUserId = (req.user?._id || req.user?.id || req.user || '').toString();
  const senderId = (collaboration.sender?._id || collaboration.sender || '').toString();
  const isSender = senderId === currentUserId;
  const projectOwnerId = (collaboration.project?.owner?._id || collaboration.project?.owner || '').toString();
  const isProjectOwner = Boolean(projectOwnerId && projectOwnerId === currentUserId);
  const isAdmin = req.user?.role === 'admin';

  // Strict Rule: For Accepted collaborations, ONLY the Project Owner or Admin can remove members.
  if (collaboration.status === 'Accepted') {
    if (!isProjectOwner && !isAdmin) {
      return next(new ErrorResponse('Only the project owner can remove an accepted collaborator from the project', 403));
    }
  } else if (collaboration.status === 'Pending') {
    // For pending invitations/requests, either sender, project owner, or admin can revoke
    if (!isSender && !isProjectOwner && !isAdmin) {
      return next(new ErrorResponse('Not authorized to revoke this invitation', 403));
    }
  } else {
    return next(new ErrorResponse(`Cannot revoke a collaboration that is already ${collaboration.status.toLowerCase()}`, 400));
  }

  const previousStatus = collaboration.status;
  await collaboration.revoke(reason || '', req.user.id);

  // Target user who is revoked
  const revokedUserId = collaboration.collaborationType === 'invite' 
    ? (collaboration.receiver?._id || collaboration.receiver)
    : (collaboration.sender?._id || collaboration.sender);

  // Create high/urgent priority notification for the revoked user
  try {
    const projectTitle = collaboration.project?.title || 'Project';
    const reasonText = reason && reason.trim() ? ` Reason: "${reason.trim()}"` : '';
    const actionDesc = previousStatus === 'Accepted'
      ? `Your participation in project "${projectTitle}" has been revoked/removed by ${req.user.firstName} ${req.user.lastName}.${reasonText}`
      : `The collaboration invitation for project "${projectTitle}" has been revoked by ${req.user.firstName} ${req.user.lastName}.${reasonText}`;

    if (revokedUserId) {
      await Notification.createNotification({
        recipient: revokedUserId,
        type: 'COLLABORATION_REVOKED',
        title: `Collaboration Revoked: ${projectTitle}`,
        message: actionDesc,
        link: `/projects/${collaboration.project?._id || ''}`,
        relatedModel: 'Project',
        relatedId: collaboration.project?._id,
        priority: 'urgent'
      });

      emitCollaborationUpdate(revokedUserId, {
        type: 'COLLABORATION_REVOKED',
        collaboration,
        reason: reason || ''
      });
    }
  } catch (err) {
    console.error('Error dispatching collaboration revocation notification:', err.message);
  }

  res.status(200).json({
    status: 'success',
    message: previousStatus === 'Accepted'
      ? 'Collaborator removed from project and collaboration revoked successfully'
      : 'Collaboration invitation revoked successfully',
    data: {
      collaboration
    }
  });
});

/**
 * @desc    Collaborator exits/leaves an accepted project collaboration with reason
 * @route   PUT /api/collaborations/:id/exit
 * @access  Private
 */
exports.exitCollaboration = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;
  const collaboration = await Collaboration.findById(req.params.id)
    .populate('project', 'title owner')
    .populate('sender', 'firstName lastName email')
    .populate('receiver', 'firstName lastName email');

  if (!collaboration) {
    return next(new ErrorResponse('Collaboration request not found', 404));
  }

  if (collaboration.status !== 'Accepted') {
    return next(new ErrorResponse(`Cannot exit a collaboration that is ${collaboration.status.toLowerCase()}. Only active accepted collaborations can be exited.`, 400));
  }

  const currentUserId = (req.user?._id || req.user?.id || req.user || '').toString();

  // Determine who the collaborator is
  const rawCollabUser = collaboration.collaborationType === 'invite'
    ? collaboration.receiver
    : collaboration.sender;
  const collaboratorUserId = (rawCollabUser?._id || rawCollabUser?.id || rawCollabUser || '').toString();

  const isCollaborator = collaboratorUserId === currentUserId;
  const projectOwnerId = (collaboration.project?.owner?._id || collaboration.project?.owner || '').toString();

  // Project owner should not use exit endpoint on their own project
  if (projectOwnerId === currentUserId) {
    return next(new ErrorResponse('Project owners cannot exit their own project collaboration. Manage project settings or remove collaborators instead.', 400));
  }

  if (!isCollaborator && req.user?.role !== 'admin') {
    return next(new ErrorResponse('Only the active collaborator can exit this project collaboration', 403));
  }

  await collaboration.exit(reason || '', req.user.id);

  // Notify Project Owner about collaborator exit
  try {
    const projectTitle = collaboration.project?.title || 'Project';
    const reasonText = reason && reason.trim() ? ` Reason: "${reason.trim()}"` : ' No reason specified.';
    const exitMsg = `${req.user.firstName} ${req.user.lastName} has exited from collaboration on "${projectTitle}".${reasonText}`;

    if (projectOwnerId) {
      await Notification.createNotification({
        recipient: projectOwnerId,
        type: 'COLLABORATION_EXITED',
        title: `Collaborator Exited: ${projectTitle}`,
        message: exitMsg,
        link: `/projects/${collaboration.project?._id || ''}`,
        relatedModel: 'Project',
        relatedId: collaboration.project?._id,
        priority: 'high'
      });

      emitCollaborationUpdate(projectOwnerId, {
        type: 'COLLABORATION_EXITED',
        collaboration,
        reason: reason || ''
      });
    }
  } catch (err) {
    console.error('Error dispatching collaborator exit notification:', err.message);
  }

  res.status(200).json({
    status: 'success',
    message: 'You have exited the project collaboration successfully',
    data: {
      collaboration
    }
  });
});

