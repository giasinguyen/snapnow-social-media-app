const jwt = require('jsonwebtoken');
const { getAuth } = require('../config/firebase.admin');
const { asyncHandler } = require('./errorHandler');

/**
 * Verify JWT token for dashboard admin
 */
const verifyToken = asyncHandler(async (req, res, next) => {
  let token;

  // Get token from header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    const error = new Error('Not authorized, no token provided');
    error.statusCode = 401;
    throw error;
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    error.statusCode = 401;
    throw error;
  }
});

/**
 * Verify Firebase ID token (for mobile app users)
 */
const verifyFirebaseToken = asyncHandler(async (req, res, next) => {
  let token;

  // Get token from header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    const error = new Error('Not authorized, no token provided');
    error.statusCode = 401;
    throw error;
  }

  try {
    // Verify Firebase ID token
    const decodedToken = await getAuth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    error.statusCode = 401;
    error.message = 'Invalid or expired Firebase token';
    throw error;
  }
});

/**
 * Check if user is admin
 */
const requireAdmin = asyncHandler(async (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    const error = new Error('Access denied. Admin privileges required.');
    error.statusCode = 403;
    throw error;
  }
  next();
});

module.exports = {
  verifyToken,
  verifyFirebaseToken,
  requireAdmin,
};
