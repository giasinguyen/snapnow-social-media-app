import api from './api';

const reportsService = {
  /**
   * Get all reports with pagination and filters
   */
  getReports: async (params = {}) => {
    try {
      const response = await api.get('/reports', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }
  },

  /**
   * Get report statistics
   */
  getStats: async () => {
    try {
      const response = await api.get('/reports/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching report stats:', error);
      throw error;
    }
  },

  /**
   * Update report status
   */
  updateStatus: async (reportId, status) => {
    try {
      const response = await api.patch(`/reports/${reportId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating report status:', error);
      throw error;
    }
  },

  /**
   * Delete a report
   */
  deleteReport: async (reportId) => {
    try {
      const response = await api.delete(`/reports/${reportId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  },
};

export default reportsService;
