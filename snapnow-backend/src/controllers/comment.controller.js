const { getFirestore } = require('../config/firebase.admin');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Get all comments with pagination
 * @route   GET /api/comments
 * @access  Private/Admin
 */
exports.getComments = asyncHandler(async (req, res) => {
  const db = getFirestore();
  const { page = 1, limit = 20, postId = null } = req.query;

  let query = db.collection('comments');

  // Filter by post
  if (postId) {
    query = query.where('postId', '==', postId);
  }

  // Sort by newest first
  query = query.orderBy('createdAt', 'desc');

  // Get total count
  const totalSnapshot = await query.count().get();
  const total = totalSnapshot.data().count;

  // Apply pagination
  const offset = (page - 1) * limit;
  const snapshot = await query.limit(parseInt(limit)).offset(offset).get();

  const comments = [];
  for (const doc of snapshot.docs) {
    const commentData = doc.data();
    
    // Fetch user info
    let user = null;
    if (commentData.userId) {
      const userDoc = await db.collection('users').doc(commentData.userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        user = {
          id: userDoc.id,
          username: userData.username,
          profileImage: userData.profileImage,
        };
      }
    }

    comments.push({
      id: doc.id,
      ...commentData,
      user,
    });
  }

  res.json({
    comments,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

/**
 * @desc    Delete comment
 * @route   DELETE /api/comments/:commentId
 * @access  Private/Admin
 */
exports.deleteComment = asyncHandler(async (req, res) => {
  const db = getFirestore();
  const { commentId } = req.params;

  const commentRef = db.collection('comments').doc(commentId);
  const commentDoc = await commentRef.get();

  if (!commentDoc.exists) {
    return res.status(404).json({ message: 'Comment not found' });
  }

  await commentRef.delete();

  res.json({ message: 'Comment deleted successfully' });
});

/**
 * @desc    Get comment stats
 * @route   GET /api/comments/stats
 * @access  Private/Admin
 */
exports.getCommentStats = asyncHandler(async (req, res) => {
  const db = getFirestore();

  const totalSnapshot = await db.collection('comments').count().get();
  const total = totalSnapshot.data().count;

  // Get comments from last 24 hours
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  const recentSnapshot = await db.collection('comments')
    .where('createdAt', '>=', yesterday)
    .count()
    .get();
  const recent = recentSnapshot.data().count;

  res.json({
    total,
    last24Hours: recent,
  });
});
