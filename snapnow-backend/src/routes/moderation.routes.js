const express = require('express');
const router = express.Router();
const moderationController = require('../controllers/moderation.controller');
const { verifyToken, requireAdmin } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(verifyToken);
router.use(requireAdmin);

/**
 * @route   GET /api/moderation/reports
 * @desc    Get all reports
 * @access  Private/Admin
 */
router.get('/reports', moderationController.getReports);

/**
 * @route   GET /api/moderation/reports/:reportId
 * @desc    Get report by ID
 * @access  Private/Admin
 */
router.get('/reports/:reportId', moderationController.getReportById);

/**
 * @route   PUT /api/moderation/reports/:reportId/resolve
 * @desc    Resolve report
 * @access  Private/Admin
 */
router.put('/reports/:reportId/resolve', moderationController.resolveReport);

/**
 * @route   GET /api/moderation/flagged-content
 * @desc    Get flagged content
 * @access  Private/Admin
 */
router.get('/flagged-content', moderationController.getFlaggedContent);

/**
 * @route   POST /api/moderation/content/:contentId/review
 * @desc    Review content (approve/reject)
 * @access  Private/Admin
 */
router.post('/content/:contentId/review', moderationController.reviewContent);

module.exports = router;
