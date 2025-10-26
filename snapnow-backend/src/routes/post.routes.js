const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const { verifyToken, requireAdmin } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(verifyToken);
router.use(requireAdmin);

/**
 * @route   GET /api/posts
 * @desc    Get all posts with pagination and filters
 * @access  Private/Admin
 */
router.get('/', postController.getPosts);

/**
 * @route   GET /api/posts/stats
 * @desc    Get post statistics
 * @access  Private/Admin
 */
router.get('/stats', postController.getPostStats);

/**
 * @route   GET /api/posts/:postId
 * @desc    Get post by ID
 * @access  Private/Admin
 */
router.get('/:postId', postController.getPostById);

/**
 * @route   DELETE /api/posts/:postId
 * @desc    Delete post
 * @access  Private/Admin
 */
router.delete('/:postId', postController.deletePost);

/**
 * @route   PUT /api/posts/:postId/hide
 * @desc    Hide/Unhide post
 * @access  Private/Admin
 */
router.put('/:postId/hide', postController.toggleHidePost);

/**
 * @route   GET /api/posts/:postId/comments
 * @desc    Get post comments
 * @access  Private/Admin
 */
router.get('/:postId/comments', postController.getPostComments);

/**
 * @route   GET /api/posts/reported
 * @desc    Get reported posts
 * @access  Private/Admin
 */
router.get('/reported/list', postController.getReportedPosts);

module.exports = router;
