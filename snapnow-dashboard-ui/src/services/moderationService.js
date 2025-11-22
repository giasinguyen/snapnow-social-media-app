import api from './api';

const moderationService = {
  /**
   * Get moderation queue
   */
  getQueue: async (params = {}) => {
    try {
      const response = await api.get('/moderation/queue', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching moderation queue:', error);
      throw error;
    }
  },

  /**
   * Get moderation statistics
   */
  getStats: async () => {
    try {
      const response = await api.get('/moderation/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching moderation stats:', error);
      throw error;
    }
  },

  /**
   * Approve content
   */
  approveContent: async (contentId, contentType) => {
    try {
      const response = await api.post('/moderation/approve', { contentId, contentType });
      return response.data;
    } catch (error) {
      console.error('Error approving content:', error);
      throw error;
    }
  },

  /**
   * Remove content
   */
  removeContent: async (contentId, contentType, reason) => {
    try {
      const response = await api.post('/moderation/remove', { contentId, contentType, reason });
      return response.data;
    } catch (error) {
      console.error('Error removing content:', error);
      throw error;
    }
  },
};

export default moderationService;
