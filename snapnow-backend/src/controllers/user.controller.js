const { getFirestore } = require('../config/firebase.admin');
const { asyncHandler } = require('../middleware/errorHandler');

const db = getFirestore();

/**
 * @desc    Get all users with pagination and filters
 * @route   GET /api/users
 * @access  Private/Admin
 */
exports.getUsers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  let query = db.collection('users');

  // Search filter
  if (search) {
    // Firestore doesn't support full-text search, so we'll use startAt/endAt for username
    query = query
      .where('username', '>=', search)
      .where('username', '<=', search + '\uf8ff');
  }

  // Get total count
  const snapshot = await query.get();
  const total = snapshot.size;

  // Apply sorting and pagination
  const users = [];
  let userQuery = query.orderBy(sortBy, sortOrder).limit(limitNum).offset(offset);

  const userSnapshot = await userQuery.get();
  
  userSnapshot.forEach((doc) => {
    users.push({
      id: doc.id,
      ...doc.data(),
    });
  });

  res.status(200).json({
    success: true,
    data: users,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

/**
 * @desc    Get user statistics
 * @route   GET /api/users/stats
 * @access  Private/Admin
 */
exports.getUserStats = asyncHandler(async (req, res) => {
  const usersRef = db.collection('users');

  // Total users
  const totalSnapshot = await usersRef.get();
  const totalUsers = totalSnapshot.size;

  // New users this month
  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  thisMonthStart.setHours(0, 0, 0, 0);

  const newUsersSnapshot = await usersRef
    .where('createdAt', '>=', thisMonthStart)
    .get();
  const newUsersThisMonth = newUsersSnapshot.size;

  // Active users (posted in last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const postsSnapshot = await db
    .collection('posts')
    .where('createdAt', '>=', sevenDaysAgo)
    .get();

  const activeUserIds = new Set();
  postsSnapshot.forEach((doc) => {
    activeUserIds.add(doc.data().userId);
  });

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      newUsersThisMonth,
      activeUsers: activeUserIds.size,
      stats: {
        totalUsers,
        newUsersThisMonth,
        activeUsers: activeUserIds.size,
        inactiveUsers: totalUsers - activeUserIds.size,
      },
    },
  });
});

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:userId
 * @access  Private/Admin
 */
exports.getUserById = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const userDoc = await db.collection('users').doc(userId).get();

  if (!userDoc.exists) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const user = {
    id: userDoc.id,
    ...userDoc.data(),
  };

  // Get user's posts count
  const postsSnapshot = await db
    .collection('posts')
    .where('userId', '==', userId)
    .get();

  // Get followers count
  const followersSnapshot = await db
    .collection('follows')
    .where('followingId', '==', userId)
    .get();

  // Get following count
  const followingSnapshot = await db
    .collection('follows')
    .where('followerId', '==', userId)
    .get();

  user.stats = {
    postsCount: postsSnapshot.size,
    followersCount: followersSnapshot.size,
    followingCount: followingSnapshot.size,
  };

  res.status(200).json({
    success: true,
    data: user,
  });
});

/**
 * @desc    Update user
 * @route   PUT /api/users/:userId
 * @access  Private/Admin
 */
exports.updateUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const updates = req.body;

  // Prevent updating sensitive fields
  delete updates.password;
  delete updates.email;

  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  await userRef.update({
    ...updates,
    updatedAt: new Date(),
  });

  const updatedUser = await userRef.get();

  res.status(200).json({
    success: true,
    data: {
      id: updatedUser.id,
      ...updatedUser.data(),
    },
  });
});

/**
 * @desc    Delete user
 * @route   DELETE /api/users/:userId
 * @access  Private/Admin
 */
exports.deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  // Delete user's posts
  const postsSnapshot = await db.collection('posts').where('userId', '==', userId).get();
  const batch = db.batch();

  postsSnapshot.forEach((doc) => {
    batch.delete(doc.ref);
  });

  // Delete user
  batch.delete(userRef);

  await batch.commit();

  res.status(200).json({
    success: true,
    message: 'User deleted successfully',
  });
});

/**
 * @desc    Ban/Unban user
 * @route   PUT /api/users/:userId/ban
 * @access  Private/Admin
 */
exports.toggleBanUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { banned, reason } = req.body;

  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  await userRef.update({
    banned: banned || false,
    banReason: reason || null,
    bannedAt: banned ? new Date() : null,
    updatedAt: new Date(),
  });

  res.status(200).json({
    success: true,
    message: banned ? 'User banned successfully' : 'User unbanned successfully',
  });
});

/**
 * @desc    Get user's posts
 * @route   GET /api/users/:userId/posts
 * @access  Private/Admin
 */
exports.getUserPosts = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  const postsSnapshot = await db
    .collection('posts')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(limitNum)
    .offset(offset)
    .get();

  const posts = [];
  postsSnapshot.forEach((doc) => {
    posts.push({
      id: doc.id,
      ...doc.data(),
    });
  });

  res.status(200).json({
    success: true,
    data: posts,
  });
});

/**
 * @desc    Get user's activity log
 * @route   GET /api/users/:userId/activity
 * @access  Private/Admin
 */
exports.getUserActivity = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // This is a placeholder - you would implement activity logging separately
  res.status(200).json({
    success: true,
    data: [],
    message: 'Activity logging not yet implemented',
  });
});

/**
 * @desc    Update user status (active/banned)
 * @route   PATCH /api/users/:userId/status
 * @access  Private/Admin
 */
exports.updateUserStatus = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { status, reason } = req.body;

  if (!['active', 'banned'].includes(status)) {
    const error = new Error('Invalid status. Must be "active" or "banned"');
    error.statusCode = 400;
    throw error;
  }

  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const updateData = {
    status,
    updatedAt: new Date(),
  };

  if (status === 'banned') {
    updateData.banned = true;
    updateData.banReason = reason || 'No reason provided';
    updateData.bannedAt = new Date();
  } else {
    updateData.banned = false;
    updateData.banReason = null;
    updateData.bannedAt = null;
  }

  await userRef.update(updateData);

  res.status(200).json({
    success: true,
    message: `User status updated to ${status}`,
    data: { userId, status },
  });
});

/**
 * @desc    Update user role
 * @route   PATCH /api/users/:userId/role
 * @access  Private/Admin
 */
exports.updateUserRole = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;

  if (!['user', 'admin'].includes(role)) {
    const error = new Error('Invalid role. Must be "user" or "admin"');
    error.statusCode = 400;
    throw error;
  }

  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  await userRef.update({
    role,
    isAdmin: role === 'admin',
    updatedAt: new Date(),
  });

  res.status(200).json({
    success: true,
    message: `User role updated to ${role}`,
    data: { userId, role },
  });
});
