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

/**
 * @route   GET /api/analytics/users
 * @desc    Get users list with pagination
 * @access  Private/Admin
 */
router.get('/users', analyticsController.getUsersList);

/**
 * @route   GET /api/analytics/users/search
 * @desc    Search users by username
 * @access  Private/Admin
 */
router.get('/users/search', analyticsController.searchUsers);

/**
 * @route   GET /api/analytics/users/:userId
 * @desc    Get user details by ID
 * @access  Private/Admin
 */
router.get('/users/:userId', analyticsController.getUserDetails);

/**
 * @route   GET /api/analytics/posts
 * @desc    Get posts list with pagination
 * @access  Private/Admin
 */
router.get('/posts', analyticsController.getPostsList);

/**
 * @route   GET /api/analytics/posts/:postId
 * @desc    Get post details by ID
 * @access  Private/Admin
 */
router.get('/posts/:postId', analyticsController.getPostDetails);

/**
 * @route   GET /api/analytics/moderation
 * @desc    Get content moderation statistics
 * @access  Private/Admin
 */
router.get('/moderation', analyticsController.getModerationStats);

module.exports = router;
