import apiClient, { getErrorMessage } from './api';
import type { Post } from '../types';

export interface CreatePostData {
  imageUrl: string;
  caption?: string;
  hashtags?: string[];
}

export interface UpdatePostData {
  caption?: string;
  hashtags?: string[];
}


export const getFeed = async (page: number = 1, limit: number = 20): Promise<Post[]> => {
  try {
    const response = await apiClient.get<Post[]>('/posts/feed', {
      params: { page, limit },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching feed:', error);
    throw new Error(getErrorMessage(error));
  }
};


export const getGlobalFeed = async (page: number = 1, limit: number = 20): Promise<Post[]> => {
  try {
    const response = await apiClient.get<Post[]>('/posts/feed', {
      params: { page, limit, type: 'global' },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching global feed:', error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Create a new post
 */
export const createPost = async (postData: CreatePostData): Promise<Post> => {
  try {
    const response = await apiClient.post<Post>('/posts', postData);
    return response.data;
  } catch (error) {
    console.error('Error creating post:', error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Get post by ID
 */
export const getPostById = async (postId: string): Promise<Post> => {
  try {
    const response = await apiClient.get<Post>(`/posts/${postId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching post:', error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Update a post
 */
export const updatePost = async (postId: string, updates: UpdatePostData): Promise<Post> => {
  try {
    const response = await apiClient.put<Post>(`/posts/${postId}`, updates);
    return response.data;
  } catch (error) {
    console.error('Error updating post:', error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Delete a post
 */
export const deletePost = async (postId: string): Promise<void> => {
  try {
    await apiClient.delete(`/posts/${postId}`);
  } catch (error) {
    console.error('Error deleting post:', error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Report a post
 */
export const reportPost = async (postId: string, reason: string): Promise<void> => {
  try {
    await apiClient.post(`/posts/${postId}/report`, { reason });
  } catch (error) {
    console.error('Error reporting post:', error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Get posts by hashtag
 */
export const getPostsByHashtag = async (hashtag: string, page: number = 1): Promise<Post[]> => {
  try {
    const response = await apiClient.get<Post[]>('/posts/hashtag', {
      params: { tag: hashtag, page },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching posts by hashtag:', error);
    throw new Error(getErrorMessage(error));
  }
};
