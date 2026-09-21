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
const DocumentExtractor = require('../services/documentExtractor');
const { asyncHandler } = require('../middleware/validator');
const { ErrorResponse } = require('../middleware/errorHandler');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const axios = require('axios');

/**
 * Download a Cloudinary URL to a temporary local file for text extraction.
 * Returns the temp file path on success, or null on failure.
 * Caller must delete the temp file after use.
 * @param {String} url - Cloudinary (or any HTTPS) file URL
 * @param {String} filename - Original filename (used to derive extension)
 * @returns {Promise<String|null>}
 */
async function downloadToTemp(url, filename) {
  try {
    if (!url) return null;
    const ext = path.extname(filename) || '.tmp';
    const tmpFile = path.join(os.tmpdir(), `rh-${crypto.randomBytes(8).toString('hex')}${ext}`);
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
      fs.writeFileSync(tmpFile, response.data);
      return tmpFile;
    } else {
      const localPath = path.join(__dirname, '..', url);
      if (fs.existsSync(localPath)) {
        fs.copyFileSync(localPath, tmpFile);
        return tmpFile;
      }
      return null;
    }
  } catch (err) {
    console.warn(`Could not download attachment for analysis (${filename}): ${err.message}`);
    return null;
  }
}

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

  // Visibility filter (if not logged in, only show public)
  let visibilityCondition = null;
  if (!req.user) {
    query.visibility = 'Public';
  } else if (req.user.role !== 'admin') {
    visibilityCondition = [
      { visibility: 'Public' },
      { owner: req.user.id },
      { 'collaborators.user': req.user.id }
    ];
  }

  // Search by text (flexible regex matching)
  if (req.query.search && req.query.search.trim()) {
    const searchRegex = new RegExp(req.query.search.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
    const searchConditions = [
      { title: searchRegex },
      { description: searchRegex },
      { abstract: searchRegex },
      { researchArea: searchRegex },
      { keywords: searchRegex },
      { tags: searchRegex }
    ];

    if (visibilityCondition) {
      query.$and = [
        { $or: visibilityCondition },
        { $or: searchConditions }
      ];
    } else {
      query.$or = searchConditions;
    }
  } else if (visibilityCondition) {
    query.$or = visibilityCondition;
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  // Sort
  const sortBy = req.query.sortBy || '-createdAt';

  // Execute query
  const projects = await Project.find(query)
    .populate('owner', 'firstName lastName username email institution profilePicture')
    .populate('collaborators.user', 'firstName lastName username institution')
    .sort(sortBy)
    .skip(skip)
    .limit(limit);

  // Strip ghost collaborators (deleted users) from each project's in-memory list
  // so member counts in catalog cards are always accurate
  const ghostPullOps = [];
  projects.forEach(p => {
    const ghostIds = p.collaborators
      .filter(c => !c.user || (typeof c.user === 'object' && !c.user._id))
      .map(c => c._id);
    if (ghostIds.length > 0) {
      ghostPullOps.push(
        Project.updateOne(
          { _id: p._id },
          { $pull: { collaborators: { _id: { $in: ghostIds } } } }
        )
      );
      p.collaborators = p.collaborators.filter(
        c => c.user && (typeof c.user !== 'object' || c.user._id)
      );
    }
  });
  if (ghostPullOps.length > 0) {
    await Promise.all(ghostPullOps);
  }

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
    .populate('owner', 'firstName lastName username email institution department profilePicture researchInterests')
    .populate('collaborators.user', 'firstName lastName username institution profilePicture')
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

  // Clean up ghost collaborators — users deleted from DB leave null populate results
  const ghostIds = project.collaborators
    .filter(c => !c.user || (typeof c.user === 'object' && !c.user._id))
    .map(c => c._id);

  if (ghostIds.length > 0) {
    // Atomically remove ghost entries from DB
    await Project.updateOne(
      { _id: project._id },
      { $pull: { collaborators: { _id: { $in: ghostIds } } } }
    );
    // Filter them out of the in-memory document before responding
    project.collaborators = project.collaborators.filter(
      c => c.user && (typeof c.user !== 'object' || c.user._id)
    );
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
  // Whitelist allowed fields to prevent mass assignment of sensitive fields
  // (e.g. is_verified, plagiarism_score, viewCount, likeCount, verified_by_professor_id)
  const allowedFields = [
    'title', 'description', 'abstract', 'researchArea', 'keywords',
    'methodology', 'status', 'visibility', 'startDate', 'endDate',
    'fundingSource', 'fundingAmount', 'isOpenForCollaboration',
    'requiredSkills', 'maxCollaborators', 'repository', 'documentation',
    'publications', 'tags'
  ];

  const projectData = { owner: req.user.id };
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      projectData[field] = req.body[field];
    }
  });

  const project = await Project.create(projectData);

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

  // Whitelist allowed fields to prevent mass assignment of sensitive fields
  // (e.g. is_verified, plagiarism_score, viewCount, likeCount, verified_by_professor_id)
  const allowedFields = [
    'title', 'description', 'abstract', 'researchArea', 'keywords',
    'methodology', 'status', 'visibility', 'startDate', 'endDate',
    'fundingSource', 'fundingAmount', 'isOpenForCollaboration',
    'requiredSkills', 'maxCollaborators', 'repository', 'documentation',
    'publications', 'tags'
  ];

  const updateData = {};
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  project = await Project.findByIdAndUpdate(
    req.params.id,
    updateData,
    {
      new: true,
      runValidators: true
    }
  );

  // Run plagiarism check asynchronously if content changed
  if (updateData.title || updateData.description || updateData.abstract || updateData.methodology) {
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
    .populate('owner', 'firstName lastName username institution profilePicture')
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
    .populate('owner', 'firstName lastName username institution profilePicture')
    .populate('collaborators.user', 'firstName lastName username institution profilePicture')
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

  await comment.populate('author', 'firstName lastName profilePicture username');

  // Broadcast real-time comment to project discussion room
  try {
    const { emitComment } = require('../utils/socketEmitter');
    emitComment(req.params.id, comment);
  } catch (err) {
    // Non-blocking socket error
  }

  // Create notification for project owner (if commenter is not the owner)
  const ownerId = (typeof project.owner === 'object' && project.owner && project.owner._id)
    ? project.owner._id.toString()
    : (project.owner ? project.owner.toString() : '');

  if (ownerId && ownerId !== req.user.id) {
    try {
      await Notification.createNotification({
        recipient: ownerId,
        type: 'COMMENT',
        title: 'New Comment on Your Project',
        message: `${req.user.firstName} ${req.user.lastName} commented on "${project.title}"`,
        link: `/projects/${project._id}`,
        relatedModel: 'Project',
        relatedId: project._id,
        priority: 'normal'
      });
    } catch (err) {
      console.error('Error creating comment notification:', err.message);
    }
  }

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
  const isOwner = project.isOwner(req.user._id || req.user.id || req.user);
  const isCollaborator = project.isCollaborator(req.user._id || req.user.id || req.user);

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
    filename: relativePath,         // Original or relative filename for display
    url: req.file.path,             // Cloudinary HTTPS URL (set by multer-storage-cloudinary)
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
    uploadedAt: new Date(),
    uploadedBy: req.user.id
  };

  // Add to project attachments
  project.attachments.push(attachment);
  await project.save();

  // Get the newly added attachment with its _id
  const newAttachment = project.attachments[project.attachments.length - 1];

  res.status(200).json({
    status: 'success',
    message: 'File uploaded successfully',
    data: {
      attachment: newAttachment
    }
  });
});

