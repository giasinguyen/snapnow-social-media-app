const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getFirestore } = require('../config/firebase.admin');
const { asyncHandler } = require('../middleware/errorHandler');

const db = getFirestore();

/**
 * Generate JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      uid: user.uid,
      email: user.email,
      isAdmin: user.isAdmin || false,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    }
  );
};

/**
 * @desc    Login dashboard admin
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    const error = new Error('Please provide email and password');
    error.statusCode = 400;
    throw error;
  }

  // Get admin from Firestore
  const adminsRef = db.collection('admins');
  const snapshot = await adminsRef.where('email', '==', email).limit(1).get();

  if (snapshot.empty) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  const adminDoc = snapshot.docs[0];
  const admin = { uid: adminDoc.id, ...adminDoc.data() };

  // Check password
  const isMatch = await bcrypt.compare(password, admin.password);

  if (!isMatch) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  // Check if admin is active
  if (admin.isActive === false) {
    const error = new Error('Account has been deactivated');
    error.statusCode = 403;
    throw error;
  }

  // Update last login
  await adminsRef.doc(adminDoc.id).update({
    lastLogin: new Date(),
  });

  // Generate token
  const token = generateToken(admin);

  res.status(200).json({
    success: true,
    data: {
      uid: admin.uid,
      email: admin.email,
      displayName: admin.displayName,
      role: admin.role || 'admin',
      token,
    },
  });
});

/**
 * @desc    Register new dashboard admin
 * @route   POST /api/auth/register
 * @access  Public (should be protected in production)
 */
exports.register = asyncHandler(async (req, res) => {
  const { email, password, displayName } = req.body;

  if (!email || !password || !displayName) {
    const error = new Error('Please provide all required fields');
    error.statusCode = 400;
    throw error;
  }

  // Check if admin already exists
  const adminsRef = db.collection('admins');
  const existingAdmin = await adminsRef.where('email', '==', email).limit(1).get();

  if (!existingAdmin.empty) {
    const error = new Error('Admin with this email already exists');
    error.statusCode = 400;
    throw error;
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create admin
  const adminData = {
    email,
    password: hashedPassword,
    displayName,
    role: 'admin',
    isAdmin: true,
    isActive: true,
    createdAt: new Date(),
    lastLogin: null,
  };

  const docRef = await adminsRef.add(adminData);

  // Generate token
  const admin = { uid: docRef.id, ...adminData };
  const token = generateToken(admin);

  res.status(201).json({
    success: true,
    data: {
      uid: docRef.id,
      email: admin.email,
      displayName: admin.displayName,
      role: admin.role,
      token,
    },
  });
});

/**
 * @desc    Get current logged in admin
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = asyncHandler(async (req, res) => {
  const adminDoc = await db.collection('admins').doc(req.user.uid).get();

  if (!adminDoc.exists) {
    const error = new Error('Admin not found');
    error.statusCode = 404;
    throw error;
  }

  const admin = adminDoc.data();

  res.status(200).json({
    success: true,
    data: {
      uid: adminDoc.id,
      email: admin.email,
      displayName: admin.displayName,
      role: admin.role,
      lastLogin: admin.lastLogin,
    },
  });
});

/**
 * @desc    Refresh JWT token
 * @route   POST /api/auth/refresh
 * @access  Private
 */
exports.refreshToken = asyncHandler(async (req, res) => {
  const adminDoc = await db.collection('admins').doc(req.user.uid).get();

  if (!adminDoc.exists) {
    const error = new Error('Admin not found');
    error.statusCode = 404;
    throw error;
  }

  const admin = { uid: adminDoc.id, ...adminDoc.data() };
  const token = generateToken(admin);

  res.status(200).json({
    success: true,
    data: { token },
  });
});

/**
 * @desc    Logout dashboard admin
 * @route   POST /api/auth/logout
 * @access  Private
 */
exports.logout = asyncHandler(async (req, res) => {
  // In a stateless JWT setup, logout is handled on the client side
  // by removing the token. Here we can optionally log the logout event.

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});
