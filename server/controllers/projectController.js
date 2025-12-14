/**
 * Project Controller
 * Handles CRUD operations for research projects
 */

const Project = require('../models/Project');
const Comment = require('../models/Comment');
const User = require('../models/User');
const Notification = require('../models/Notification');
const VerificationRequest = require('../models/VerificationRequest');
const PlagiarismChecker = require('../services/plagiarismChecker');
const { asyncHandler } = require('../middleware/validator');
const { ErrorResponse } = require('../middleware/errorHandler');
const path = require('path');
const fs = require('fs');

/**
 * @desc    Get all projects
 * @route   GET /api/projects
 * @access  Public
 */
exports.getProjects = asyncHandler(async (req, res, next) => {
  // If database is not available, return mock data
  if (!global.DATABASE_AVAILABLE) {
    const mockProjects = [
      {
        _id: 'mock1',
        title: 'AI in Healthcare Research',
        description: 'Exploring the applications of artificial intelligence in modern healthcare systems and patient care optimization.',
        researchArea: 'Artificial Intelligence',
        status: 'In Progress',
        owner: {
          _id: 'user1',
          firstName: 'Dr. Sarah',
          lastName: 'Johnson',
          institution: 'University Research Lab',
          profilePicture: null
        },
        collaborators: [],
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        visibility: 'Public',
        isOpenForCollaboration: true,
        keywords: ['AI', 'Healthcare', 'Machine Learning']
      },
      {
        _id: 'mock2',
        title: 'Sustainable Energy Solutions',
        description: 'Developing innovative approaches to renewable energy storage and distribution for urban environments.',
        researchArea: 'Environmental Science',
        status: 'Planning',
        owner: {
          _id: 'user2',
          firstName: 'Prof. Michael',
          lastName: 'Chen',
          institution: 'Green Tech Institute',
          profilePicture: null
        },
        collaborators: [],
        createdAt: new Date('2024-02-20'),
        updatedAt: new Date('2024-02-20'),
        visibility: 'Public',
        isOpenForCollaboration: true,
        keywords: ['Energy', 'Sustainability', 'Environment']
      },
      {
        _id: 'mock3',
        title: 'Quantum Computing Applications',
        description: 'Research into practical applications of quantum computing for solving complex computational problems.',
        researchArea: 'Computer Science',
        status: 'In Progress',
        owner: {
          _id: 'user3',
          firstName: 'Dr. Lisa',
          lastName: 'Wang',
          institution: 'Quantum Research Center',
          profilePicture: null
        },
        collaborators: [],
        createdAt: new Date('2024-03-10'),
        updatedAt: new Date('2024-03-10'),
        visibility: 'Public',
        isOpenForCollaboration: false,
        keywords: ['Quantum', 'Computing', 'Research']
      },
      {
        _id: 'mock4',
        title: 'Machine Learning in Finance',
        description: 'Developing ML algorithms for fraud detection and risk assessment in financial transactions.',
        researchArea: 'Computer Science',
        status: 'Completed',
        owner: {
          _id: 'user4',
          firstName: 'Dr. Robert',
          lastName: 'Davis',
          institution: 'FinTech Research Lab',
          profilePicture: null
        },
        collaborators: [],
        createdAt: new Date('2023-12-05'),
        updatedAt: new Date('2024-01-20'),
        visibility: 'Public',
        isOpenForCollaboration: false,
        keywords: ['Machine Learning', 'Finance', 'Security']
      },
      {
        _id: 'mock5',
        title: 'Biomedical Engineering Solutions',
        description: 'Innovative medical device design for improving patient outcomes and healthcare efficiency.',
        researchArea: 'Biomedical Engineering',
        status: 'In Progress',
        owner: {
          _id: 'user5',
          firstName: 'Prof. Jennifer',
          lastName: 'Martinez',
          institution: 'Medical Engineering Department',
          profilePicture: null
        },
        collaborators: [],
        createdAt: new Date('2024-01-30'),
        updatedAt: new Date('2024-03-15'),
        visibility: 'Public',
        isOpenForCollaboration: true,
        keywords: ['Biomedical', 'Engineering', 'Healthcare']
      }
    ];

    // Apply basic filtering for mock data
    let filteredProjects = mockProjects;
    
    if (req.query.researchArea) {
      filteredProjects = filteredProjects.filter(p => 
        p.researchArea.toLowerCase().includes(req.query.researchArea.toLowerCase())
      );
    }
    
    if (req.query.status) {
      filteredProjects = filteredProjects.filter(p => p.status === req.query.status);
    }
    
    if (req.query.search) {
      filteredProjects = filteredProjects.filter(p => 
        p.title.toLowerCase().includes(req.query.search.toLowerCase()) ||
        p.description.toLowerCase().includes(req.query.search.toLowerCase())
      );
    }

    // Apply pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const paginatedProjects = filteredProjects.slice(skip, skip + limit);

    return res.status(200).json({
      status: 'success',
      count: paginatedProjects.length,
      total: filteredProjects.length,
      page,
      pages: Math.ceil(filteredProjects.length / limit),
      data: {
        projects: paginatedProjects
      }
    });
  }

  // Original database logic continues below...
  // Build query
  let query = {};

  // Filter by research area
  if (req.query.researchArea) {
    query.researchArea = new RegExp(req.query.researchArea, 'i');
  }

  // Filter by status
  if (req.query.status) {
    query.status = req.query.status;
  }

  // Filter by keywords
  if (req.query.keywords) {
    query.keywords = { $in: req.query.keywords.split(',') };
  }

  // Filter by owner
  if (req.query.owner) {
    query.owner = req.query.owner;
  }

  // Search by text
  if (req.query.search) {
    query.$text = { $search: req.query.search };
  }

  // Filter by collaboration status
  if (req.query.openForCollaboration === 'true') {
    query.isOpenForCollaboration = true;
  }

  // Visibility filter (if not logged in, only show public)
  if (!req.user) {
    query.visibility = 'Public';
  } else if (req.user.role !== 'admin') {
    query.$or = [
      { visibility: 'Public' },
      { owner: req.user.id },
      { 'collaborators.user': req.user.id }
    ];
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  // Sort
  const sortBy = req.query.sortBy || '-createdAt';

  // Execute query
  const projects = await Project.find(query)
    .populate('owner', 'firstName lastName institution profilePicture')
    .populate('collaborators.user', 'firstName lastName institution')
    .sort(sortBy)
    .skip(skip)
    .limit(limit);

  // Get total count
  const total = await Project.countDocuments(query);

  res.status(200).json({
    status: 'success',
    count: projects.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: {
      projects
    }
  });
});

/**
 * @desc    Get single project
 * @route   GET /api/projects/:id
 * @access  Public
 */
exports.getProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id)
    .populate('owner', 'firstName lastName institution department profilePicture researchInterests')
    .populate('collaborators.user', 'firstName lastName institution profilePicture')
    .populate({
      path: 'comments',
      populate: {
        path: 'author',
        select: 'firstName lastName profilePicture'
      }
    });

  if (!project) {
    return next(new ErrorResponse('Project not found', 404));
  }

  // Check visibility permissions
  if (project.visibility === 'Private' && req.user) {
    if (
      !project.isOwner(req.user.id) &&
      !project.isCollaborator(req.user.id) &&
      req.user.role !== 'admin'
    ) {
      return next(new ErrorResponse('Not authorized to view this project', 403));
    }
  } else if (project.visibility === 'Private' && !req.user) {
    return next(new ErrorResponse('Not authorized to view this project', 403));
  }

  // Increment view count
  await project.incrementViews();

  res.status(200).json({
    status: 'success',
    data: {
      project
    }
  });
});

