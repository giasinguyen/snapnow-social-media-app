const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyFirebaseToken, requireAdmin } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(verifyFirebaseToken);
router.use(requireAdmin);

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination and filters
 * @access  Private/Admin
 */
router.get('/', userController.getUsers);

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Private/Admin
 */
router.get('/stats', userController.getUserStats);

// Specific routes MUST come before dynamic :userId routes
/**
 * @route   PATCH /api/users/:userId/status
 * @desc    Update user status (active/banned)
 * @access  Private/Admin
 */
router.patch('/:userId/status', userController.updateUserStatus);

/**
 * @route   PATCH /api/users/:userId/role
 * @desc    Update user role (user/admin)
 * @access  Private/Admin
 */
router.patch('/:userId/role', userController.updateUserRole);

/**
 * @route   PUT /api/users/:userId/ban
 * @desc    Ban/Unban user
 * @access  Private/Admin
 */
router.put('/:userId/ban', userController.toggleBanUser);

/**
 * @route   GET /api/users/:userId/posts
 * @desc    Get user's posts
 * @access  Private/Admin
 */
router.get('/:userId/posts', userController.getUserPosts);

/**
 * @route   GET /api/users/:userId/activity
 * @desc    Get user's activity log
 * @access  Private/Admin
 */
router.get('/:userId/activity', userController.getUserActivity);

/**
 * @route   GET /api/users/:userId
 * @desc    Get user by ID
 * @access  Private/Admin
 */
router.get('/:userId', userController.getUserById);

/**
 * @route   PUT /api/users/:userId
 * @desc    Update user
 * @access  Private/Admin
 */
router.put('/:userId', userController.updateUser);

/**
 * @route   DELETE /api/users/:userId
 * @desc    Delete user
 * @access  Private/Admin
 */
router.delete('/:userId', userController.deleteUser);

module.exports = router;
