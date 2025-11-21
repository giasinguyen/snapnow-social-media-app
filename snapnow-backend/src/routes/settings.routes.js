const express = require('express');
const router = express.Router();
const { getSettings, updateSettings, resetSettings } = require('../controllers/settings.controller');
const { verifyFirebaseToken, requireAdmin } = require('../middleware/auth.middleware');

/**
 * @route   GET /api/settings
 * @desc    Get current application settings
 * @access  Admin
 */
router.get('/', verifyFirebaseToken, requireAdmin, getSettings);

/**
 * @route   PUT /api/settings
 * @desc    Update application settings
 * @access  Admin
 */
router.put('/', verifyFirebaseToken, requireAdmin, updateSettings);

/**
 * @route   POST /api/settings/reset
 * @desc    Reset settings to default values
 * @access  Admin
 */
router.post('/reset', verifyFirebaseToken, requireAdmin, resetSettings);

module.exports = router;
