/**
 * Analytics Controller
 * Interfaces with Python analytics service for recommendations and insights
 */

const axios = require('axios');
const Project = require('../models/Project');
const User = require('../models/User');
const AnalyticsData = require('../models/AnalyticsData');
const { asyncHandler } = require('../middleware/validator');
const { ErrorResponse } = require('../middleware/errorHandler');

// Python Analytics Service URL (with automatic fallback to JS implementation if unavailable)
const ANALYTICS_API_URL = process.env.ANALYTICS_API_URL || 'http://localhost:8000';

/**
 * @desc    Get collaborator recommendations for a user
 * @route   GET /api/analytics/recommendations
 * @access  Private
 */
exports.getRecommendations = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  try {
    // Check cache first
    const cached = await AnalyticsData.getCached('recommendations', userId);
    
    if (cached) {
      return res.status(200).json({
        status: 'success',
        message: 'Recommendations retrieved from cache',
        cached: true,
        data: cached.data
      });
    }

    // Get user's research interests and projects
    const user = await User.findById(userId).select('researchInterests');
    const userProjects = await Project.find({ owner: userId })
      .select('title description keywords researchArea');

    // Call Python analytics service
    const response = await axios.post(
      `${ANALYTICS_API_URL}/recommendations`,
      {
        userId,
        researchInterests: user.researchInterests,
        projects: userProjects
      },
      { timeout: 10000 }
    );

    // Cache the results
    await AnalyticsData.cacheData('recommendations', response.data, {
      userId,
      generatedBy: 'python-service',
      processingTime: response.data.processingTime
    });

    res.status(200).json({
      status: 'success',
      message: 'Recommendations generated successfully',
      cached: false,
      data: response.data
    });

  } catch (error) {
    console.error('Analytics Service Error:', error.message);
    
    // Return fallback recommendations
    const fallbackRecommendations = await getFallbackRecommendations(userId);
    
    res.status(200).json({
      status: 'success',
      message: 'Fallback recommendations (Analytics service unavailable)',
      fallback: true,
      data: fallbackRecommendations
    });
  }
});

/**
 * @desc    Get trending research topics
 * @route   GET /api/analytics/trends
 * @access  Public
 */
exports.getTrends = asyncHandler(async (req, res, next) => {
  try {
    // Check cache first
    const cached = await AnalyticsData.getCached('trends');
    
    if (cached) {
      return res.status(200).json({
        status: 'success',
        message: 'Trends retrieved from cache',
        cached: true,
        data: cached.data
      });
    }

    // Get recent projects
    const recentProjects = await Project.find({
      visibility: 'Public',
      createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // Last 90 days
    }).select('keywords researchArea tags');

    // Call Python analytics service
    const response = await axios.post(
      `${ANALYTICS_API_URL}/trends`,
      { projects: recentProjects },
      { timeout: 10000 }
    );

    // Cache the results
    await AnalyticsData.cacheData('trends', response.data, {
      generatedBy: 'python-service',
      processingTime: response.data.processingTime
    });

    res.status(200).json({
      status: 'success',
      message: 'Trends analyzed successfully',
      cached: false,
      data: response.data
    });

  } catch (error) {
    console.error('Analytics Service Error:', error.message);
    
    // Return fallback trends
    const fallbackTrends = await getFallbackTrends();
    
    res.status(200).json({
      status: 'success',
      message: 'Fallback trends (Analytics service unavailable)',
      fallback: true,
      data: fallbackTrends
    });
  }
});

/**
 * @desc    Get keyword analysis for a project
 * @route   GET /api/analytics/keywords/:projectId
 * @access  Public
 */
