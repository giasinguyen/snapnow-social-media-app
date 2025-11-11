import api from './api';

export const analyticsService = {
  // Get dashboard overview
  async getOverview() {
    const response = await api.get('/analytics/overview');
    return response.data.data;
  },

  // Get user growth data
  async getUserGrowth(days = 30) {
    const response = await api.get(`/analytics/user-growth?days=${days}`);
    return response.data.data;
  },

  // Get post activity data
  async getPostActivity(days = 30) {
    const response = await api.get(`/analytics/post-activity?days=${days}`);
    return response.data.data;
  },

  // Get engagement metrics
  async getEngagement() {
    const response = await api.get('/analytics/engagement');
    return response.data.data;
  },

  // Get top users
  async getTopUsers(limit = 10) {
    const response = await api.get(`/analytics/top-users?limit=${limit}`);
    return response.data.data;
  },

  // Get top posts
  async getTopPosts(limit = 10) {
    const response = await api.get(`/analytics/top-posts?limit=${limit}`);
    return response.data.data;
  },

  // Get recent activity
  async getRecentActivity(limit = 20) {
    const response = await api.get(`/analytics/recent-activity?limit=${limit}`);
    return response.data.data;
  },

  // Get users list with pagination
  async getUsersList(params = {}) {
    const { page = 1, limit = 20, search = '', sortBy = 'createdAt', sortOrder = 'desc' } = params;
    const response = await api.get('/analytics/users', {
      params: { page, limit, search, sortBy, sortOrder },
    });
    return response.data.data;
  },

  // Search users
  async searchUsers(query) {
    const response = await api.get('/analytics/users/search', {
      params: { q: query },
    });
    return response.data.data;
  },

  // Get user details
  async getUserDetails(userId) {
    const response = await api.get(`/analytics/users/${userId}`);
    return response.data.data;
  },

  // Get posts list with pagination
  async getPostsList(params = {}) {
    const { page = 1, limit = 20, userId = null, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    const response = await api.get('/analytics/posts', {
      params: { page, limit, userId, sortBy, sortOrder },
    });
    return response.data.data;
  },

  // Get post details
  async getPostDetails(postId) {
    const response = await api.get(`/analytics/posts/${postId}`);
    return response.data.data;
  },

  // Get moderation statistics
  async getModerationStats() {
    const response = await api.get('/analytics/moderation');
    return response.data.data;
  },
};

export default analyticsService;
