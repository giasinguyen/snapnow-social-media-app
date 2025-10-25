const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { verifyToken, requireAdmin } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(verifyToken);
router.use(requireAdmin);

/**
 * @route   GET /api/analytics/overview
 * @desc    Get dashboard overview statistics
 * @access  Private/Admin
 */
router.get('/overview', analyticsController.getOverview);

/**
 * @route   GET /api/analytics/users
 * @desc    Get user analytics (growth, active users, etc.)
 * @access  Private/Admin
 */
router.get('/users', analyticsController.getUserAnalytics);

/**
 * @route   GET /api/analytics/posts
 * @desc    Get post analytics (posts per day, engagement, etc.)
 * @access  Private/Admin
 */
router.get('/posts', analyticsController.getPostAnalytics);

/**
 * @route   GET /api/analytics/engagement
 * @desc    Get engagement metrics (likes, comments, shares)
 * @access  Private/Admin
 */
router.get('/engagement', analyticsController.getEngagementMetrics);

/**
 * @route   GET /api/analytics/trending
 * @desc    Get trending posts and hashtags
 * @access  Private/Admin
 */
router.get('/trending', analyticsController.getTrending);

/**
 * @route   GET /api/analytics/retention
 * @desc    Get user retention metrics
 * @access  Private/Admin
 */
router.get('/retention', analyticsController.getRetentionMetrics);

module.exports = router;
