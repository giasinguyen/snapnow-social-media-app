import api from './api';

const settingsService = {
  /**
   * Get current application settings
   * @returns {Promise} Settings data
   */
  getSettings: async () => {
    try {
      const response = await api.get('/settings');
      return response.data;
    } catch (error) {
      console.error('Error getting settings:', error);
      throw error;
    }
  },

  /**
   * Update application settings
   * @param {Object} settings - Settings object to update
   * @returns {Promise} Updated settings
   */
  updateSettings: async (settings) => {
    try {
      const response = await api.put('/settings', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  },

  /**
   * Reset settings to default values
   * @returns {Promise} Default settings
   */
  resetSettings: async () => {
    try {
      const response = await api.post('/settings/reset');
      return response.data;
    } catch (error) {
      console.error('Error resetting settings:', error);
      throw error;
    }
  },
};

export default settingsService;
