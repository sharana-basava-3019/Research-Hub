/**
 * Collaboration Routes
 * @route /api/collaborations
 */

const express = require('express');
const { body } = require('express-validator');
const {
  getCollaborations,
  getCollaboration,
  sendCollaborationRequest,
  acceptCollaboration,
  rejectCollaboration,
  cancelCollaboration,
  getCollaborationStats
} = require('../controllers/collaborationController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * @swagger
 * /api/collaborations:
 *   get:
 *     summary: Get user's collaborations
 *     tags: [Collaborations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pending, Accepted, Rejected, Cancelled]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [sent, received]
 *     responses:
 *       200:
 *         description: List of collaborations
 */
router.get('/', getCollaborations);

/**
 * @swagger
 * /api/collaborations/stats:
 *   get:
 *     summary: Get collaboration statistics
 *     tags: [Collaborations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Collaboration statistics
 */
router.get('/stats', getCollaborationStats);

/**
 * @swagger
 * /api/collaborations/{id}:
 *   get:
 *     summary: Get collaboration by ID
 *     tags: [Collaborations]
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
 *         description: Collaboration details
 */
router.get('/:id', getCollaboration);

/**
 * @swagger
 * /api/collaborations:
 *   post:
 *     summary: Send collaboration request
 *     tags: [Collaborations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receiverId
 *               - projectId
 *               - message
 *             properties:
 *               receiverId:
 *                 type: string
 *               projectId:
 *                 type: string
 *               message:
 *                 type: string
 *               proposedRole:
 *                 type: string
 *     responses:
 *       201:
 *         description: Collaboration request sent
 */
router.post(
  '/',
  [
    body('receiverId').notEmpty().withMessage('Receiver ID is required'),
    body('projectId').notEmpty().withMessage('Project ID is required'),
    body('message')
      .notEmpty()
      .withMessage('Message is required')
      .isLength({ max: 500 })
      .withMessage('Message cannot exceed 500 characters'),
    validate
  ],
  sendCollaborationRequest
);

/**
 * @swagger
 * /api/collaborations/{id}/accept:
 *   put:
 *     summary: Accept collaboration request
 *     tags: [Collaborations]
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
 *         description: Collaboration accepted
 */
router.put('/:id/accept', acceptCollaboration);

/**
 * @swagger
 * /api/collaborations/{id}/reject:
 *   put:
 *     summary: Reject collaboration request
 *     tags: [Collaborations]
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
 *         description: Collaboration rejected
 */
router.put('/:id/reject', rejectCollaboration);

/**
 * @swagger
 * /api/collaborations/{id}:
 *   delete:
 *     summary: Cancel collaboration request
 *     tags: [Collaborations]
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
 *         description: Collaboration cancelled
 */
router.delete('/:id', cancelCollaboration);

module.exports = router;
