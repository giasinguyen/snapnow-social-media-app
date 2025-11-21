const { getFirestore } = require('../config/firebase.admin');

/**
 * Analytics Service
 * Handles all analytics-related operations using Firebase Admin SDK
 */

class AnalyticsService {
  constructor() {
    this.db = getFirestore();
  }

  /**
   * Get total counts (users, posts, likes, comments, follows)
   */
  async getTotalCounts() {
    try {
      const [usersSnap, postsSnap, likesSnap, commentsSnap, followsSnap] = await Promise.all([
        this.db.collection('users').count().get(),
        this.db.collection('posts').count().get(),
        this.db.collection('likes').count().get(),
        this.db.collection('comments').count().get(),
        this.db.collection('follows').count().get(),
      ]);

      return {
        totalUsers: usersSnap.data().count,
        totalPosts: postsSnap.data().count,
        totalLikes: likesSnap.data().count,
        totalComments: commentsSnap.data().count,
        totalFollows: followsSnap.data().count,
      };
    } catch (error) {
      console.error('Error getting total counts:', error);
      throw error;
    }
  }

  /**
   * Get user growth data (last 30 days)
   */
  async getUserGrowth(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const snapshot = await this.db
        .collection('users')
        .where('createdAt', '>=', startDate)
        .orderBy('createdAt', 'asc')
        .get();

      // Group by date
      const growthData = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        const date = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
        const dateKey = date.toISOString().split('T')[0];
        
        if (!growthData[dateKey]) {
          growthData[dateKey] = 0;
        }
        growthData[dateKey]++;
      });

      // Convert to array format
      return Object.keys(growthData).map(date => ({
        date,
        count: growthData[date],
      }));
    } catch (error) {
      console.error('Error getting user growth:', error);
      throw error;
    }
  }

  /**
   * Get post activity data (last 30 days)
   */
  async getPostActivity(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const snapshot = await this.db
        .collection('posts')
        .where('createdAt', '>=', startDate)
        .orderBy('createdAt', 'asc')
        .get();

      const activityData = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        const date = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
        const dateKey = date.toISOString().split('T')[0];
        
        if (!activityData[dateKey]) {
          activityData[dateKey] = 0;
        }
        activityData[dateKey]++;
      });

      return Object.keys(activityData).map(date => ({
        date,
        count: activityData[date],
      }));
    } catch (error) {
      console.error('Error getting post activity:', error);
      throw error;
    }
  }

  /**
   * Get engagement metrics
   */
  async getEngagementMetrics() {
    try {
      const [postsSnap, likesSnap, commentsSnap] = await Promise.all([
        this.db.collection('posts').count().get(),
        this.db.collection('likes').count().get(),
        this.db.collection('comments').count().get(),
      ]);

      const totalPosts = postsSnap.data().count;
      const totalLikes = likesSnap.data().count;
      const totalComments = commentsSnap.data().count;

      return {
        totalEngagements: totalLikes + totalComments,
        avgLikesPerPost: totalPosts > 0 ? parseFloat((totalLikes / totalPosts).toFixed(2)) : 0,
        avgCommentsPerPost: totalPosts > 0 ? parseFloat((totalComments / totalPosts).toFixed(2)) : 0,
        engagementRate: totalPosts > 0 ? parseFloat((((totalLikes + totalComments) / totalPosts) * 100).toFixed(2)) : 0,
      };
    } catch (error) {
      console.error('Error getting engagement metrics:', error);
      throw error;
    }
  }

  /**
   * Get top users by followers
   */
  async getTopUsers(limit = 10) {
    try {
      const snapshot = await this.db
        .collection('users')
        .orderBy('followersCount', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error getting top users:', error);
      throw error;
    }
  }

  /**
   * Get top posts by likes
   */
  async getTopPosts(limit = 10) {
    try {
      const snapshot = await this.db
        .collection('posts')
        .orderBy('likes', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error getting top posts:', error);
      throw error;
    }
  }

  /**
   * Get recent activity
   */
  async getRecentActivity(limit = 20) {
    try {
      const [posts, comments, likes] = await Promise.all([
        this.db.collection('posts').orderBy('createdAt', 'desc').limit(limit).get(),
        this.db.collection('comments').orderBy('createdAt', 'desc').limit(limit).get(),
        this.db.collection('likes').orderBy('createdAt', 'desc').limit(limit).get(),
      ]);

      const activities = [];

      posts.forEach(doc => {
        const data = doc.data();
        activities.push({
          type: 'post',
          id: doc.id,
          userId: data.userId,
          username: data.username,
          createdAt: data.createdAt,
          data,
        });
      });

      comments.forEach(doc => {
        const data = doc.data();
        activities.push({
          type: 'comment',
          id: doc.id,
          userId: data.userId,
          username: data.username,
          createdAt: data.createdAt,
          data,
        });
      });

      likes.forEach(doc => {
        const data = doc.data();
        activities.push({
          type: 'like',
          id: doc.id,
          userId: data.userId,
          createdAt: data.createdAt,
          data,
        });
      });

      // Sort by createdAt
      return activities.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB - dateA;
      }).slice(0, limit);
    } catch (error) {
      console.error('Error getting recent activity:', error);
      throw error;
    }
  }

  /**
   * Get dashboard overview
   */
  async getDashboardOverview() {
    try {
      const [counts, engagement] = await Promise.all([
        this.getTotalCounts(),
        this.getEngagementMetrics(),
      ]);

      return {
        ...counts,
        ...engagement,
      };
    } catch (error) {
      console.error('Error getting dashboard overview:', error);
      throw error;
    }
  }

  /**
   * Get users list with pagination and filters
   */
  async getUsersList(options = {}) {
    try {
      const { page = 1, limit = 20, search = '', sortBy = 'createdAt', sortOrder = 'desc' } = options;
      
      let query = this.db.collection('users');

      // Apply search filter (by username or email)
      if (search) {
        query = query.where('username', '>=', search).where('username', '<=', search + '\uf8ff');
      }

      // Apply sorting
      query = query.orderBy(sortBy, sortOrder);

      // Get total count
      const totalSnapshot = await query.count().get();
      const total = totalSnapshot.data().count;

      // Apply pagination
      const offset = (page - 1) * limit;
      const snapshot = await query.limit(limit).offset(offset).get();

      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error getting users list:', error);
      throw error;
    }
  }

  /**
   * Get posts list with pagination and filters
   */
  async getPostsList(options = {}) {
    try {
      const { page = 1, limit = 20, userId = null, sortBy = 'createdAt', sortOrder = 'desc' } = options;
      
      let query = this.db.collection('posts');

      // Filter by user
      if (userId) {
        query = query.where('userId', '==', userId);
      }

      // Apply sorting
      query = query.orderBy(sortBy, sortOrder);

      // Get total count
      const totalSnapshot = await query.count().get();
      const total = totalSnapshot.data().count;

      // Apply pagination
      const offset = (page - 1) * limit;
      const snapshot = await query.limit(limit).offset(offset).get();

      const posts = [];
      for (const doc of snapshot.docs) {
        const postData = doc.data();
        
        // Get user info
        const userDoc = await this.db.collection('users').doc(postData.userId).get();
        const userData = userDoc.exists ? userDoc.data() : null;

        posts.push({
          id: doc.id,
          ...postData,
          user: userData ? {
            id: postData.userId,
            username: userData.username,
            profileImage: userData.profileImage,
          } : null,
        });
      }

      return {
        posts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error getting posts list:', error);
      throw error;
    }
  }

  /**
   * Get user details by ID
   */
  async getUserDetails(userId) {
    try {
      const userDoc = await this.db.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
      }

      const userData = userDoc.data();

      // Get user's posts count
      const postsSnapshot = await this.db.collection('posts').where('userId', '==', userId).count().get();
      const postsCount = postsSnapshot.data().count;

      // Get user's recent posts
      const recentPostsSnapshot = await this.db.collection('posts')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get();

      const recentPosts = recentPostsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      return {
        id: userId,
        ...userData,
        postsCount,
        recentPosts,
      };
    } catch (error) {
      console.error('Error getting user details:', error);
      throw error;
    }
  }

  /**
   * Get post details by ID
   */
  async getPostDetails(postId) {
    try {
      const postDoc = await this.db.collection('posts').doc(postId).get();
      
      if (!postDoc.exists) {
        const error = new Error('Post not found');
        error.statusCode = 404;
        throw error;
      }

      const postData = postDoc.data();

      // Get user info
      const userDoc = await this.db.collection('users').doc(postData.userId).get();
      const userData = userDoc.exists ? userDoc.data() : null;

      // Get comments count
      const commentsSnapshot = await this.db.collection('comments').where('postId', '==', postId).count().get();
      const commentsCount = commentsSnapshot.data().count;

      // Get likes count
      const likesSnapshot = await this.db.collection('likes').where('postId', '==', postId).count().get();
      const likesCount = likesSnapshot.data().count;

      // Get recent comments (without orderBy to avoid index requirement)
      const recentCommentsSnapshot = await this.db.collection('comments')
        .where('postId', '==', postId)
        .limit(10)
        .get();

      const comments = [];
      const commentDocs = recentCommentsSnapshot.docs
        .sort((a, b) => {
          const timeA = a.data().createdAt?.toMillis() || 0;
          const timeB = b.data().createdAt?.toMillis() || 0;
          return timeB - timeA; // Sort descending
        })
        .slice(0, 5); // Take only 5 most recent

      for (const doc of commentDocs) {
        const commentData = doc.data();
        const commentUserDoc = await this.db.collection('users').doc(commentData.userId).get();
        const commentUserData = commentUserDoc.exists ? commentUserDoc.data() : null;

        comments.push({
          id: doc.id,
          ...commentData,
          user: commentUserData ? {
            id: commentData.userId,
            username: commentUserData.username,
            profileImage: commentUserData.profileImage,
          } : null,
        });
      }

      return {
        id: postId,
        ...postData,
        user: userData ? {
          id: postData.userId,
          username: userData.username,
          profileImage: userData.profileImage,
          followersCount: userData.followersCount || 0,
        } : null,
        commentsCount,
        likesCount,
        recentComments: comments,
      };
    } catch (error) {
      console.error('Error getting post details:', error);
      throw error;
    }
  }

  /**
   * Get content moderation statistics
   */
  async getModerationStats() {
    try {
      const [reportsSnap, flaggedPostsSnap, flaggedUsersSnap] = await Promise.all([
        this.db.collection('reports').count().get(),
        this.db.collection('reports').where('status', '==', 'pending').count().get(),
        this.db.collection('users').where('isBanned', '==', true).count().get(),
      ]);

      // Get reports by type
      const reportsSnapshot = await this.db.collection('reports').get();
      const reportsByType = {};
      reportsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const type = data.reason || 'other';
        reportsByType[type] = (reportsByType[type] || 0) + 1;
      });

      return {
        totalReports: reportsSnap.data().count,
        pendingReports: flaggedPostsSnap.data().count,
        bannedUsers: flaggedUsersSnap.data().count,
        reportsByType,
      };
    } catch (error) {
      console.error('Error getting moderation stats:', error);
      throw error;
    }
  }

  /**
   * Search users by username or email
   */
  async searchUsers(searchTerm) {
    try {
      if (!searchTerm || searchTerm.length < 2) {
        return [];
      }

      const snapshot = await this.db.collection('users')
        .where('username', '>=', searchTerm)
        .where('username', '<=', searchTerm + '\uf8ff')
        .limit(10)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }
}

module.exports = new AnalyticsService();
