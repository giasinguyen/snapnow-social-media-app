/**
 * Backend User Service - API calls cho user management
 * 
 * Features:
 * - Get user profile
 * - Update user profile
 * - Search users
 * - Follow/Unfollow
 * - Get followers/following
 */

import apiClient, { getErrorMessage } from './api';
import type { User } from '../types';

export interface UpdateProfileData {
  displayName?: string;
  bio?: string;
  profileImage?: string;
  username?: string;
}

export interface FollowData {
  followerId: string;
  followingId: string;
}

/**
 * Get user profile by ID
 */
export const getUserProfileById = async (userId: string): Promise<User> => {
  try {
    const response = await apiClient.get<User>(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Update current user profile
 */
export const updateUserProfile = async (updates: UpdateProfileData): Promise<User> => {
  try {
    const response = await apiClient.put<User>('/users/profile', updates);
    return response.data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Search users by username or display name
 */
export const searchUsers = async (searchTerm: string): Promise<User[]> => {
  try {
    const response = await apiClient.get<User[]>('/users/search', {
      params: { q: searchTerm },
    });
    return response.data;
  } catch (error) {
    console.error('Error searching users:', error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Follow a user
 */
export const followUser = async (userId: string): Promise<void> => {
  try {
    await apiClient.post(`/users/${userId}/follow`);
  } catch (error) {
    console.error('Error following user:', error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Unfollow a user
 */
export const unfollowUser = async (userId: string): Promise<void> => {
  try {
    await apiClient.delete(`/users/${userId}/unfollow`);
  } catch (error) {
    console.error('Error unfollowing user:', error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Get list of followers
 */
export const getFollowers = async (userId: string): Promise<User[]> => {
  try {
    const response = await apiClient.get<User[]>(`/users/${userId}/followers`);
    return response.data;
  } catch (error) {
    console.error('Error fetching followers:', error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Get list of following
 */
export const getFollowing = async (userId: string): Promise<User[]> => {
  try {
    const response = await apiClient.get<User[]>(`/users/${userId}/following`);
    return response.data;
  } catch (error) {
    console.error('Error fetching following:', error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Get user's posts
 */
export const getUserPosts = async (userId: string): Promise<any[]> => {
  try {
    const response = await apiClient.get(`/users/${userId}/posts`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user posts:', error);
    throw new Error(getErrorMessage(error));
  }
};
