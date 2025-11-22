const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { verifyFirebaseToken, requireAdmin } = require('../middleware/auth.middleware');

// All routes require authentication and admin role
router.use(verifyFirebaseToken);
router.use(requireAdmin);

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications
 * @access  Private/Admin
 */
router.get('/', notificationController.getNotifications);

/**
 * @route   GET /api/notifications/stats
 * @desc    Get notification statistics
 * @access  Private/Admin
 */
router.get('/stats', notificationController.getStats);

/**
 * @route   POST /api/notifications/send
 * @desc    Send notification to users
 * @access  Private/Admin
 */
router.post('/send', notificationController.sendNotification);

module.exports = router;
