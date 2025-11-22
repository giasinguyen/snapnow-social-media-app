import api from './api';

const commentService = {
  /**
   * Get comments with pagination
   */
  getComments: async (params = {}) => {
    try {
      const response = await api.get('/comments', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  },

  /**
   * Delete comment
   */
  deleteComment: async (commentId) => {
    try {
      const response = await api.delete(`/comments/${commentId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  },

  /**
   * Get comment stats
   */
  getCommentStats: async () => {
    try {
      const response = await api.get('/comments/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching comment stats:', error);
      throw error;
    }
  },
};

export default commentService;
