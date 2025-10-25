const { getFirestore } = require('../config/firebase.admin');
const { asyncHandler } = require('../middleware/errorHandler');

const db = getFirestore();

/**
 * @desc    Get all reports
 * @route   GET /api/moderation/reports
 * @access  Private/Admin
 */
exports.getReports = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status = 'pending',
    contentType = '',
  } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  let query = db.collection('reports');

  // Filter by status
  if (status && status !== 'all') {
    query = query.where('status', '==', status);
  }

  // Filter by content type
  if (contentType) {
    query = query.where('contentType', '==', contentType);
  }

  // Get total count
  const snapshot = await query.get();
  const total = snapshot.size;

  // Apply sorting and pagination
  const reports = [];
  const reportsSnapshot = await query
    .orderBy('createdAt', 'desc')
    .limit(limitNum)
    .offset(offset)
    .get();

  for (const doc of reportsSnapshot.docs) {
    const reportData = doc.data();

    // Get reporter info
    const reporterDoc = await db.collection('users').doc(reportData.reporterId).get();

    // Get content info
    let content = null;
    if (reportData.contentType === 'post') {
      const postDoc = await db.collection('posts').doc(reportData.contentId).get();
      if (postDoc.exists) {
        const postData = postDoc.data();
        const userDoc = await db.collection('users').doc(postData.userId).get();
        
        content = {
          id: postDoc.id,
          type: 'post',
          ...postData,
          user: userDoc.exists ? {
            id: userDoc.id,
            username: userDoc.data().username,
            photoURL: userDoc.data().photoURL,
          } : null,
        };
      }
    } else if (reportData.contentType === 'comment') {
      const commentDoc = await db.collection('comments').doc(reportData.contentId).get();
      if (commentDoc.exists) {
        const commentData = commentDoc.data();
        const userDoc = await db.collection('users').doc(commentData.userId).get();
        
        content = {
          id: commentDoc.id,
          type: 'comment',
          ...commentData,
          user: userDoc.exists ? {
            id: userDoc.id,
            username: userDoc.data().username,
            photoURL: userDoc.data().photoURL,
          } : null,
        };
      }
    } else if (reportData.contentType === 'user') {
      const userDoc = await db.collection('users').doc(reportData.contentId).get();
      if (userDoc.exists) {
        content = {
          id: userDoc.id,
          type: 'user',
          ...userDoc.data(),
        };
      }
    }

    reports.push({
      id: doc.id,
      ...reportData,
      reporter: reporterDoc.exists ? {
        id: reporterDoc.id,
        username: reporterDoc.data().username,
        photoURL: reporterDoc.data().photoURL,
      } : null,
      content,
    });
  }

  res.status(200).json({
    success: true,
    data: reports,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

/**
 * @desc    Resolve a report
 * @route   PUT /api/moderation/reports/:reportId/resolve
 * @access  Private/Admin
 */
exports.resolveReport = asyncHandler(async (req, res) => {
  const { reportId } = req.params;
  const { action, reason } = req.body;

  // action can be: 'dismiss', 'hide_content', 'ban_user', 'delete_content'

  const reportRef = db.collection('reports').doc(reportId);
  const reportDoc = await reportRef.get();

  if (!reportDoc.exists) {
    const error = new Error('Report not found');
    error.statusCode = 404;
    throw error;
  }

  const reportData = reportDoc.data();

  // Update report status
  await reportRef.update({
    status: 'resolved',
    resolvedAt: new Date(),
    resolvedBy: req.user.uid,
    action,
    actionReason: reason || '',
  });

  // Take action based on decision
  if (action === 'hide_content') {
    if (reportData.contentType === 'post') {
      await db.collection('posts').doc(reportData.contentId).update({
        hidden: true,
        hideReason: reason || 'Violates community guidelines',
        hiddenAt: new Date(),
      });
    } else if (reportData.contentType === 'comment') {
      await db.collection('comments').doc(reportData.contentId).update({
        hidden: true,
        hideReason: reason || 'Violates community guidelines',
        hiddenAt: new Date(),
      });
    }
  } else if (action === 'delete_content') {
    if (reportData.contentType === 'post') {
      await db.collection('posts').doc(reportData.contentId).delete();
    } else if (reportData.contentType === 'comment') {
      await db.collection('comments').doc(reportData.contentId).delete();
    }
  } else if (action === 'ban_user') {
    // Get userId from content
    let userId = null;
    if (reportData.contentType === 'user') {
      userId = reportData.contentId;
    } else if (reportData.contentType === 'post') {
      const postDoc = await db.collection('posts').doc(reportData.contentId).get();
      userId = postDoc.exists ? postDoc.data().userId : null;
    } else if (reportData.contentType === 'comment') {
      const commentDoc = await db.collection('comments').doc(reportData.contentId).get();
      userId = commentDoc.exists ? commentDoc.data().userId : null;
    }

    if (userId) {
      await db.collection('users').doc(userId).update({
        banned: true,
        banReason: reason || 'Violates community guidelines',
        bannedAt: new Date(),
      });
    }
  }

  res.status(200).json({
    success: true,
    message: 'Report resolved successfully',
  });
});

/**
 * @desc    Get flagged content
 * @route   GET /api/moderation/flagged
 * @access  Private/Admin
 */
exports.getFlaggedContent = asyncHandler(async (req, res) => {
  const { contentType = 'post', page = 1, limit = 20 } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  let flaggedContent = [];

  if (contentType === 'post') {
    // Get hidden posts
    const postsSnapshot = await db
      .collection('posts')
      .where('hidden', '==', true)
      .orderBy('hiddenAt', 'desc')
      .limit(limitNum)
      .offset(offset)
      .get();

    for (const doc of postsSnapshot.docs) {
      const postData = doc.data();
      const userDoc = await db.collection('users').doc(postData.userId).get();

      flaggedContent.push({
        id: doc.id,
        type: 'post',
        ...postData,
        user: userDoc.exists ? {
          id: userDoc.id,
          username: userDoc.data().username,
          photoURL: userDoc.data().photoURL,
        } : null,
      });
    }
  } else if (contentType === 'comment') {
    // Get hidden comments
    const commentsSnapshot = await db
      .collection('comments')
      .where('hidden', '==', true)
      .orderBy('hiddenAt', 'desc')
      .limit(limitNum)
      .offset(offset)
      .get();

    for (const doc of commentsSnapshot.docs) {
      const commentData = doc.data();
      const userDoc = await db.collection('users').doc(commentData.userId).get();

      flaggedContent.push({
        id: doc.id,
        type: 'comment',
        ...commentData,
        user: userDoc.exists ? {
          id: userDoc.id,
          username: userDoc.data().username,
          photoURL: userDoc.data().photoURL,
        } : null,
      });
    }
  } else if (contentType === 'user') {
    // Get banned users
    const usersSnapshot = await db
      .collection('users')
      .where('banned', '==', true)
      .orderBy('bannedAt', 'desc')
      .limit(limitNum)
      .offset(offset)
      .get();

    usersSnapshot.forEach((doc) => {
      flaggedContent.push({
        id: doc.id,
        type: 'user',
        ...doc.data(),
      });
    });
  }

  res.status(200).json({
    success: true,
    data: flaggedContent,
  });
});

/**
 * @desc    Review content (approve or reject)
 * @route   POST /api/moderation/content/:contentId/review
 * @access  Private/Admin
 */
exports.reviewContent = asyncHandler(async (req, res) => {
  const { contentId } = req.params;
  const { contentType, decision, reason } = req.body;

  // decision can be: 'approve', 'reject'

  if (!contentType || !decision) {
    const error = new Error('Please provide contentType and decision');
    error.statusCode = 400;
    throw error;
  }

  let collection = '';
  if (contentType === 'post') {
    collection = 'posts';
  } else if (contentType === 'comment') {
    collection = 'comments';
  } else if (contentType === 'user') {
    collection = 'users';
  } else {
    const error = new Error('Invalid content type');
    error.statusCode = 400;
    throw error;
  }

  const contentRef = db.collection(collection).doc(contentId);
  const contentDoc = await contentRef.get();

  if (!contentDoc.exists) {
    const error = new Error('Content not found');
    error.statusCode = 404;
    throw error;
  }

  if (decision === 'approve') {
    // Unhide/unban content
    if (contentType === 'user') {
      await contentRef.update({
        banned: false,
        banReason: null,
        bannedAt: null,
        reviewedAt: new Date(),
        reviewedBy: req.user.uid,
      });
    } else {
      await contentRef.update({
        hidden: false,
        hideReason: null,
        hiddenAt: null,
        reviewedAt: new Date(),
        reviewedBy: req.user.uid,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Content approved successfully',
    });
  } else if (decision === 'reject') {
    // Keep hidden or delete
    await contentRef.update({
      reviewedAt: new Date(),
      reviewedBy: req.user.uid,
      rejectionReason: reason || '',
    });

    res.status(200).json({
      success: true,
      message: 'Content rejected',
    });
  } else {
    const error = new Error('Invalid decision');
    error.statusCode = 400;
    throw error;
  }
});

/**
 * @desc    Get moderation statistics
 * @route   GET /api/moderation/stats
 * @access  Private/Admin
 */
exports.getModerationStats = asyncHandler(async (req, res) => {
  // Pending reports
  const pendingReportsSnapshot = await db
    .collection('reports')
    .where('status', '==', 'pending')
    .get();

  // Resolved reports
  const resolvedReportsSnapshot = await db
    .collection('reports')
    .where('status', '==', 'resolved')
    .get();

  // Hidden posts
  const hiddenPostsSnapshot = await db
    .collection('posts')
    .where('hidden', '==', true)
    .get();

  // Banned users
  const bannedUsersSnapshot = await db
    .collection('users')
    .where('banned', '==', true)
    .get();

  res.status(200).json({
    success: true,
    data: {
      pendingReports: pendingReportsSnapshot.size,
      resolvedReports: resolvedReportsSnapshot.size,
      hiddenPosts: hiddenPostsSnapshot.size,
      bannedUsers: bannedUsersSnapshot.size,
    },
  });
});