exports.getKeywords = asyncHandler(async (req, res, next) => {
  const { projectId } = req.params;

  const project = await Project.findById(projectId);
  
  if (!project) {
    return next(new ErrorResponse('Project not found', 404));
  }

  try {
    // Check cache first
    const cached = await AnalyticsData.getCached('keywords', null, projectId);
    
    if (cached) {
      return res.status(200).json({
        status: 'success',
        message: 'Keywords retrieved from cache',
        cached: true,
        data: cached.data
      });
    }

    // Call Python analytics service
    const response = await axios.post(
      `${ANALYTICS_API_URL}/keywords`,
      {
        text: `${project.title} ${project.description} ${project.abstract || ''}`,
        projectId
      },
      { timeout: 5000 }
    );

    // Cache the results
    await AnalyticsData.cacheData('keywords', response.data, {
      projectId,
      generatedBy: 'python-service',
      processingTime: response.data.processingTime
    });

    res.status(200).json({
      status: 'success',
      message: 'Keywords extracted successfully',
      cached: false,
      data: response.data
    });

  } catch (error) {
    console.error('Analytics Service Error:', error.message);
    
    // Return existing keywords as fallback
    res.status(200).json({
      status: 'success',
      message: 'Fallback keywords (Analytics service unavailable)',
      fallback: true,
      data: {
        keywords: project.keywords || [],
        tags: project.tags || []
      }
    });
  }
});

/**
 * @desc    Get analytics dashboard data
 * @route   GET /api/analytics/dashboard
 * @access  Private
 */
