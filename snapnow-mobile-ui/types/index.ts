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
  createdAt: Date;
}

export interface Post {
  id: string;
  userId?: string;
  username?: string;
  userImage?: string;
  imageUrl?: string;
  caption?: string;
  hashtags?: string[];
  likes?: number;
  commentsCount?: number;
  isLiked?: boolean;
  createdAt?: any;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  username: string;
  userProfileImage?: string;
  text: string;
  likesCount: number;
  isLiked: boolean;
  createdAt: Date;
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
  type: 'like' | 'comment' | 'follow';
  fromUserId: string;
  fromUsername: string;
  fromUserProfileImage?: string;
  postId?: string;
  postImageUrl?: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}
