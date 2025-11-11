const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { verifyFirebaseToken, requireAdmin } = require('../middleware/auth.middleware');

// All routes require authentication and admin role
router.use(verifyFirebaseToken);
router.use(requireAdmin);

/**
 * @route   GET /api/analytics/overview
 * @desc    Get dashboard overview with all key metrics
 * @access  Private/Admin
 */
router.get('/overview', analyticsController.getOverview);

/**
 * @route   GET /api/analytics/user-growth
 * @desc    Get user growth analytics over time
 * @access  Private/Admin
 */
router.get('/user-growth', analyticsController.getUserGrowth);

/**
 * @route   GET /api/analytics/post-activity
 * @desc    Get post creation activity over time
 * @access  Private/Admin
 */
router.get('/post-activity', analyticsController.getPostActivity);

/**
 * @route   GET /api/analytics/engagement
 * @desc    Get engagement metrics (avg likes/comments per post)
 * @access  Private/Admin
 */
router.get('/engagement', analyticsController.getEngagement);

/**
 * @route   GET /api/analytics/top-users
 * @desc    Get top users by followers
 * @access  Private/Admin
 */
router.get('/top-users', analyticsController.getTopUsers);

/**
 * @route   GET /api/analytics/top-posts
 * @desc    Get top posts by likes
 * @access  Private/Admin
 */
router.get('/top-posts', analyticsController.getTopPosts);

/**
 * @route   GET /api/analytics/recent-activity
 * @desc    Get recent activity (posts, comments, likes)
 * @access  Private/Admin
 */
router.get('/recent-activity', analyticsController.getRecentActivity);

module.exports = router;
