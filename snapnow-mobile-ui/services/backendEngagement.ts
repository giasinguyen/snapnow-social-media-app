import apiClient, { getErrorMessage } from './api';
import type { Comment } from '../types';

export interface LikeResponse {
  postId: string;
  userId: string;
  createdAt: string;
}

export interface AddCommentData {
  text: string;
}


export const likePost = async (postId: string): Promise<void> => {
  try {
    await apiClient.post(`/engagement/posts/${postId}/like`);
  } catch (error) {
    console.error('Error liking post:', error);
    throw new Error(getErrorMessage(error));
  }
};


export const unlikePost = async (postId: string): Promise<void> => {
  try {
    await apiClient.delete(`/engagement/posts/${postId}/like`);
  } catch (error) {
    console.error('Error unliking post:', error);
    throw new Error(getErrorMessage(error));
  }
};


export const getPostLikes = async (postId: string): Promise<any[]> => {
  try {
    const response = await apiClient.get(`/engagement/posts/${postId}/likes`);
    return response.data;
  } catch (error) {
    console.error('Error fetching post likes:', error);
    throw new Error(getErrorMessage(error));
  }
};


export const addComment = async (postId: string, text: string): Promise<Comment> => {
  try {
    const response = await apiClient.post<Comment>(`/engagement/posts/${postId}/comments`, {
      text,
    });
    return response.data;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw new Error(getErrorMessage(error));
  }
};


export const getComments = async (postId: string, page: number = 1): Promise<Comment[]> => {
  try {
    const response = await apiClient.get<Comment[]>(`/engagement/posts/${postId}/comments`, {
      params: { page, limit: 50 },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw new Error(getErrorMessage(error));
  }
};


export const deleteComment = async (postId: string, commentId: string): Promise<void> => {
  try {
    await apiClient.delete(`/engagement/posts/${postId}/comments/${commentId}`);
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw new Error(getErrorMessage(error));
  }
};