/**
 * @desc    Create new project
 * @route   POST /api/projects
 * @access  Private
 */
exports.createProject = asyncHandler(async (req, res, next) => {
  // Add user as owner
  req.body.owner = req.user.id;

  const project = await Project.create(req.body);

  // Run plagiarism check asynchronously (non-blocking)
  runPlagiarismCheck(project._id).catch(err => {
    console.error('Plagiarism check failed:', err);
  });

  res.status(201).json({
    status: 'success',
    message: 'Project created successfully',
    data: {
      project
    }
  });
});

/**
 * @desc    Update project
 * @route   PUT /api/projects/:id
 * @access  Private
 */
exports.updateProject = asyncHandler(async (req, res, next) => {
  let project = await Project.findById(req.params.id);

  if (!project) {
    return next(new ErrorResponse('Project not found', 404));
  }

  // Check ownership
  if (!project.isOwner(req.user.id) && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to update this project', 403));
  }

  // Prevent changing owner
  delete req.body.owner;

  project = await Project.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  // Run plagiarism check asynchronously if content changed
  if (req.body.title || req.body.description || req.body.abstract || req.body.methodology) {
    runPlagiarismCheck(project._id).catch(err => {
      console.error('Plagiarism check failed:', err);
    });
  }

  res.status(200).json({
    status: 'success',
    message: 'Project updated successfully',
    data: {
      project
    }
  });
});