/**
 * @desc    Check plagiarism for a specific attachment
 * @route   POST /api/projects/:id/attachments/:attachmentId/check-plagiarism
 * @access  Private
 */
exports.checkAttachmentPlagiarism = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return next(new ErrorResponse('Project not found', 404));
  }

  const attachment = project.attachments.id(req.params.attachmentId);

  if (!attachment) {
    return next(new ErrorResponse('Attachment not found', 404));
  }

  // Check if file is PDF or DOCX
  const isPdfOrDocx = attachment.filename.match(/\.(pdf|docx)$/i);
  if (!isPdfOrDocx) {
    return next(new ErrorResponse('Plagiarism check only available for PDF and DOCX files', 400));
  }

  // Download attachment from Cloudinary for text extraction
  const attachmentTempPath = await downloadToTemp(attachment.url, attachment.filename);
  if (!attachmentTempPath) {
    return next(new ErrorResponse('Could not download file for plagiarism check', 404));
  }

  try {
    // Extract text from the downloaded document
    const uploadedText = await DocumentExtractor.extractText(attachmentTempPath);
    fs.unlinkSync(attachmentTempPath); // Clean up temp file immediately

    if (!uploadedText || uploadedText.trim().length < 100) {
      return res.status(200).json({
        status: 'success',
        warning: false,
        message: 'Insufficient text content for plagiarism check (minimum 100 characters required)',
        data: {
          filename: attachment.filename,
          textLength: uploadedText?.length || 0
        }
      });
    }

    // Get all projects with attachments to compare against
    const projects = await Project.find({ 
      'attachments.0': { $exists: true },
      _id: { $ne: project._id }
    })
      .select('title attachments owner')
      .populate('owner', 'firstName lastName email')
      .lean();

    // Prepare existing documents for comparison
    const existingDocuments = [];
    
    for (const proj of projects) {
      if (!proj.attachments || proj.attachments.length === 0) continue;

      for (const att of proj.attachments) {
        if (!att.filename.match(/\.(pdf|docx)$/i)) continue;
        if (String(att?._id || '') === String(attachment?._id || '')) continue;

        const tempPath = await downloadToTemp(att.url, att.filename);
        if (!tempPath) continue;

        try {
          const attText = await DocumentExtractor.extractText(tempPath);
          fs.unlinkSync(tempPath); // Clean up immediately after extraction

          if (attText && attText.trim().length >= 100) {
            existingDocuments.push({
              _id: att._id,
              filename: att.filename,
              text: attText,
              projectTitle: proj.title,
              projectId: proj._id,
              uploadedBy: proj.owner
            });
          }
        } catch (error) {
          if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
          console.error(`Error extracting text from ${att.filename}:`, error.message);
        }
      }
    }

    // Perform plagiarism check
    const comparisonResult = await PlagiarismChecker.compareDocument(
      uploadedText,
      existingDocuments
    );

    // Update attachment with results
    await Project.updateOne(
      { _id: project._id, 'attachments._id': attachment._id },
      {
        $set: {
          'attachments.$.plagiarism_checked': true,
          'attachments.$.plagiarism_score': comparisonResult.highestSimilarityScore || 0,
          'attachments.$.plagiarism_status': comparisonResult.status,
          'attachments.$.matched_document_id': comparisonResult.mostSimilarDocument?.id || null,
          'attachments.$.plagiarism_checked_at': new Date()
        }
      }
    );

    // Determine if warning should be shown
    const showWarning = comparisonResult.status === 'high_similarity' || comparisonResult.status === 'moderate_similarity';
    
    res.status(200).json({
      status: 'success',
      warning: showWarning,
      data: {
        filename: attachment.filename,
        plagiarismCheck: {
          status: comparisonResult.status,
          similarityPercentage: comparisonResult.similarityPercentage,
          message: comparisonResult.message,
          totalDocumentsChecked: comparisonResult.totalDocumentsChecked
        },
        matches: comparisonResult.matches.slice(0, 5),
        mostSimilarDocument: comparisonResult.mostSimilarDocument,
        report: PlagiarismChecker.generateReport(comparisonResult)
      }
    });

  } catch (error) {
    console.error('Error checking plagiarism:', error);
    return next(new ErrorResponse('Failed to check document for plagiarism', 500));
  }
});

