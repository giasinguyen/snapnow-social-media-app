const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment.controller');
const { verifyFirebaseToken, requireAdmin } = require('../middleware/auth.middleware');

// All routes require authentication and admin
router.use(verifyFirebaseToken);
router.use(requireAdmin);

/**
 * @route   GET /api/comments/stats
 * @desc    Get comment statistics
 * @access  Private/Admin
 */
router.get('/stats', commentController.getCommentStats);

/**
 * @route   GET /api/comments
 * @desc    Get all comments with pagination
 * @access  Private/Admin
 */
router.get('/', commentController.getComments);

/**
 * @route   DELETE /api/comments/:commentId
 * @desc    Delete a comment
 * @access  Private/Admin
 */
router.delete('/:commentId', commentController.deleteComment);

module.exports = router;