/**
 * @desc    Delete project
 * @route   DELETE /api/projects/:id
 * @access  Private
 */
exports.deleteProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return next(new ErrorResponse('Project not found', 404));
  }

  // Check ownership
  if (!project.isOwner(req.user.id) && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to delete this project', 403));
  }

  // Delete associated comments
  await Comment.deleteMany({ project: req.params.id });

  await project.deleteOne();

  res.status(200).json({
    status: 'success',
    message: 'Project deleted successfully',
    data: {}
  });
});

/**
 * @desc    Get user's projects
 * @route   GET /api/projects/user/:userId
 * @access  Public
 */
/**
 * @desc    Get user's projects by userId
 * @route   GET /api/projects/user/:userId
 * @access  Public
 */
exports.getUserProjects = asyncHandler(async (req, res, next) => {
  const projects = await Project.find({
    $or: [
      { owner: req.params.userId },
      { 'collaborators.user': req.params.userId }
    ]
  })
    .populate('owner', 'firstName lastName institution')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    count: projects.length,
    data: {
      projects
    }
  });
});

/**
 * @desc    Get current user's own projects
 * @route   GET /api/projects/my
 * @access  Private
 */
exports.getMyProjects = asyncHandler(async (req, res, next) => {
  const projects = await Project.find({
    owner: req.user._id
  })
    .populate('owner', 'firstName lastName institution')
    .populate('collaborators.user', 'firstName lastName institution')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    count: projects.length,
    data: {
      projects
    }
  });
});

/**
 * @desc    Add comment to project
 * @route   POST /api/projects/:id/comments
 * @access  Private
 */
exports.addComment = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return next(new ErrorResponse('Project not found', 404));
  }

  const comment = await Comment.create({
    text: req.body.text,
    author: req.user.id,
    project: req.params.id,
    parentComment: req.body.parentComment
  });

  await comment.populate('author', 'firstName lastName profilePicture');

  res.status(201).json({
    status: 'success',
    message: 'Comment added successfully',
    data: {
      comment
    }
  });
});

/**
 * @desc    Get project comments
 * @route   GET /api/projects/:id/comments
 * @access  Public
 */
exports.getComments = asyncHandler(async (req, res, next) => {
  const comments = await Comment.find({
    project: req.params.id,
    parentComment: null,
    isDeleted: false
  })
    .populate('author', 'firstName lastName profilePicture')
    .populate({
      path: 'replies',
      populate: {
        path: 'author',
        select: 'firstName lastName profilePicture'
      }
    })
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    count: comments.length,
    data: {
      comments
    }
  });
});

/**
 * @desc    Upload file attachment to project
 * @route   POST /api/projects/:id/attachments
 * @access  Private
 */
exports.uploadAttachment = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return next(new ErrorResponse('Project not found', 404));
  }

  // Check if user is owner or collaborator
  const ownerId = (typeof project.owner === 'object' && project.owner._id) 
    ? project.owner._id.toString() 
    : project.owner.toString();
  
  const isOwner = ownerId === req.user.id;
  const isCollaborator = project.collaborators.some(
    collab => {
      const collabUserId = (typeof collab.user === 'object' && collab.user._id) 
        ? collab.user._id.toString() 
        : collab.user.toString();
      return collabUserId === req.user.id;
    }
  );

  if (!isOwner && !isCollaborator) {
    return next(new ErrorResponse('Not authorized to upload files to this project', 403));
  }

  // Check if file was uploaded
  if (!req.file) {
    return next(new ErrorResponse('Please upload a file', 400));
  }

  // Get relative path if provided (for folder uploads)
  const relativePath = req.body.relativePath || req.file.originalname;

  // Create attachment object
  const attachment = {
    filename: relativePath, // Use relative path to preserve folder structure
    url: `/uploads/projects/${req.file.filename}`,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
    uploadedAt: new Date(),
    uploadedBy: req.user.id
  };

  // Add to project attachments
  project.attachments.push(attachment);
  await project.save();

  res.status(200).json({
    status: 'success',
    message: 'File uploaded successfully',
    data: {
      attachment: project.attachments[project.attachments.length - 1]
    }
  });
});

