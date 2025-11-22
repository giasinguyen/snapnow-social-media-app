const { getFirestore } = require('../config/firebase.admin');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Get trending hashtags
 * @route   GET /api/trends/hashtags
 * @access  Private/Admin
 */
exports.getTrendingHashtags = asyncHandler(async (req, res) => {
  const db = getFirestore();
  const { limit = 10 } = req.query;

  // TODO: Implement hashtag tracking
  // For now, return empty array
  res.status(200).json({
    success: true,
    data: {
      hashtags: [],
    },
  });
});

/**
 * @desc    Get top posts
 * @route   GET /api/trends/posts
 * @access  Private/Admin
 */
exports.getTopPosts = asyncHandler(async (req, res) => {
  const db = getFirestore();
  const { limit = 10, days = 7 } = req.query;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  const snapshot = await db
    .collection('posts')
    .where('createdAt', '>=', startDate)
    .orderBy('createdAt', 'desc')
    .limit(parseInt(limit))
    .get();

  const posts = await Promise.all(
    snapshot.docs.map(async (doc) => {
      const postData = doc.data();
      
      // Get likes count
      const likesSnap = await db
        .collection('likes')
        .where('postId', '==', doc.id)
        .count()
        .get();
      
      // Get comments count
      const commentsSnap = await db
        .collection('comments')
        .where('postId', '==', doc.id)
        .count()
        .get();

      return {
        id: doc.id,
        ...postData,
        likesCount: likesSnap.data().count,
        commentsCount: commentsSnap.data().count,
      };
    })
  );

  // Sort by engagement (likes + comments)
  posts.sort((a, b) => {
    const aEngagement = (a.likesCount || 0) + (a.commentsCount || 0);
    const bEngagement = (b.likesCount || 0) + (b.commentsCount || 0);
    return bEngagement - aEngagement;
  });

  res.status(200).json({
    success: true,
    data: {
      posts: posts.slice(0, parseInt(limit)),
    },
  });
});

/**
 * @desc    Get fastest growing users
 * @route   GET /api/trends/users
 * @access  Private/Admin
 */
exports.getFastestGrowingUsers = asyncHandler(async (req, res) => {
  const db = getFirestore();
  const { limit = 10, days = 7 } = req.query;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  // Get recent follows
  const followsSnapshot = await db
    .collection('follows')
    .where('createdAt', '>=', startDate)
    .get();

  // Count followers per user
  const followerCounts = {};
  followsSnapshot.docs.forEach((doc) => {
    const data = doc.data();
    if (!followerCounts[data.followingId]) {
      followerCounts[data.followingId] = 0;
    }
    followerCounts[data.followingId]++;
  });

  // Get top users
  const sortedUsers = Object.entries(followerCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, parseInt(limit));

  // Fetch user details
  const users = await Promise.all(
    sortedUsers.map(async ([userId, newFollowers]) => {
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) return null;

      return {
        id: userId,
        ...userDoc.data(),
        newFollowers,
      };
    })
  );

  res.status(200).json({
    success: true,
    data: {
      users: users.filter(Boolean),
    },
  });
});
