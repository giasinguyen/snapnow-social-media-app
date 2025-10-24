// Firebase Collections
export const COLLECTIONS = {
  USERS: 'users',
  POSTS: 'posts',
  COMMENTS: 'comments',
  LIKES: 'likes',
  FOLLOWERS: 'followers',
  FOLLOWING: 'following',
  NOTIFICATIONS: 'notifications',
  STORIES: 'stories',
  HIGHLIGHTS: 'highlights',
  SAVED_POSTS: 'savedPosts',
  MESSAGES: 'messages',
  CONVERSATIONS: 'conversations',
} as const;

// Firebase Storage Paths
export const STORAGE_PATHS = {
  AVATARS: 'users/{userId}/avatar.jpg',
  POSTS: 'posts/{postId}/{fileName}',
  STORIES: 'stories/{userId}/{storyId}.jpg',
  MESSAGES: 'messages/{conversationId}/{messageId}',
} as const;

export default {
  COLLECTIONS,
  STORAGE_PATHS,
};
