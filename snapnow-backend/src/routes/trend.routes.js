const express = require('express');
const router = express.Router();
const trendController = require('../controllers/trend.controller');
const { verifyFirebaseToken, requireAdmin } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(verifyFirebaseToken);
router.use(requireAdmin);

/**
 * @route   GET /api/trends/hashtags
 * @desc    Get trending hashtags
 * @access  Private/Admin
 */
router.get('/hashtags', trendController.getTrendingHashtags);

/**
 * @route   GET /api/trends/engagement
 * @desc    Get engagement leaders
 * @access  Private/Admin
 */
router.get('/engagement', trendController.getTopPosts);

/**
 * @route   GET /api/trends/posts
 * @desc    Get top posts
 * @access  Private/Admin
 */
router.get('/posts', trendController.getTopPosts);

/**
 * @route   GET /api/trends/users
 * @desc    Get fastest growing users
 * @access  Private/Admin
 */
router.get('/users', trendController.getFastestGrowingUsers);

module.exports = router;
