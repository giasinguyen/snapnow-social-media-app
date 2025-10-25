const { getFirestore } = require('../config/firebase.admin');
const { asyncHandler } = require('../middleware/errorHandler');

const db = getFirestore();

/**
 * @desc    Get dashboard overview analytics
 * @route   GET /api/analytics/overview
 * @access  Private/Admin
 */
exports.getOverview = asyncHandler(async (req, res) => {
  // Total users
  const usersSnapshot = await db.collection('users').get();
  const totalUsers = usersSnapshot.size;

  // Total posts
  const postsSnapshot = await db.collection('posts').get();
  const totalPosts = postsSnapshot.size;

  // Total likes
  const likesSnapshot = await db.collection('likes').get();
  const totalLikes = likesSnapshot.size;

  // Total comments
  const commentsSnapshot = await db.collection('comments').get();
  const totalComments = commentsSnapshot.size;

  // New users this month
  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  thisMonthStart.setHours(0, 0, 0, 0);

  const newUsersSnapshot = await db
    .collection('users')
    .where('createdAt', '>=', thisMonthStart)
    .get();
  const newUsersThisMonth = newUsersSnapshot.size;

  // New posts this month
  const newPostsSnapshot = await db
    .collection('posts')
    .where('createdAt', '>=', thisMonthStart)
    .get();
  const newPostsThisMonth = newPostsSnapshot.size;

  // Active users (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentPostsSnapshot = await db
    .collection('posts')
    .where('createdAt', '>=', sevenDaysAgo)
    .get();

  const activeUserIds = new Set();
  recentPostsSnapshot.forEach((doc) => {
    activeUserIds.add(doc.data().userId);
  });

  res.status(200).json({
    success: true,
    data: {
      users: {
        total: totalUsers,
        newThisMonth: newUsersThisMonth,
        active: activeUserIds.size,
      },
      posts: {
        total: totalPosts,
        newThisMonth: newPostsThisMonth,
      },
      engagement: {
        totalLikes,
        totalComments,
        averageLikesPerPost: totalPosts > 0 ? (totalLikes / totalPosts).toFixed(2) : 0,
        averageCommentsPerPost: totalPosts > 0 ? (totalComments / totalPosts).toFixed(2) : 0,
      },
    },
  });
});

/**
 * @desc    Get user analytics
 * @route   GET /api/analytics/users
 * @access  Private/Admin
 */
exports.getUserAnalytics = asyncHandler(async (req, res) => {
  const { period = '30' } = req.query; // days

  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - parseInt(period));

  // New users over time
  const usersSnapshot = await db
    .collection('users')
    .where('createdAt', '>=', daysAgo)
    .orderBy('createdAt', 'asc')
    .get();

  // Group by day
  const usersByDay = {};
  usersSnapshot.forEach((doc) => {
    const date = doc.data().createdAt.toDate();
    const dateKey = date.toISOString().split('T')[0];
    usersByDay[dateKey] = (usersByDay[dateKey] || 0) + 1;
  });

  // User activity (posts)
  const postsSnapshot = await db
    .collection('posts')
    .where('createdAt', '>=', daysAgo)
    .get();

  const userPostCounts = {};
  postsSnapshot.forEach((doc) => {
    const userId = doc.data().userId;
    userPostCounts[userId] = (userPostCounts[userId] || 0) + 1;
  });

  // Top active users
  const topUsers = Object.entries(userPostCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  const topUsersData = [];
  for (const [userId, postsCount] of topUsers) {
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      topUsersData.push({
        id: userId,
        username: userDoc.data().username,
        photoURL: userDoc.data().photoURL,
        postsCount,
      });
    }
  }

  res.status(200).json({
    success: true,
    data: {
      newUsersByDay: usersByDay,
      topActiveUsers: topUsersData,
      totalNewUsers: usersSnapshot.size,
    },
  });
});

/**
 * @desc    Get post analytics
 * @route   GET /api/analytics/posts
 * @access  Private/Admin
 */
exports.getPostAnalytics = asyncHandler(async (req, res) => {
  const { period = '30' } = req.query;

  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - parseInt(period));

  // Posts over time
  const postsSnapshot = await db
    .collection('posts')
    .where('createdAt', '>=', daysAgo)
    .orderBy('createdAt', 'asc')
    .get();

  const postsByDay = {};
  postsSnapshot.forEach((doc) => {
    const date = doc.data().createdAt.toDate();
    const dateKey = date.toISOString().split('T')[0];
    postsByDay[dateKey] = (postsByDay[dateKey] || 0) + 1;
  });

  // Top posts by likes
  const allPosts = [];
  const allPostsSnapshot = await db
    .collection('posts')
    .where('createdAt', '>=', daysAgo)
    .get();

  for (const doc of allPostsSnapshot.docs) {
    const likesSnapshot = await db
      .collection('likes')
      .where('postId', '==', doc.id)
      .get();

    const commentsSnapshot = await db
      .collection('comments')
      .where('postId', '==', doc.id)
      .get();

    allPosts.push({
      id: doc.id,
      ...doc.data(),
      likesCount: likesSnapshot.size,
      commentsCount: commentsSnapshot.size,
    });
  }

  const topPosts = allPosts
    .sort((a, b) => b.likesCount - a.likesCount)
    .slice(0, 10);

  res.status(200).json({
    success: true,
    data: {
      postsByDay,
      topPosts,
      totalPosts: postsSnapshot.size,
    },
  });
});

