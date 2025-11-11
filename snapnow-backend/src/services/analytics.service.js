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
}

module.exports = new AnalyticsService();
