import api from './api';

const trendsService = {
  /**
   * Get trending hashtags
   */
  getTrendingHashtags: async (params = {}) => {
    try {
      const response = await api.get('/trends/hashtags', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching trending hashtags:', error);
      throw error;
    }
  },

  /**
   * Get top posts
   */
  getTopPosts: async (params = {}) => {
    try {
      const response = await api.get('/trends/posts', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching top posts:', error);
      throw error;
    }
  },

  /**
   * Get fastest growing users
   */
  getGrowingUsers: async (params = {}) => {
    try {
      const response = await api.get('/trends/users', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching growing users:', error);
      throw error;
    }
  },

  /**
   * Get engagement leaders
   */
  getEngagementLeaders: async (params = {}) => {
    try {
      const response = await api.get('/trends/engagement', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching engagement leaders:', error);
      throw error;
    }
  },
};

export default trendsService;