exports.getDashboard = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  // Get user's project statistics
  const projectStats = await Project.aggregate([
    { $match: { owner: req.user._id } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Get collaboration statistics
  const Collaboration = require('../models/Collaboration');
  const collaborationStats = await Collaboration.aggregate([
    {
      $match: {
        $or: [{ sender: req.user._id }, { receiver: req.user._id }]
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Get total views
  const totalViews = await Project.aggregate([
    { $match: { owner: req.user._id } },
    {
      $group: {
        _id: null,
        totalViews: { $sum: '$viewCount' }
      }
    }
  ]);

  // Format statistics
  const dashboard = {
    projects: {
      total: 0,
      byStatus: {}
    },
    collaborations: {
      total: 0,
      byStatus: {}
    },
    totalViews: totalViews[0]?.totalViews || 0,
    generatedAt: new Date()
  };

  projectStats.forEach(stat => {
    dashboard.projects.byStatus[stat._id] = stat.count;
    dashboard.projects.total += stat.count;
  });

  collaborationStats.forEach(stat => {
    dashboard.collaborations.byStatus[stat._id] = stat.count;
    dashboard.collaborations.total += stat.count;
  });

  res.status(200).json({
    status: 'success',
    data: {
      dashboard
    }
  });
});

/**
 * Helper function: Calculate match score between two users
 * Score ranges from 0 to 1 based on multiple factors
 */
function calculateMatchScore(currentUser, targetUser) {
  let score = 0;
  let factors = 0;

  // Factor 1: Research Interest Overlap (40% weight)
  if (currentUser.researchInterests && currentUser.researchInterests.length > 0 &&
      targetUser.researchInterests && targetUser.researchInterests.length > 0) {
    const commonInterests = currentUser.researchInterests.filter(
      interest => targetUser.researchInterests.includes(interest)
    );
    const totalInterests = new Set([
      ...currentUser.researchInterests,
      ...targetUser.researchInterests
    ]).size;
    
    const interestScore = commonInterests.length / Math.max(currentUser.researchInterests.length, 1);
    score += interestScore * 0.4;
    factors++;
  }

  // Factor 2: Institution Match (20% weight)
  if (currentUser.institution && targetUser.institution) {
    if (currentUser.institution.toLowerCase() === targetUser.institution.toLowerCase()) {
      score += 0.2;
    }
    factors++;
  }

  // Factor 3: Department Match (15% weight)
  if (currentUser.department && targetUser.department) {
    if (currentUser.department.toLowerCase() === targetUser.department.toLowerCase()) {
      score += 0.15;
    }
    factors++;
  }

  // Factor 4: Designation Compatibility (15% weight)
  if (currentUser.designation && targetUser.designation) {
    const seniorRoles = ['Professor', 'Associate Professor', 'Assistant Professor', 'Post-Doc'];
    const isCurrentSenior = seniorRoles.includes(currentUser.designation);
    const isTargetSenior = seniorRoles.includes(targetUser.designation);
    
    // Complementary roles score higher
    if (isCurrentSenior !== isTargetSenior) {
      score += 0.15;
    } else if (currentUser.designation === targetUser.designation) {
      score += 0.1; // Same level is good but not ideal
    }
    factors++;
  }

  // Factor 5: Activity Level (10% weight)
  // Users with publications or active projects score higher
  if (targetUser.publications && targetUser.publications.length > 0) {
    score += Math.min(targetUser.publications.length * 0.02, 0.1);
    factors++;
  }

  // Normalize score if not all factors were considered
  if (factors === 0) return 0.5; // Default if no data available
  
  return Math.min(Math.max(score, 0), 1); // Ensure score is between 0 and 1
}

/**
 * Helper function: Get fallback recommendations (similarity-based)
 */
async function getFallbackRecommendations(userId) {
  const user = await User.findById(userId).select('firstName lastName institution department designation researchInterests publications');
  
  // Find users with similar research interests
  const candidates = await User.find({
    _id: { $ne: userId },
    researchInterests: { $in: user.researchInterests }
  })
    .select('firstName lastName institution department designation researchInterests publications profilePicture')
    .limit(50); // Get more candidates for better scoring

  // Calculate match scores for each candidate
  const recommendations = candidates.map(candidate => {
    const matchScore = calculateMatchScore(user, candidate);
    const matchingInterests = candidate.researchInterests.filter(
      interest => user.researchInterests.includes(interest)
    );

    return {
      user: candidate,
      matchScore: Math.round(matchScore * 100) / 100, // Round to 2 decimal places
      matchingInterests,
      matchReasons: getMatchReasons(user, candidate, matchingInterests)
    };
  });

  // Sort by match score and take top 10
  recommendations.sort((a, b) => b.matchScore - a.matchScore);
  const topRecommendations = recommendations.slice(0, 10);

  return {
    recommendations: topRecommendations,
    method: 'fallback-similarity',
    totalCandidates: candidates.length
  };
}

/**
 * Helper function: Generate human-readable match reasons
 */
function getMatchReasons(currentUser, targetUser, matchingInterests) {
  const reasons = [];

  if (matchingInterests.length > 0) {
    reasons.push(`${matchingInterests.length} shared research interest${matchingInterests.length > 1 ? 's' : ''}`);
  }

  if (currentUser.institution && targetUser.institution &&
      currentUser.institution.toLowerCase() === targetUser.institution.toLowerCase()) {
    reasons.push('Same institution');
  }

  if (currentUser.department && targetUser.department &&
      currentUser.department.toLowerCase() === targetUser.department.toLowerCase()) {
    reasons.push('Same department');
  }

  if (targetUser.publications && targetUser.publications.length > 0) {
    reasons.push(`${targetUser.publications.length} publication${targetUser.publications.length > 1 ? 's' : ''}`);
  }

  return reasons;
}

/**
 * Helper function: Get fallback trends (keyword frequency)
 */
async function getFallbackTrends() {
  const recentProjects = await Project.find({
    visibility: 'Public',
    createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
  }).select('keywords researchArea');

  // Count keyword frequencies
  const keywordCounts = {};
  const areaCounts = {};

  recentProjects.forEach(project => {
    project.keywords.forEach(keyword => {
      keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
    });
    areaCounts[project.researchArea] = (areaCounts[project.researchArea] || 0) + 1;
  });

  // Sort and get top trends
  const topKeywords = Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([keyword, count]) => ({ keyword, count }));

  const topAreas = Object.entries(areaCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([area, count]) => ({ area, count }));

  return {
    trendingKeywords: topKeywords,
    trendingAreas: topAreas,
    method: 'fallback-frequency'
  };
}