/**
 * @desc    Delete file attachment from project
 * @route   DELETE /api/projects/:id/attachments/:attachmentId
 * @access  Private
 */
exports.deleteAttachment = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return next(new ErrorResponse('Project not found', 404));
  }

  // Check if user is owner or collaborator
  const ownerId = (typeof project.owner === 'object' && project.owner._id) 
    ? project.owner._id.toString() 
    : project.owner.toString();
  
  const isOwner = ownerId === req.user.id;
  const isCollaborator = project.collaborators.some(
    collab => {
      const collabUserId = (typeof collab.user === 'object' && collab.user._id) 
        ? collab.user._id.toString() 
        : collab.user.toString();
      return collabUserId === req.user.id;
    }
  );

  if (!isOwner && !isCollaborator) {
    return next(new ErrorResponse('Not authorized to delete files from this project', 403));
  }

  // Find attachment
  const attachment = project.attachments.id(req.params.attachmentId);

  if (!attachment) {
    return next(new ErrorResponse('Attachment not found', 404));
  }

  // Delete file from filesystem
  const filePath = path.join(__dirname, '..', attachment.url);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  // Remove from project
  attachment.deleteOne();
  await project.save();

  res.status(200).json({
    status: 'success',
    message: 'Attachment deleted successfully',
    data: {}
  });
});

/**
 * @desc    Send verification request for a project
 * @route   POST /api/projects/:id/verification-request
 * @access  Private (Project Owner only)
 */
exports.sendVerificationRequest = asyncHandler(async (req, res, next) => {
  const { message, professorId } = req.body;
  const projectId = req.params.id;
  const userId = req.user._id;

  // Get the project
  const project = await Project.findById(projectId);
  if (!project) {
    return next(new ErrorResponse('Project not found', 404));
  }

  // Check if user is the project owner
  // Handle both populated and non-populated owner field
  const ownerId = (typeof project.owner === 'object' && project.owner._id) 
    ? project.owner._id.toString() 
    : project.owner.toString();
    
  if (ownerId !== userId.toString()) {
    return next(new ErrorResponse('Only project owner can request verification', 403));
  }

  // Check if project is already verified
  if (project.is_verified) {
    return next(new ErrorResponse('Project is already verified', 400));
  }

  // Check if there's already a pending request for this project
  const existingRequest = await VerificationRequest.findOne({
    project: projectId,
    status: 'PENDING'
  });

  if (existingRequest) {
    return next(new ErrorResponse('A verification request is already pending for this project', 400));
  }

  // If professorId is provided, verify the professor exists and is not the requester
  if (professorId) {
    // Check if professor is trying to verify their own project
    if (professorId === userId.toString()) {
      return next(new ErrorResponse('Professors cannot verify their own projects', 400));
    }
    
    const professor = await User.findById(professorId);
    if (!professor || professor.designation !== 'Professor') {
      return next(new ErrorResponse('Invalid professor ID', 400));
    }
  }

  // Create verification request
  const verificationRequest = await VerificationRequest.create({
    project: projectId,
    requester: userId,
    professor: professorId || null,
    message: message || '',
    status: 'PENDING'
  });

  // Populate request data
  await verificationRequest.populate([
    { path: 'project', select: 'title description' },
    { path: 'requester', select: 'firstName lastName email' },
    { path: 'professor', select: 'firstName lastName email' }
  ]);

  // Send notification to professor(s)
  if (professorId) {
    // Notification to specific professor
    await Notification.createNotification({
      recipient: professorId,
      type: 'VERIFICATION_REQUEST',
      title: 'New Verification Request',
      message: `${req.user.firstName} ${req.user.lastName} has requested verification for "${project.title}"`,
      link: `/verification-requests`,
      relatedModel: 'VerificationRequest',
      relatedId: verificationRequest._id,
      priority: 'high'
    });
  } else {
    // Notification to all professors (except the requester if they are a professor)
    const professors = await User.find({ 
      designation: 'Professor',
      _id: { $ne: userId }
    });
    for (const prof of professors) {
      await Notification.createNotification({
        recipient: prof._id,
        type: 'VERIFICATION_REQUEST',
        title: 'New Verification Request',
        message: `${req.user.firstName} ${req.user.lastName} has requested verification for "${project.title}"`,
        link: `/verification-requests`,
        relatedModel: 'VerificationRequest',
        relatedId: verificationRequest._id,
        priority: 'high'
      });
    }
  }

  res.status(201).json({
    status: 'success',
    message: 'Verification request sent successfully',
    data: { request: verificationRequest }
  });
});

