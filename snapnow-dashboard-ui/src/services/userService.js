import api from './api';

const userService = {
  /**
   * Update user status (active/banned)
   */
  updateUserStatus: async (userId, status, reason = '') => {
    try {
      const response = await api.patch(`/users/${userId}/status`, { status, reason });
      return response.data;
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  },
  

  updateUserRole: async (userId, role) => {
    try {
      const response = await api.patch(`/users/${userId}/role`, { role });
      return response.data;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  },
};

export default userService;