/**
 * @desc    Get engagement analytics
 * @route   GET /api/analytics/engagement
 * @access  Private/Admin
 */
exports.getEngagementAnalytics = asyncHandler(async (req, res) => {
  const { period = '30' } = req.query;

  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - parseInt(period));

  // Likes over time
  const likesSnapshot = await db
    .collection('likes')
    .where('createdAt', '>=', daysAgo)
    .orderBy('createdAt', 'asc')
    .get();

  const likesByDay = {};
  likesSnapshot.forEach((doc) => {
    const date = doc.data().createdAt.toDate();
    const dateKey = date.toISOString().split('T')[0];
    likesByDay[dateKey] = (likesByDay[dateKey] || 0) + 1;
  });

  // Comments over time
  const commentsSnapshot = await db
    .collection('comments')
    .where('createdAt', '>=', daysAgo)
    .orderBy('createdAt', 'asc')
    .get();

  const commentsByDay = {};
  commentsSnapshot.forEach((doc) => {
    const date = doc.data().createdAt.toDate();
    const dateKey = date.toISOString().split('T')[0];
    commentsByDay[dateKey] = (commentsByDay[dateKey] || 0) + 1;
  });

  // Follows over time
  const followsSnapshot = await db
    .collection('follows')
    .where('createdAt', '>=', daysAgo)
    .orderBy('createdAt', 'asc')
    .get();

  const followsByDay = {};
  followsSnapshot.forEach((doc) => {
    const date = doc.data().createdAt.toDate();
    const dateKey = date.toISOString().split('T')[0];
    followsByDay[dateKey] = (followsByDay[dateKey] || 0) + 1;
  });

  res.status(200).json({
    success: true,
    data: {
      likesByDay,
      commentsByDay,
      followsByDay,
      totals: {
        likes: likesSnapshot.size,
        comments: commentsSnapshot.size,
        follows: followsSnapshot.size,
      },
    },
  });
});

/**
 * @desc    Get trending content
 * @route   GET /api/analytics/trending
 * @access  Private/Admin
 */
exports.getTrendingContent = asyncHandler(async (req, res) => {
  const { period = '7' } = req.query;

  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - parseInt(period));

  // Get recent posts
  const postsSnapshot = await db
    .collection('posts')
    .where('createdAt', '>=', daysAgo)
    .get();

  const posts = [];
  for (const doc of postsSnapshot.docs) {
    const postData = doc.data();

    // Get engagement metrics
    const likesSnapshot = await db
      .collection('likes')
      .where('postId', '==', doc.id)
      .where('createdAt', '>=', daysAgo)
      .get();

    const commentsSnapshot = await db
      .collection('comments')
      .where('postId', '==', doc.id)
      .where('createdAt', '>=', daysAgo)
      .get();

    // Calculate engagement score (simple formula)
    const engagementScore = (likesSnapshot.size * 1) + (commentsSnapshot.size * 2);

    if (engagementScore > 0) {
      // Get user info
      const userDoc = await db.collection('users').doc(postData.userId).get();

      posts.push({
        id: doc.id,
        ...postData,
        user: userDoc.exists ? {
          id: userDoc.id,
          username: userDoc.data().username,
          photoURL: userDoc.data().photoURL,
        } : null,
        likesCount: likesSnapshot.size,
        commentsCount: commentsSnapshot.size,
        engagementScore,
      });
    }
  }

  // Sort by engagement score
  const trendingPosts = posts
    .sort((a, b) => b.engagementScore - a.engagementScore)
    .slice(0, 20);

  res.status(200).json({
    success: true,
    data: {
      trendingPosts,
    },
  });
});

/**
 * @desc    Get user retention analytics
 * @route   GET /api/analytics/retention
 * @access  Private/Admin
 */
exports.getRetentionAnalytics = asyncHandler(async (req, res) => {
  // Get all users
  const usersSnapshot = await db.collection('users').get();
  const totalUsers = usersSnapshot.size;

  // Daily active users (last 24 hours)
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const dailyActivePosts = await db
    .collection('posts')
    .where('createdAt', '>=', oneDayAgo)
    .get();

  const dailyActiveUsers = new Set();
  dailyActivePosts.forEach((doc) => {
    dailyActiveUsers.add(doc.data().userId);
  });

  // Weekly active users (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const weeklyActivePosts = await db
    .collection('posts')
    .where('createdAt', '>=', sevenDaysAgo)
    .get();

  const weeklyActiveUsers = new Set();
  weeklyActivePosts.forEach((doc) => {
    weeklyActiveUsers.add(doc.data().userId);
  });

  // Monthly active users (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const monthlyActivePosts = await db
    .collection('posts')
    .where('createdAt', '>=', thirtyDaysAgo)
    .get();

  const monthlyActiveUsers = new Set();
  monthlyActivePosts.forEach((doc) => {
    monthlyActiveUsers.add(doc.data().userId);
  });

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      dailyActiveUsers: dailyActiveUsers.size,
      weeklyActiveUsers: weeklyActiveUsers.size,
      monthlyActiveUsers: monthlyActiveUsers.size,
      retentionRates: {
        daily: totalUsers > 0 ? ((dailyActiveUsers.size / totalUsers) * 100).toFixed(2) : 0,
        weekly: totalUsers > 0 ? ((weeklyActiveUsers.size / totalUsers) * 100).toFixed(2) : 0,
        monthly: totalUsers > 0 ? ((monthlyActiveUsers.size / totalUsers) * 100).toFixed(2) : 0,
      },
    },
  });
});