/**
 * @desc    Get all verification requests (for professors)
 * @route   GET /api/verification-requests
 * @access  Private (Professor only)
 */
exports.getVerificationRequests = asyncHandler(async (req, res, next) => {
  // Check if user is a professor
  if (req.user.designation !== 'Professor') {
    return next(new ErrorResponse('Only professors can access verification requests', 403));
  }

  const { status = 'PENDING' } = req.query;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  // Build query
  const query = {};
  if (status) {
    query.status = status;
  }

  // Get requests
  const requests = await VerificationRequest.find(query)
    .populate('project', 'title description researchArea owner')
    .populate('requester', 'firstName lastName email institution')
    .populate('professor', 'firstName lastName email')
    .populate('processed_by', 'firstName lastName')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await VerificationRequest.countDocuments(query);

  res.status(200).json({
    status: 'success',
    count: requests.length,
    total,
    pagination: {
      page,
      pages: Math.ceil(total / limit)
    },
    data: { requests }
  });
});

/**
 * @desc    Get verification requests for a specific project
 * @route   GET /api/projects/:id/verification-requests
 * @access  Private (Project Owner or Professor)
 */
exports.getProjectVerificationRequests = asyncHandler(async (req, res, next) => {
  const projectId = req.params.id;

  // Get the project
  const project = await Project.findById(projectId);
  if (!project) {
    return next(new ErrorResponse('Project not found', 404));
  }

  // Check if user is the owner or a professor
  const ownerId = (typeof project.owner === 'object' && project.owner._id) 
    ? project.owner._id.toString() 
    : project.owner.toString();
  
  const isOwner = ownerId === req.user._id.toString();
  const isProfessor = req.user.designation === 'Professor';

  if (!isOwner && !isProfessor) {
    return next(new ErrorResponse('Not authorized to view verification requests for this project', 403));
  }

  // Get requests for this project
  const requests = await VerificationRequest.find({ project: projectId })
    .populate('requester', 'firstName lastName email institution')
    .populate('professor', 'firstName lastName email')
    .populate('processed_by', 'firstName lastName')
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    count: requests.length,
    data: { requests }
  });
});

/**
 * @desc    Approve verification request
 * @route   POST /api/verification-requests/:id/approve
 * @access  Private (Professor only)
 */
exports.approveVerificationRequest = asyncHandler(async (req, res, next) => {
  const requestId = req.params.id;
  const professorId = req.user._id;
  const { note } = req.body;

  // Check if user is a professor
  if (req.user.designation !== 'Professor') {
    return next(new ErrorResponse('Only professors can approve verification requests', 403));
  }

  // Get the verification request
  const request = await VerificationRequest.findById(requestId)
    .populate('project')
    .populate('requester', 'firstName lastName email');

  if (!request) {
    return next(new ErrorResponse('Verification request not found', 404));
  }

  // Check if request can be processed
  if (!request.canBeProcessed()) {
    return next(new ErrorResponse('This request has already been processed', 400));
  }

  // Approve the request
  await request.approve(professorId, note);

  // Update the project
  const project = request.project;
  project.is_verified = true;
  project.verified_at = new Date();
  project.verified_by_professor_id = professorId;
  await project.save();

  // Send notification to project owner
  await Notification.createNotification({
    recipient: request.requester._id,
    type: 'VERIFICATION_APPROVED',
    title: 'Project Verified!',
    message: `Your project "${project.title}" has been verified by ${req.user.firstName} ${req.user.lastName}`,
    link: `/projects/${project._id}`,
    relatedModel: 'Project',
    relatedId: project._id,
    priority: 'high'
  });

  // Populate updated data
  await request.populate('processed_by', 'firstName lastName email');

  res.status(200).json({
    status: 'success',
    message: 'Project verified successfully',
    data: { request, project }
  });
});

