const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { verifyFirebaseToken, requireAdmin } = require('../middleware/auth.middleware');

// All routes require authentication and admin role
router.use(verifyFirebaseToken);
router.use(requireAdmin);

/**
 * @route   GET /api/reports
 * @desc    Get all reports
 * @access  Private/Admin
 */
router.get('/', reportController.getReports);

/**
 * @route   GET /api/reports/stats
 * @desc    Get report statistics
 * @access  Private/Admin
 */
router.get('/stats', reportController.getReportStats);

/**
 * @route   PATCH /api/reports/:id/status
 * @desc    Update report status
 * @access  Private/Admin
 */
router.patch('/:id/status', reportController.updateReportStatus);

module.exports = router;
