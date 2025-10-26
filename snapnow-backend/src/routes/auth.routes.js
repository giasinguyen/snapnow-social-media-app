const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');

/**
 * @route   POST /api/auth/login
 * @desc    Dashboard admin login
 * @access  Public
 */
router.post('/login', authController.login);

/**
 * @route   POST /api/auth/register
 * @desc    Register new dashboard admin
 * @access  Public (should be protected in production)
 */
router.post('/register', authController.register);

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged in admin
 * @access  Private
 */
router.get('/me', verifyToken, authController.getMe);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh JWT token
 * @access  Private
 */
router.post('/refresh', verifyToken, authController.refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout dashboard admin
 * @access  Private
 */
router.post('/logout', verifyToken, authController.logout);

module.exports = router;
