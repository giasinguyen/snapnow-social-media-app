import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Post } from '../types';
import CommentsModal from './CommentsModal';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SIZES, TIMINGS } from '../src/constants/theme';

interface PostCardProps {
  post: Post;
  onLike?: (id: string, liked: boolean) => void;
  onComment?: (id: string) => void;
  onShare?: (id: string) => void;
  onPress?: (id: string) => void;
}

const PostCard: React.FC<PostCardProps> = React.memo(({ post, onLike, onComment, onShare, onPress }) => {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const heartScale = useState(new Animated.Value(0))[0];
  const [showHeart, setShowHeart] = useState(false);
  let lastTap = useRef<number>(0);

  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300; // 0.3s

    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      triggerLikeAnimation();
      if (!liked) {
        setLiked(true);
        onLike?.(post.id, true);
      }
    }
    lastTap.current = now;
  };

  const triggerLikeAnimation = () => {
    setShowHeart(true);
    heartScale.setValue(0);

    Animated.sequence([
      Animated.spring(heartScale, {
        toValue: 1,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(heartScale, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => setShowHeart(false));
  };

  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const heartScale = useState(new Animated.Value(0))[0];
  const [showHeart, setShowHeart] = useState(false);
  let lastTap = useRef<number>(0);

  const triggerLikeAnimation = useCallback(() => {
    setShowHeart(true);
    heartScale.setValue(0);

    Animated.sequence([
      Animated.spring(heartScale, {
        toValue: 1,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(heartScale, {
        toValue: 0,
        duration: TIMINGS.base,
        useNativeDriver: true,
      }),
    ]).start(() => setShowHeart(false));
  }, [heartScale]);

  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      // Double tap - like
      triggerLikeAnimation();
      if (!liked) {
        setLiked(true);
        onLike?.(post.id, true);
      }
    } else {
      // Single tap - navigate to post detail
      setTimeout(() => {
        if (Date.now() - lastTap.current >= DOUBLE_TAP_DELAY) {
          onPress?.(post.id);
        }
      }, DOUBLE_TAP_DELAY);
    }
    lastTap.current = now;
  }, [liked, triggerLikeAnimation, post.id, onLike, onPress]);

  const toggleLike = useCallback(() => {
    setLiked((s) => {
      const next = !s;
      onLike?.(post.id, next);
      return next;
    });
  }, [post.id, onLike]);

  const toggleBookmark = useCallback(() => {
    setBookmarked((s) => !s);
  }, []);

  const handleComment = useCallback(() => {
    setCommentsModalVisible(true);
    onComment?.(post.id);
  }, [post.id, onComment]);

  const handleShare = useCallback(() => {
    onShare?.(post.id);
  }, [post.id, onShare]);

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
      <TouchableWithoutFeedback onPress={handleDoubleTap}>
        <View style={{ position: 'relative' }}>
          <Image
            source={{ uri: post.imageUrl }}
            style={styles.postImage}
            resizeMode="cover"
          />

          {showHeart && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.heartOverlay,            
                { transform: [{ scale: heartScale }] },
              ]}
            >
              <Ionicons
                name="heart"
                size={60}
                color="#FFFFFF"
                style={{ textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 8 }}
              />
            </Animated.View>
          )}
        </View>
      </TouchableWithoutFeedback>

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

      {/* Comments modal (opened when tapping comments) */}
      <CommentsModal
        visible={commentsModalVisible}
        postId={post.id}
        onClose={() => setCommentsModalVisible(false)}
      />

      {/* Timestamp */}
      <Text style={styles.timestamp}>
        {post.createdAt ? getTimeAgo(post.createdAt) : 'Just now'}
      </Text>
    </View>
  )
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
    backgroundColor: COLORS.backgroundWhite,
    marginBottom: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: SIZES.avatar.sm,
    height: SIZES.avatar.sm,
    borderRadius: RADIUS.circle,
    marginRight: 10,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
  },
  moreButton: {
    padding: SPACING.xs,
  },
  postImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: COLORS.backgroundGray,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginRight: SPACING.lg,
  },
  likesCount: {
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
  },
  captionContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
  },
  caption: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
    lineHeight: TYPOGRAPHY.lineHeight.tight,
  },
  captionUsername: {
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  viewComments: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
  },
  timestamp: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.md,
  },
  heartOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.9,
  },
  heartOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.9,
  },
});
