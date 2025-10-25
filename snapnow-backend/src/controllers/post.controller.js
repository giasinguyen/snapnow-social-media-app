const { getFirestore } = require('../config/firebase.admin');
const { asyncHandler } = require('../middleware/errorHandler');

const db = getFirestore();

/**
 * @desc    Get all posts with pagination and filters
 * @route   GET /api/posts
 * @access  Private/Admin
 */
exports.getPosts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    userId = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  let query = db.collection('posts');

  // Filter by user
  if (userId) {
    query = query.where('userId', '==', userId);
  }

  // Get total count
  const snapshot = await query.get();
  const total = snapshot.size;

  // Apply sorting and pagination
  const posts = [];
  const postsSnapshot = await query
    .orderBy(sortBy, sortOrder)
    .limit(limitNum)
    .offset(offset)
    .get();

  for (const doc of postsSnapshot.docs) {
    const postData = doc.data();
    
    // Get user info
    const userDoc = await db.collection('users').doc(postData.userId).get();
    const userData = userDoc.exists ? userDoc.data() : null;

    // Get likes count
    const likesSnapshot = await db
      .collection('likes')
      .where('postId', '==', doc.id)
      .get();

    // Get comments count
    const commentsSnapshot = await db
      .collection('comments')
      .where('postId', '==', doc.id)
      .get();

    posts.push({
      id: doc.id,
      ...postData,
      user: userData ? {
        id: userDoc.id,
        username: userData.username,
        photoURL: userData.photoURL,
      } : null,
      likesCount: likesSnapshot.size,
      commentsCount: commentsSnapshot.size,
    });
  }

  res.status(200).json({
    success: true,
    data: posts,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

/**
 * @desc    Get post statistics
 * @route   GET /api/posts/stats
 * @access  Private/Admin
 */
exports.getPostStats = asyncHandler(async (req, res) => {
  const postsRef = db.collection('posts');

  // Total posts
  const totalSnapshot = await postsRef.get();
  const totalPosts = totalSnapshot.size;

  // Posts this month
  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  thisMonthStart.setHours(0, 0, 0, 0);

  const newPostsSnapshot = await postsRef
    .where('createdAt', '>=', thisMonthStart)
    .get();
  const postsThisMonth = newPostsSnapshot.size;

  // Hidden posts
  const hiddenPostsSnapshot = await postsRef
    .where('hidden', '==', true)
    .get();
  const hiddenPosts = hiddenPostsSnapshot.size;

  // Posts with reports
  const reportsSnapshot = await db.collection('reports').get();
  const reportedPostIds = new Set();
  reportsSnapshot.forEach((doc) => {
    if (doc.data().contentType === 'post') {
      reportedPostIds.add(doc.data().contentId);
    }
  });

  res.status(200).json({
    success: true,
    data: {
      totalPosts,
      postsThisMonth,
      hiddenPosts,
      reportedPosts: reportedPostIds.size,
      activePosts: totalPosts - hiddenPosts,
    },
  });
});

/**
 * @desc    Get post by ID
 * @route   GET /api/posts/:postId
 * @access  Private/Admin
 */
exports.getPostById = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const postDoc = await db.collection('posts').doc(postId).get();

  if (!postDoc.exists) {
    const error = new Error('Post not found');
    error.statusCode = 404;
    throw error;
  }

  const postData = postDoc.data();

  // Get user info
  const userDoc = await db.collection('users').doc(postData.userId).get();
  const userData = userDoc.exists ? userDoc.data() : null;

  // Get likes
  const likesSnapshot = await db
    .collection('likes')
    .where('postId', '==', postId)
    .get();

  // Get comments
  const commentsSnapshot = await db
    .collection('comments')
    .where('postId', '==', postId)
    .orderBy('createdAt', 'desc')
    .get();

  const comments = [];
  for (const doc of commentsSnapshot.docs) {
    const commentData = doc.data();
    const commentUserDoc = await db.collection('users').doc(commentData.userId).get();
    
    comments.push({
      id: doc.id,
      ...commentData,
      user: commentUserDoc.exists ? {
        id: commentUserDoc.id,
        username: commentUserDoc.data().username,
        photoURL: commentUserDoc.data().photoURL,
      } : null,
    });
  }

  // Get reports
  const reportsSnapshot = await db
    .collection('reports')
    .where('contentId', '==', postId)
    .where('contentType', '==', 'post')
    .get();

  const reports = [];
  reportsSnapshot.forEach((doc) => {
    reports.push({
      id: doc.id,
      ...doc.data(),
    });
  });

  res.status(200).json({
    success: true,
    data: {
      id: postDoc.id,
      ...postData,
      user: userData ? {
        id: userDoc.id,
        username: userData.username,
        photoURL: userData.photoURL,
        displayName: userData.displayName,
      } : null,
      likesCount: likesSnapshot.size,
      commentsCount: commentsSnapshot.size,
      comments,
      reports,
    },
  });
});

