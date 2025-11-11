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
};

export default analyticsService;
