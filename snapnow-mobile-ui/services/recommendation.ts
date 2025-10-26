import apiClient, { getErrorMessage } from './api';
import type { User, Post } from '../types';

export interface TrendingHashtag {
  tag: string;
  count: number;
}


export const getRecommendedUsers = async (limit: number = 10): Promise<User[]> => {
  try {
    const response = await apiClient.get<User[]>('/recommendations/users', {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user recommendations:', error);
    throw new Error(getErrorMessage(error));
  }
};


export const getRecommendedPosts = async (limit: number = 20): Promise<Post[]> => {
  try {
    const response = await apiClient.get<Post[]>('/recommendations/posts', {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching post recommendations:', error);
    throw new Error(getErrorMessage(error));
  }
};

export const getTrendingHashtags = async (limit: number = 10): Promise<TrendingHashtag[]> => {
  try {
    const response = await apiClient.get<TrendingHashtag[]>('/recommendations/trending', {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching trending hashtags:', error);
    throw new Error(getErrorMessage(error));
  }
};