/**
 * @desc    Delete post
 * @route   DELETE /api/posts/:postId
 * @access  Private/Admin
 */
exports.deletePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const postRef = db.collection('posts').doc(postId);
  const postDoc = await postRef.get();

  if (!postDoc.exists) {
    const error = new Error('Post not found');
    error.statusCode = 404;
    throw error;
  }

  // Delete associated data in batch
  const batch = db.batch();

  // Delete post
  batch.delete(postRef);

  // Delete likes
  const likesSnapshot = await db.collection('likes').where('postId', '==', postId).get();
  likesSnapshot.forEach((doc) => {
    batch.delete(doc.ref);
  });

  // Delete comments
  const commentsSnapshot = await db.collection('comments').where('postId', '==', postId).get();
  commentsSnapshot.forEach((doc) => {
    batch.delete(doc.ref);
  });

  // Delete bookmarks
  const bookmarksSnapshot = await db.collection('bookmarks').where('postId', '==', postId).get();
  bookmarksSnapshot.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();

  res.status(200).json({
    success: true,
    message: 'Post deleted successfully',
  });
});

/**
 * @desc    Hide/Unhide post
 * @route   PUT /api/posts/:postId/hide
 * @access  Private/Admin
 */
exports.toggleHidePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { hidden, reason } = req.body;

  const postRef = db.collection('posts').doc(postId);
  const postDoc = await postRef.get();

  if (!postDoc.exists) {
    const error = new Error('Post not found');
    error.statusCode = 404;
    throw error;
  }

  await postRef.update({
    hidden: hidden || false,
    hideReason: reason || null,
    hiddenAt: hidden ? new Date() : null,
    updatedAt: new Date(),
  });

  res.status(200).json({
    success: true,
    message: hidden ? 'Post hidden successfully' : 'Post unhidden successfully',
  });
});

/**
 * @desc    Get post comments
 * @route   GET /api/posts/:postId/comments
 * @access  Private/Admin
 */
exports.getPostComments = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  const commentsSnapshot = await db
    .collection('comments')
    .where('postId', '==', postId)
    .orderBy('createdAt', 'desc')
    .limit(limitNum)
    .offset(offset)
    .get();

  const comments = [];
  for (const doc of commentsSnapshot.docs) {
    const commentData = doc.data();
    const userDoc = await db.collection('users').doc(commentData.userId).get();
    
    comments.push({
      id: doc.id,
      ...commentData,
      user: userDoc.exists ? {
        id: userDoc.id,
        username: userDoc.data().username,
        photoURL: userDoc.data().photoURL,
      } : null,
    });
  }

  res.status(200).json({
    success: true,
    data: comments,
  });
});

/**
 * @desc    Get reported posts
 * @route   GET /api/posts/reported
 * @access  Private/Admin
 */
exports.getReportedPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  // Get all post reports
  const reportsSnapshot = await db
    .collection('reports')
    .where('contentType', '==', 'post')
    .where('status', '==', 'pending')
    .orderBy('createdAt', 'desc')
    .limit(limitNum)
    .offset(offset)
    .get();

  const reportedPosts = [];
  const processedPostIds = new Set();

  for (const reportDoc of reportsSnapshot.docs) {
    const reportData = reportDoc.data();
    const postId = reportData.contentId;

    // Skip if already processed this post
    if (processedPostIds.has(postId)) {
      continue;
    }
    processedPostIds.add(postId);

    // Get post
    const postDoc = await db.collection('posts').doc(postId).get();
    if (!postDoc.exists) continue;

    const postData = postDoc.data();

    // Get user
    const userDoc = await db.collection('users').doc(postData.userId).get();

    // Get all reports for this post
    const allReportsSnapshot = await db
      .collection('reports')
      .where('contentId', '==', postId)
      .where('contentType', '==', 'post')
      .get();

    reportedPosts.push({
      id: postDoc.id,
      ...postData,
      user: userDoc.exists ? {
        id: userDoc.id,
        username: userDoc.data().username,
        photoURL: userDoc.data().photoURL,
      } : null,
      reportsCount: allReportsSnapshot.size,
    });
  }

  res.status(200).json({
    success: true,
    data: reportedPosts,
  });
});
