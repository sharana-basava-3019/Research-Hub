/**
 * Analytics Routes
 * @route /api/analytics
 */

const express = require('express');
const {
  getRecommendations,
  getTrends,
  getKeywords,
  getDashboard,
  getPlatformStats
} = require('../controllers/analyticsController');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/analytics/recommendations:
 *   get:
 *     summary: Get collaborator recommendations
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of recommended collaborators
 */
router.get('/recommendations', protect, getRecommendations);

/**
 * @swagger
 * /api/analytics/trends:
 *   get:
 *     summary: Get trending research topics
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Trending topics and keywords
 */
router.get('/trends', getTrends);

/**
 * @swagger
 * /api/analytics/keywords/{projectId}:
 *   get:
 *     summary: Get keyword analysis for a project
 *     tags: [Analytics]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Extracted keywords and analysis
 */
router.get('/keywords/:projectId', getKeywords);

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     summary: Get analytics dashboard data
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 */
router.get('/dashboard', protect, getDashboard);

/**
 * @swagger
 * /api/analytics/platform-stats:
 *   get:
 *     summary: Get public platform statistics (counts of users, projects, etc.)
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Platform statistics
 */
router.get('/platform-stats', getPlatformStats);

module.exports = router;
