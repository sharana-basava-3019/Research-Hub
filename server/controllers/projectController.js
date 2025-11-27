/**
 * Project Controller
 * Handles CRUD operations for research projects
 */

const Project = require('../models/Project');
const Comment = require('../models/Comment');
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
  const isOwner = project.owner.toString() === req.user.id;
  const isCollaborator = project.collaborators.some(
    collab => collab.user.toString() === req.user.id
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
  const isOwner = project.owner.toString() === req.user.id;
  const isCollaborator = project.collaborators.some(
    collab => collab.user.toString() === req.user.id
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
