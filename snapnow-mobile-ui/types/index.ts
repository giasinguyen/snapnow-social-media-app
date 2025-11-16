export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  profileImage?: string;
  bio?: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isPrivate?: boolean;
  activityStatus?: boolean; // Show activity status (default true)
  isOnline?: boolean; // Currently online
  lastActive?: Date; // Last active timestamp
  createdAt: Date;
}

export interface Post {
  id: string;
  userId?: string;
  username?: string;
  userImage?: string;
  imageUrl?: string; // Keep for backward compatibility
  imageUrls?: string[]; // New field for multiple images
  caption?: string;
  hashtags?: string[];
  likes?: number;
  commentsCount?: number;
  savesCount?: number; // Number of saves/bookmarks
  isLiked?: boolean;
  isSaved?: boolean; // Whether current user has saved this post
  createdAt?: any;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  username: string;
  userProfileImage?: string;
  text: string;
  imageUrl?: string; // Optional image in comment
  likesCount: number;
  isLiked: boolean;
  createdAt: Date;
  parentCommentId?: string; // For replies
  replies?: Comment[]; // Nested replies
  repliesCount?: number; // Number of replies
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: Date;
}

export interface Like {
  id: string;
  userId: string;
  postId?: string;
  commentId?: string;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'comment_reply' | 'comment_like' | 'story_reaction' | 'mention' | 'follow_request' | 'follow_request_accepted';
  fromUserId: string;
  fromUsername: string;
  fromUserProfileImage?: string;
  postId?: string;
  postImageUrl?: string;
  commentId?: string;
  storyId?: string;
  message: string;
  isRead: boolean;
  createdAt: any; // Can be Timestamp or Date
}