/**
 * @desc    Reject verification request
 * @route   POST /api/verification-requests/:id/reject
 * @access  Private (Professor only)
 */
exports.rejectVerificationRequest = asyncHandler(async (req, res, next) => {
  const requestId = req.params.id;
  const professorId = req.user._id;
  const { note } = req.body;

  // Check if user is a professor
  if (req.user.designation !== 'Professor') {
    return next(new ErrorResponse('Only professors can reject verification requests', 403));
  }

  // Get the verification request
  const request = await VerificationRequest.findById(requestId)
    .populate('project', 'title')
    .populate('requester', 'firstName lastName email');

  if (!request) {
    return next(new ErrorResponse('Verification request not found', 404));
  }

  // Check if request can be processed
  if (!request.canBeProcessed()) {
    return next(new ErrorResponse('This request has already been processed', 400));
  }

  // Reject the request
  await request.reject(professorId, note);

  // Send notification to project owner
  await Notification.createNotification({
    recipient: request.requester._id,
    type: 'VERIFICATION_REJECTED',
    title: 'Verification Request Update',
    message: `Your verification request for "${request.project.title}" was not approved${note ? ': ' + note : ''}`,
    link: `/projects/${request.project._id}`,
    relatedModel: 'Project',
    relatedId: request.project._id,
    priority: 'normal'
  });

  // Populate updated data
  await request.populate('processed_by', 'firstName lastName email');

  res.status(200).json({
    status: 'success',
    message: 'Verification request rejected',
    data: { request }
  });
});

/**
 * @desc    Get list of professors (for requesting specific professor)
 * @route   GET /api/professors
 * @access  Private
 */
exports.getProfessors = asyncHandler(async (req, res, next) => {
  // Exclude current user from the list (professors cannot verify their own projects)
  const professors = await User.find({ 
    designation: 'Professor',
    _id: { $ne: req.user._id }
  })
    .select('firstName lastName email institution department researchInterests')
    .sort('firstName');

  res.status(200).json({
    status: 'success',
    count: professors.length,
    data: { professors }
  });
});

/**
 * Helper function to run plagiarism check asynchronously
 * @param {String} projectId - ID of the project to check
 */
async function runPlagiarismCheck(projectId) {
  try {
    // Fetch the project to check
    const project = await Project.findById(projectId);
    if (!project) {
      console.error('Project not found for plagiarism check:', projectId);
      return;
    }

    // Fetch all other projects (excluding this one)
    const existingProjects = await Project.find({
      _id: { $ne: projectId }
    }).select('title description abstract methodology keywords');

    // Run plagiarism check with 75% threshold
    const result = await PlagiarismChecker.checkPlagiarism(
      project,
      existingProjects,
      0.75
    );

    // Update project with plagiarism check results
    await Project.findByIdAndUpdate(projectId, {
      plagiarism_flag: result.plagiarismDetected,
      plagiarism_score: result.highestScore,
      matched_project_id: result.matchedProjectId,
      plagiarism_checked_at: new Date()
    });

    // If plagiarism detected, notify project owner
    if (result.plagiarismDetected) {
      const matchedProject = await Project.findById(result.matchedProjectId).select('title');
      
      await Notification.createNotification({
        recipient: project.owner,
        type: 'SYSTEM_ANNOUNCEMENT',
        title: 'Plagiarism Alert',
        message: `Your project "${project.title}" has been flagged for possible plagiarism (${Math.round(result.highestScore * 100)}% similarity with "${matchedProject?.title || 'another project'}"). Please review.`,
        link: `/projects/${projectId}`,
        relatedModel: 'Project',
        relatedId: projectId,
        priority: 'high'
      });
    }

    console.log(`Plagiarism check completed for project ${projectId}:`, result);
  } catch (error) {
    console.error('Error running plagiarism check:', error);
  }
}
