import apiClient, { getErrorMessage } from './api';

export interface ReportData {
  reason: string;
  details?: string;
}

export interface ReportedContent {
  id: string;
  postId?: string;
  userId?: string;
  reportedBy: string;
  reason: string;
  details?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export const reportPost = async (postId: string, reportData: ReportData): Promise<void> => {
  try {
    await apiClient.post(`/posts/${postId}/report`, reportData);
  } catch (error) {
    console.error('Error reporting post:', error);
    throw new Error(getErrorMessage(error));
  }
};

export const reportUser = async (userId: string, reportData: ReportData): Promise<void> => {
  try {
    await apiClient.post(`/users/${userId}/report`, reportData);
  } catch (error) {
    console.error('Error reporting user:', error);
    throw new Error(getErrorMessage(error));
  }
};


export const getReportedPosts = async (): Promise<ReportedContent[]> => {
  try {
    const response = await apiClient.get<ReportedContent[]>('/admin/reports/posts');
    return response.data;
  } catch (error) {
    console.error('Error fetching reported posts:', error);
    throw new Error(getErrorMessage(error));
  }
};


export const deleteReportedPost = async (postId: string): Promise<void> => {
  try {
    await apiClient.delete(`/admin/posts/${postId}`);
  } catch (error) {
    console.error('Error deleting reported post:', error);
    throw new Error(getErrorMessage(error));
  }
};

export const banUser = async (userId: string, reason: string): Promise<void> => {
  try {
    await apiClient.post(`/admin/users/${userId}/ban`, { reason });
  } catch (error) {
    console.error('Error banning user:', error);
    throw new Error(getErrorMessage(error));
  }
};


export const unbanUser = async (userId: string): Promise<void> => {
  try {
    await apiClient.post(`/admin/users/${userId}/unban`);
  } catch (error) {
    console.error('Error unbanning user:', error);
    throw new Error(getErrorMessage(error));
  }
};


export const getModerationStats = async (): Promise<any> => {
  try {
    const response = await apiClient.get('/admin/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching moderation stats:', error);
    throw new Error(getErrorMessage(error));
  }
};
