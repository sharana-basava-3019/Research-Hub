/**
 * Collaboration Controller
 * Handles collaboration requests between researchers
 */

const Collaboration = require('../models/Collaboration');
const Project = require('../models/Project');
const User = require('../models/User');
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
    .populate('project', 'title description researchArea')
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

  // Check if user is involved
  if (
    collaboration.sender._id.toString() !== req.user.id &&
    collaboration.receiver._id.toString() !== req.user.id &&
    req.user.role !== 'admin'
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

  let receiver;

  // Validate receiver by username (required)
  if (!receiverUsername || receiverUsername.trim() === '') {
    return next(new ErrorResponse('Receiver username is required', 400));
  }

  // Find user by username
  receiver = await User.findByUsername(receiverUsername);
  
  if (!receiver) {
    return next(new ErrorResponse(`User with username '@${receiverUsername}' not found`, 404));
  }

  // Additional check: if receiverId is provided, ensure it matches the username
  if (receiverId && receiverId !== receiver._id.toString()) {
    return next(new ErrorResponse('Receiver ID does not match the username', 400));
  }

  // Validate receiver is not the sender
  if (receiver._id.toString() === req.user.id) {
    return next(new ErrorResponse('Cannot send collaboration request to yourself', 400));
  }

  // Validate project
  const project = await Project.findById(projectId);
  if (!project) {
    return next(new ErrorResponse('Project not found', 404));
  }

  // Determine collaboration type and validate permissions
  const isOwner = project.isOwner(req.user.id);
  const mode = collaborationType || (isOwner ? 'invite' : 'request');

  if (mode === 'invite') {
    // INVITE MODE: Owner inviting someone to their project
    if (!isOwner) {
      return next(new ErrorResponse('Only project owner can send invitations', 403));
    }
    
    // Check if project is open for collaboration
    if (!project.isOpenForCollaboration) {
      return next(new ErrorResponse('This project is not open for collaboration', 400));
    }
    
    // Check if receiver is already a collaborator
    if (project.isCollaborator(receiver._id)) {
      return next(new ErrorResponse('User is already a collaborator on this project', 400));
    }
  } else {
    // REQUEST MODE: Non-owner requesting to join project
    if (isOwner) {
      return next(new ErrorResponse('You already own this project. Use invite mode instead.', 400));
    }
    
    // Check if project is open for collaboration
    if (!project.isOpenForCollaboration) {
      return next(new ErrorResponse('This project is not open for collaboration', 400));
    }
    
    // Check if sender is already a collaborator
    if (project.isCollaborator(req.user.id)) {
      return next(new ErrorResponse('You are already a collaborator on this project', 400));
    }
    
    // In request mode, the receiver should be the project owner
    const ownerId = (typeof project.owner === 'object' && project.owner._id) 
      ? project.owner._id.toString() 
      : project.owner.toString();
    
    if (ownerId !== receiver._id.toString()) {
      return next(new ErrorResponse('You can only send collaboration requests to the project owner', 400));
    }
  }

  // Check if request already exists
  const existingRequest = await Collaboration.requestExists(
    req.user.id,
    receiver._id,
    projectId
  );

  if (existingRequest) {
    return next(new ErrorResponse('Collaboration request already exists', 400));
  }

  // Create collaboration request
  const collaboration = await Collaboration.create({
    sender: req.user.id,
    receiver: receiver._id,
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

  const successMessage = mode === 'invite' 
    ? 'Collaboration invitation sent successfully' 
    : 'Collaboration request sent successfully';

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

  // Check if user is the receiver
  if (collaboration.receiver.toString() !== req.user.id) {
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

  // Check if user is the receiver
  if (collaboration.receiver.toString() !== req.user.id) {
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

  // Check if user is the sender
  if (collaboration.sender.toString() !== req.user.id && req.user.role !== 'admin') {
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