/**
 * @desc    Check plagiarism for project metadata (title, description, abstract)
 * @route   POST /api/projects/:id/check-metadata-plagiarism
 * @access  Private
 */
exports.checkProjectMetadata = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return next(new ErrorResponse('Project not found', 404));
  }

  // Check if user is owner or has permission
  const isOwner = project.isOwner(req.user._id || req.user.id || req.user);
  const isCollaborator = project.isCollaborator(req.user._id || req.user.id || req.user);

  if (!isOwner && !isCollaborator && req.user.role !== 'professor' && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to check plagiarism for this project', 403));
  }

  try {
    // Fetch all other projects (excluding this one)
    const existingProjects = await Project.find({
      _id: { $ne: project._id }
    }).select('title description abstract methodology keywords owner')
      .populate('owner', 'firstName lastName email');

    // Run plagiarism check with 75% threshold
    const result = await PlagiarismChecker.checkPlagiarism(
      project,
      existingProjects,
      0.50 // Lower threshold to 50% for metadata
    );

    // Update project with plagiarism check results
    await Project.findByIdAndUpdate(project._id, {
      plagiarism_flag: result.plagiarismDetected,
      plagiarism_score: result.highestScore,
      matched_project_id: result.matchedProjectId,
      plagiarism_checked_at: new Date()
    });

    let matchedProjectInfo = null;
    if (result.matchedProjectId) {
      const matchedProject = await Project.findById(result.matchedProjectId)
        .select('title owner')
        .populate('owner', 'firstName lastName email');
      if (matchedProject) {
        matchedProjectInfo = {
          id: matchedProject._id,
          title: matchedProject.title,
          owner: matchedProject.owner
        };
      }
    }

    const showWarning = result.plagiarismDetected;
    const similarityPercentage = Math.round(result.highestScore * 100);

    res.status(200).json({
      status: 'success',
      warning: showWarning,
      data: {
        projectTitle: project.title,
        plagiarismCheck: {
          plagiarismDetected: result.plagiarismDetected,
          similarityPercentage: similarityPercentage,
          similarityScore: result.highestScore,
          message: result.message,
          totalProjectsChecked: existingProjects.length
        },
        matchedProject: matchedProjectInfo,
        recommendation: showWarning 
          ? `⚠️ High similarity detected (${similarityPercentage}%). Please review the project content for potential plagiarism.`
          : `✓ No significant plagiarism detected (${similarityPercentage}% similarity).`
      }
    });

  } catch (error) {
    console.error('Error checking project metadata plagiarism:', error);
    return next(new ErrorResponse('Failed to check project for plagiarism', 500));
  }
});

