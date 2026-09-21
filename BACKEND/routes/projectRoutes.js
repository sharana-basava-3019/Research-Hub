/**
 * Project Routes
 * @route /api/projects
 */

const express = require('express');
const { body } = require('express-validator');
const upload = require('../config/multer');
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getUserProjects,
  getMyProjects,
  addComment,
  getComments,
  uploadAttachment,
  deleteAttachment,
  checkAttachmentPlagiarism,
  checkAllAttachments,
  checkProjectMetadata,
  sendVerificationRequest,
  getVerificationRequests,
  getProjectVerificationRequests,
  approveVerificationRequest,
  rejectVerificationRequest,
  getProfessors
} = require('../controllers/projectController');
const { protect, optionalAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const router = express.Router();

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects with filtering and pagination
 *     tags: [Projects]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: researchArea
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of projects
 */
router.get('/', optionalAuth, getProjects);

// Verification Routes - Must be before :id routes

/**
 * @swagger
 * /api/projects/verification-requests:
 *   get:
 *     summary: Get all verification requests (for professors)
 *     tags: [Verification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of verification requests
 */
router.get('/verification-requests', protect, getVerificationRequests);

/**
 * @swagger
 * /api/projects/verification-requests/{id}/approve:
 *   post:
 *     summary: Approve a verification request
 *     tags: [Verification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Verification request approved
 */
router.post('/verification-requests/:id/approve', protect, approveVerificationRequest);

/**
 * @swagger
 * /api/projects/verification-requests/{id}/reject:
 *   post:
 *     summary: Reject a verification request
 *     tags: [Verification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Verification request rejected
 */
router.post('/verification-requests/:id/reject', protect, rejectVerificationRequest);

/**
 * @swagger
 * /api/projects/professors:
 *   get:
 *     summary: Get list of professors
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of professors
 */
router.get('/professors', protect, getProfessors);

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get current user's own projects
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user's projects
 */
router.get('/my', protect, getMyProjects);

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get single project by ID
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project details
 */
router.get('/:id', optionalAuth, getProject);

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create new project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - researchArea
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               researchArea:
 *                 type: string
 *     responses:
 *       201:
 *         description: Project created successfully
 */
router.post(
  '/',
  protect,
  [
    body('title')
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ max: 200 })
      .withMessage('Title cannot exceed 200 characters'),
    body('description')
      .notEmpty()
      .withMessage('Description is required')
      .isLength({ max: 2000 })
      .withMessage('Description cannot exceed 2000 characters'),
    body('researchArea').notEmpty().withMessage('Research area is required'),
    validate
  ],
  createProject
);

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     summary: Update project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project updated successfully
 */
router.put('/:id', protect, updateProject);

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Delete project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project deleted successfully
 */
router.delete('/:id', protect, deleteProject);

/**
 * @swagger
 * /api/projects/user/{userId}:
 *   get:
 *     summary: Get user's projects
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User's projects
 */
router.get('/user/:userId', getUserProjects);

/**
 * @swagger
 * /api/projects/{id}/comments:
 *   get:
 *     summary: Get project comments
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project comments
 */
router.get('/:id/comments', getComments);

/**
 * @swagger
 * /api/projects/{id}/comments:
 *   post:
 *     summary: Add comment to project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Comment added successfully
 */
router.post(
  '/:id/comments',
  protect,
  [
    body('text')
      .notEmpty()
      .withMessage('Comment text is required')
      .isLength({ max: 1000 })
      .withMessage('Comment cannot exceed 1000 characters'),
    validate
  ],
  addComment
);

/**
 * @swagger
 * /api/projects/{id}/attachments:
 *   post:
 *     summary: Upload file attachment to project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded successfully
 */
router.post('/:id/attachments', protect, upload.single('file'), uploadAttachment);

/**
 * @swagger
 * /api/projects/{id}/check-metadata-plagiarism:
 *   post:
 *     summary: Check plagiarism for project metadata (title, description, abstract)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Plagiarism check completed with results
 */
router.post('/:id/check-metadata-plagiarism', protect, checkProjectMetadata);

/**
 * @swagger
 * /api/projects/{id}/attachments/{attachmentId}/check-plagiarism:
 *   post:
 *     summary: Check plagiarism for a specific attachment
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: attachmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Plagiarism check completed with results
 */
router.post('/:id/attachments/:attachmentId/check-plagiarism', protect, checkAttachmentPlagiarism);

/**
 * @swagger
 * /api/projects/{id}/check-all-attachments:
 *   post:
 *     summary: Check plagiarism for all PDF/DOCX attachments in project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Plagiarism checks started for all eligible attachments
 */
router.post('/:id/check-all-attachments', protect, checkAllAttachments);

/**
 * @swagger
 * /api/projects/{id}/attachments/{attachmentId}:
 *   delete:
 *     summary: Delete file attachment from project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: attachmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Attachment deleted successfully
 */
router.delete('/:id/attachments/:attachmentId', protect, deleteAttachment);

/**
 * @swagger
 * /api/projects/{id}/verification-request:
 *   post:
 *     summary: Send verification request for a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *               professorId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Verification request sent successfully
 */
router.post('/:id/verification-request', protect, sendVerificationRequest);

/**
 * @swagger
 * /api/projects/{id}/verification-requests:
 *   get:
 *     summary: Get verification requests for a specific project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of verification requests for the project
 */
router.get('/:id/verification-requests', protect, getProjectVerificationRequests);

module.exports = router;
