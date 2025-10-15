import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Post } from '../types';

interface PostCardProps {
  post: Post;
  onLike?: (id: string, liked: boolean) => void;
  onComment?: (id: string) => void;
  onShare?: (id: string) => void;
}

export default function PostCard({ post, onLike, onComment, onShare }: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const toggleLike = () => {
    setLiked((s) => {
      const next = !s;
      onLike?.(post.id, next);
      return next;
    });
  };

  const toggleBookmark = () => {
    setBookmarked((s) => !s);
  };

  const handleComment = () => {
    onComment?.(post.id);
  };

  const handleShare = () => {
    onShare?.(post.id);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image 
            source={{ uri: post.userImage || 'https://via.placeholder.com/40' }} 
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.username}>{post.username}</Text>
            {/* Có thể thêm location hoặc thông tin khác */}
          </View>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={20} color="#262626" />
        </TouchableOpacity>
      </View>

      {/* Image */}
      <Image 
        source={{ uri: post.imageUrl }} 
        style={styles.postImage}
        resizeMode="cover"
      />

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity onPress={toggleLike} style={styles.actionButton}>
            <Ionicons 
              name={liked ? 'heart' : 'heart-outline'} 
              size={28} 
              color={liked ? '#FF3040' : '#262626'} 
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleComment} style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={26} color="#262626" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
            <Ionicons name="paper-plane-outline" size={26} color="#262626" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={toggleBookmark}>
          <Ionicons 
            name={bookmarked ? 'bookmark' : 'bookmark-outline'} 
            size={26} 
            color="#262626" 
          />
        </TouchableOpacity>
      </View>

      {/* Likes Count */}
      {(post.likes || 0) + (liked ? 1 : 0) > 0 && (
        <Text style={styles.likesCount}>
          {(post.likes || 0) + (liked ? 1 : 0)} {(post.likes || 0) + (liked ? 1 : 0) === 1 ? 'like' : 'likes'}
        </Text>
      )}

      {/* Caption */}
      {post.caption && (
        <View style={styles.captionContainer}>
          <Text style={styles.caption}>
            <Text style={styles.captionUsername}>{post.username}</Text>{' '}
            {post.caption}
          </Text>
        </View>
      )}

      {/* View Comments */}
      {(post.commentsCount || 0) > 0 && (
        <TouchableOpacity onPress={handleComment}>
          <Text style={styles.viewComments}>
            View all {post.commentsCount} comments
          </Text>
        </TouchableOpacity>
      )}

      {/* Timestamp */}
      <Text style={styles.timestamp}>
        {post.createdAt ? getTimeAgo(post.createdAt) : 'Just now'}
      </Text>
    </View>
  );
}

// Helper function for time ago
function getTimeAgo(date: any): string {
  const now = new Date();
  const postDate = date?.toDate ? date.toDate() : new Date(date);
  const seconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return postDate.toLocaleDateString();
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontWeight: '600',
    fontSize: 14,
    color: '#262626',
  },
  moreButton: {
    padding: 4,
  },
  postImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f0f0f0',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginRight: 16,
  },
  likesCount: {
    fontWeight: '600',
    fontSize: 14,
    color: '#262626',
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  captionContainer: {
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  caption: {
    fontSize: 14,
    color: '#262626',
    lineHeight: 18,
  },
  captionUsername: {
    fontWeight: '600',
  },
  viewComments: {
    fontSize: 14,
    color: '#8E8E8E',
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#8E8E8E',
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 12,
  },
});