/**
 * @desc    Check plagiarism for all attachments in a project
 * @route   POST /api/projects/:id/check-all-attachments
 * @access  Private
 */
exports.checkAllAttachments = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return next(new ErrorResponse('Project not found', 404));
  }

  // Check if user is owner or has permission
  const isOwner = project.isOwner(req.user._id || req.user.id || req.user);
  const isCollaborator = project.isCollaborator(req.user._id || req.user.id || req.user);

  if (!isOwner && !isCollaborator && req.user.role !== 'professor' && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to check plagiarism for this project', 403));
  }

  const results = [];
  let hasWarnings = false;
  
  // Get all projects for comparison
  const allProjects = await Project.find({ 
    'attachments.0': { $exists: true },
    _id: { $ne: project._id }
  })
    .select('title attachments owner')
    .populate('owner', 'firstName lastName email')
    .lean();

  // Build database of existing documents
  const existingDocuments = [];
  for (const proj of allProjects) {
    if (!proj.attachments) continue;
    for (const att of proj.attachments) {
      if (!att.filename.match(/\.(pdf|docx)$/i)) continue;
      const tempPath = await downloadToTemp(att.url, att.filename);
      if (!tempPath) continue;
      try {
        const attText = await DocumentExtractor.extractText(tempPath);
        fs.unlinkSync(tempPath);
        if (attText && attText.trim().length >= 100) {
          existingDocuments.push({
            _id: att._id,
            filename: att.filename,
            text: attText,
            projectTitle: proj.title,
            projectId: proj._id
          });
        }
      } catch (error) {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        console.error(`Error extracting text from ${att.filename}:`, error.message);
      }
    }
  }

  // Check each attachment
  for (const attachment of project.attachments) {
    const isPdfOrDocx = attachment.filename.match(/\.(pdf|docx)$/i);
    if (!isPdfOrDocx) {
      results.push({
        filename: attachment.filename,
        checked: false,
        reason: 'Not a PDF or DOCX file'
      });
      continue;
    }

    const tempPath = await downloadToTemp(attachment.url, attachment.filename);
    if (!tempPath) {
      results.push({
        filename: attachment.filename,
        checked: false,
        reason: 'File not found or could not be downloaded'
      });
      continue;
    }

    try {
      const uploadedText = await DocumentExtractor.extractText(tempPath);
      fs.unlinkSync(tempPath);
      
      if (!uploadedText || uploadedText.trim().length < 100) {
        results.push({
          filename: attachment.filename,
          checked: false,
          reason: 'Insufficient text content'
        });
        continue;
      }

      // Filter out current attachment from comparison
      const compareAgainst = existingDocuments.filter(
        doc => String(doc?._id || '') !== String(attachment?._id || '')
      );

      const comparisonResult = await PlagiarismChecker.compareDocument(
        uploadedText,
        compareAgainst
      );

      // Update attachment with results
      await Project.updateOne(
        { _id: project._id, 'attachments._id': attachment._id },
        {
          $set: {
            'attachments.$.plagiarism_checked': true,
            'attachments.$.plagiarism_score': comparisonResult.highestSimilarityScore || 0,
            'attachments.$.plagiarism_status': comparisonResult.status,
            'attachments.$.matched_document_id': comparisonResult.mostSimilarDocument?.id || null,
            'attachments.$.plagiarism_checked_at': new Date()
          }
        }
      );

      const showWarning = comparisonResult.status === 'high_similarity' || comparisonResult.status === 'moderate_similarity';
      if (showWarning) hasWarnings = true;

      results.push({
        filename: attachment.filename,
        checked: true,
        warning: showWarning,
        status: comparisonResult.status,
        similarityPercentage: comparisonResult.similarityPercentage,
        message: comparisonResult.message,
        mostSimilarDocument: comparisonResult.mostSimilarDocument
      });

    } catch (error) {
      console.error(`Error checking ${attachment.filename}:`, error);
      results.push({
        filename: attachment.filename,
        checked: false,
        reason: 'Error during plagiarism check',
        error: error.message
      });
    }
  }

  res.status(200).json({
    status: 'success',
    warning: hasWarnings,
    message: hasWarnings 
      ? '⚠️ Plagiarism detected in one or more files! Please review the results.'
      : '✓ Plagiarism check complete. No significant issues found.',
    data: {
      totalAttachments: project.attachments.length,
      checkedAttachments: results.filter(r => r.checked).length,
      filesWithWarnings: results.filter(r => r.warning).length,
      results: results
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
  const isOwner = project.isOwner(req.user._id || req.user.id || req.user);
  const isCollaborator = project.isCollaborator(req.user._id || req.user.id || req.user);

  if (!isOwner && !isCollaborator) {
    return next(new ErrorResponse('Not authorized to delete files from this project', 403));
  }

  // Find attachment
  const attachment = project.attachments.id(req.params.attachmentId);

  if (!attachment) {
    return next(new ErrorResponse('Attachment not found', 404));
  }

  // Delete file from Cloudinary
  try {
    const cloudinary = require('../config/cloudinary');
    // Extract the public_id from the Cloudinary URL.
    // Cloudinary URLs follow: https://res.cloudinary.com/<cloud>/raw/upload/<...>/research-hub/projects/<public_id>.<ext>
    // The public_id stored in Cloudinary includes the folder prefix.
    const urlParts = attachment.url.split('/');
    const fileWithExt = urlParts.slice(-1)[0];
    const filename = fileWithExt.replace(/\.[^/.]+$/, ''); // strip extension
    const publicId = `research-hub/projects/${filename}`;
    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
  } catch (cloudErr) {
    // Non-fatal: log and continue — always remove the DB record
    console.warn('Cloudinary delete warning (continuing):', cloudErr.message);
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
  const userId = req.user._id || req.user.id || req.user;

  // Get the project
  const project = await Project.findById(projectId);
  if (!project) {
    return next(new ErrorResponse('Project not found', 404));
  }

  // Check if user is the project owner
  if (!project.isOwner(userId)) {
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
/**
 * @desc    Get verification requests
 * @route   GET /api/projects/verification-requests
 * @access  Private (Professors view all/pending review; non-professors view their own requests and verified projects)
 */
exports.getVerificationRequests = asyncHandler(async (req, res, next) => {
  const isProfessor = req.user.designation === 'Professor';
  const { status = 'PENDING' } = req.query;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 30;
  const skip = (page - 1) * limit;

  // Build query
  const query = {};

  if (status === 'ALL_VERIFIED') {
    query.status = 'APPROVED';
  } else if (status && status !== 'ALL') {
    query.status = status.toUpperCase();
  }

  // Non-professors see their own requests unless browsing all verified research
  if (!isProfessor && status !== 'ALL_VERIFIED') {
    query.requester = req.user._id;
  }

  // Get requests
  const requests = await VerificationRequest.find(query)
    .populate({
      path: 'project',
      select: 'title description researchArea owner is_verified verified_at verified_by_professor_id tags status',
      populate: {
        path: 'verified_by_professor_id',
        select: 'firstName lastName email institution designation username'
      }
    })
    .populate('requester', 'firstName lastName email institution designation username profilePicture')
    .populate('professor', 'firstName lastName email institution designation username profilePicture')
    .populate('processed_by', 'firstName lastName email institution designation username profilePicture')
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
    data: { 
      requests,
      isProfessor,
      userRole: req.user.designation || req.user.role
    }
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
  const ownerId = (typeof project.owner === 'object' && project.owner && project.owner._id) 
    ? project.owner._id.toString() 
    : (project.owner ? project.owner.toString() : '');
  
  const currentUserId = (req.user?._id || req.user?.id || req.user || '').toString();
  const isOwner = Boolean(ownerId && currentUserId && ownerId === currentUserId);
  const isProfessor = req.user?.designation === 'Professor';

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

  // Prevent self-verification (professors cannot verify their own projects)
  const requesterId = (request.requester?._id || request.requester || '').toString();
  const projectOwnerId = (request.project?.owner?._id || request.project?.owner || '').toString();
  const profId = (professorId || '').toString();
  const isSelfProject = Boolean(profId && (requesterId === profId || projectOwnerId === profId));
  if (isSelfProject && req.user.role !== 'admin') {
    return next(new ErrorResponse('Professors cannot review or approve verification requests for their own projects', 403));
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
    .populate('project', 'title owner')
    .populate('requester', 'firstName lastName email');

  if (!request) {
    return next(new ErrorResponse('Verification request not found', 404));
  }

  // Prevent self-review
  const requesterId = (request.requester?._id || request.requester || '').toString();
  const projectOwnerId = (request.project?.owner?._id || request.project?.owner || '').toString();
  const profId = (professorId || '').toString();
  const isSelfProject = Boolean(profId && (requesterId === profId || projectOwnerId === profId));
  if (isSelfProject && req.user.role !== 'admin') {
    return next(new ErrorResponse('Professors cannot review verification requests for their own projects', 403));
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

/**
 * Helper function to run document plagiarism check asynchronously
 * @param {String} projectId - ID of the project
 * @param {String} attachmentId - ID of the attachment to check
 * @param {String} filePath - Path to the uploaded file
 */
async function runDocumentPlagiarismCheck(projectId, attachmentId, filePath) {
  try {
    console.log(`Starting document plagiarism check for attachment ${attachmentId}...`);

    // Download/prepare document to check
    const targetTempPath = await downloadToTemp(filePath, 'document.pdf');
    if (!targetTempPath) {
      console.log('File not accessible for plagiarism check');
      return;
    }

    // Extract text from the uploaded document
    const uploadedText = await DocumentExtractor.extractText(targetTempPath);
    fs.unlinkSync(targetTempPath);

    if (!uploadedText || uploadedText.trim().length < 100) {
      console.log('Insufficient text for plagiarism check');
      return;
    }

    // Get all projects with attachments to compare against
    const projects = await Project.find({ 
      'attachments.0': { $exists: true },
      _id: { $ne: projectId } // Exclude current project
    })
      .select('title attachments owner')
      .populate('owner', 'firstName lastName email')
      .lean();

    // Prepare existing documents for comparison
    const existingDocuments = [];
    
    for (const proj of projects) {
      if (!proj.attachments || proj.attachments.length === 0) continue;

      for (const att of proj.attachments) {
        // Only process PDF and DOCX files, skip the current file being checked
        if (!att.filename.match(/\.(pdf|docx)$/i)) continue;
        if (String(att?._id || '') === String(attachmentId || '')) continue;

        const tempPath = await downloadToTemp(att.url, att.filename);
        if (!tempPath) continue;

        try {
          const attText = await DocumentExtractor.extractText(tempPath);
          fs.unlinkSync(tempPath);
          
          if (attText && attText.trim().length >= 100) {
            existingDocuments.push({
              _id: att._id,
              filename: att.filename,
              text: attText,
              projectTitle: proj.title,
              projectId: proj._id,
              uploadedBy: proj.owner
            });
          }
        } catch (error) {
          if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
          console.error(`Error extracting text from ${att.filename}:`, error.message);
        }
      }
    }

    console.log(`Comparing against ${existingDocuments.length} existing documents...`);

    // Perform plagiarism check
    const comparisonResult = await PlagiarismChecker.compareDocument(
      uploadedText,
      existingDocuments
    );

    // Update attachment with plagiarism check results
    await Project.updateOne(
      { _id: projectId, 'attachments._id': attachmentId },
      {
        $set: {
          'attachments.$.plagiarism_checked': true,
          'attachments.$.plagiarism_score': comparisonResult.highestSimilarityScore || 0,
          'attachments.$.plagiarism_status': comparisonResult.status,
          'attachments.$.matched_document_id': comparisonResult.mostSimilarDocument?.id || null,
          'attachments.$.plagiarism_checked_at': new Date()
        }
      }
    );

    // If high similarity detected, notify project owner
    if (comparisonResult.status === 'high_similarity' || comparisonResult.status === 'moderate_similarity') {
      const project = await Project.findById(projectId).select('title owner');
      const attachment = project.attachments.id(attachmentId);
      
      await Notification.createNotification({
        recipient: project.owner,
        type: 'SYSTEM_ANNOUNCEMENT',
        title: 'Document Plagiarism Alert',
        message: `File "${attachment.filename}" in project "${project.title}" shows ${comparisonResult.similarityPercentage}% similarity with existing documents. Please review.`,
        link: `/projects/${projectId}`,
        relatedModel: 'Project',
        relatedId: projectId,
        priority: comparisonResult.status === 'high_similarity' ? 'high' : 'medium'
      });
    }

    console.log(`Document plagiarism check completed for ${attachmentId}:`, {
      status: comparisonResult.status,
      similarity: comparisonResult.similarityPercentage + '%',
      documentsChecked: comparisonResult.totalDocumentsChecked
    });

  } catch (error) {
    console.error('Error running document plagiarism check:', error);
    
    // Mark as checked even if error occurred to prevent retry loops
    await Project.updateOne(
      { _id: projectId, 'attachments._id': attachmentId },
      {
        $set: {
          'attachments.$.plagiarism_checked': true,
          'attachments.$.plagiarism_status': 'error',
          'attachments.$.plagiarism_checked_at': new Date()
        }
      }
    );
  }
}
