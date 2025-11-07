import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Image, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AuthService } from '../services/authService';
import { hasUserLikedPost } from '../services/likes';
import { savePost, unsavePost } from '../services/posts';
import { UserService } from '../services/user';
import { COLORS, RADIUS, SIZES, SPACING, TIMINGS, TYPOGRAPHY } from '../src/constants/theme';
import { Post } from '../types';
import CommentsModal from './CommentsModal';
import MultiImageViewer from './MultiImageViewer';

interface PostCardProps {
  post: Post;
  onLike?: (id: string, liked: boolean) => void;
  onComment?: (id: string) => void;
  onShare?: (id: string) => void;
  onPress?: (id: string, imageIndex?: number) => void; // Add imageIndex parameter
  onDelete?: (id: string) => void; // Add delete callback
}

const PostCard: React.FC<PostCardProps> = React.memo(({ post, onLike, onComment, onShare, onPress, onDelete }) => {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes || 0);
  const [bookmarked, setBookmarked] = useState(false);
  const [savesCount, setSavesCount] = useState(post.savesCount || 0);
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [displayUsername, setDisplayUsername] = useState(post.username || '');
  const [displayUserImage, setDisplayUserImage] = useState(post.userImage || '');
  const [isOwnPost, setIsOwnPost] = useState(false); // Track if this is user's own post
  const [isFollowing, setIsFollowing] = useState(false); // Track if user is following the post author
  const heartScale = useState(new Animated.Value(0))[0];
  const [showHeart, setShowHeart] = useState(false);
  const router = useRouter();
  let lastTap = useRef<number>(0);

  // Function to remove hashtags from caption text
  const removeHashtagsFromText = (text: string) => {
    return text.replace(/#\w+/g, '').replace(/\s+/g, ' ').trim();
  };

  // Check if user has liked this post on mount and get real likes count
  useEffect(() => {
    const checkLikeStatus = async () => {
      try {
        const currentUser = AuthService.getCurrentUser();
        if (currentUser && post.id) {
          const isLiked = await hasUserLikedPost(currentUser.uid, post.id);
          setLiked(isLiked);
          
          // Check if this is user's own post
          setIsOwnPost(currentUser.uid === post.userId);
          
          // Check if user is following the post author (only if it's not their own post)
          if (currentUser.uid !== post.userId && post.userId) {
            const { isFollowing } = await import('../services/follow');
            const followStatus = await isFollowing(currentUser.uid, post.userId);
            setIsFollowing(followStatus);
          }
          
          // Get real likes count from Firestore
          const { getPostLikesCount } = await import('../services/likes');
          const count = await getPostLikesCount(post.id);
          setLikesCount(count);
        }
      } catch (error) {
        console.error('Error checking like status:', error);
      }
    };
    
    checkLikeStatus();
  }, [post.id, post.userId]);

  // Fetch fresh user data when post userId changes
  useEffect(() => {
    if (post.userId) {
      (async () => {
        try {
          const user = await UserService.getUserProfile(post.userId!);
          if (user) {
            setDisplayUsername(user.username || post.username || '');
            setDisplayUserImage(user.profileImage || post.userImage || '');
          }
        } catch (error) {
          console.error('Error fetching user profile for post:', error);
          // Fallback to post data if fetch fails
          setDisplayUsername(post.username || '');
          setDisplayUserImage(post.userImage || '');
        }
      })();
    }
  }, [post.userId]);

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

  const toggleLike = useCallback(async () => {
    try {
      const currentUser = AuthService.getCurrentUser();
      if (!currentUser) return;

      const newLikedState = !liked;
      
      // Optimistic UI update
      setLiked(newLikedState);
      setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);

      // Import services
      const { likePost, unlikePost, getPostLikesCount } = await import('../services/likes');
      const currentUserProfile = await AuthService.getCurrentUserProfile();

      if (newLikedState) {
        // Like the post
        await likePost(
          currentUser.uid,
          post.id,
          currentUserProfile?.username || '',
          currentUserProfile?.profileImage
        );
      } else {
        // Unlike the post
        await unlikePost(currentUser.uid, post.id);
      }

      // Get the real count from database to ensure accuracy
      const realCount = await getPostLikesCount(post.id);
      setLikesCount(realCount);

      onLike?.(post.id, newLikedState);
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert on error
      setLiked(liked);
      setLikesCount(prev => liked ? prev + 1 : prev - 1);
    }
  }, [liked, post.id, onLike]);

  const toggleBookmark = useCallback(async () => {
    try {
      const currentUser = AuthService.getCurrentUser();
      if (!currentUser) return;

      const newSavedState = !bookmarked;
      setBookmarked(newSavedState);
      setSavesCount(prev => newSavedState ? prev + 1 : prev - 1);

      if (newSavedState) {
        await savePost(post.id, currentUser.uid);
      } else {
        await unsavePost(post.id, currentUser.uid);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      // Revert on error
      setBookmarked(bookmarked);
      setSavesCount(prev => bookmarked ? prev - 1 : prev + 1);
      Alert.alert('Error', 'Failed to save post. Please try again.');
    }
  }, [bookmarked, post.id]);

  const handleComment = useCallback(() => {
    setCommentsModalVisible(true);
    onComment?.(post.id);
  }, [post.id, onComment]);

  const handleShare = useCallback(() => {
    onShare?.(post.id);
  }, [post.id, onShare]);

  const handleUserPress = useCallback(() => {
    if (post.userId) {
      router.push(`/user/${post.userId}` as any);
    }
  }, [post.userId, router]);

  const handleDeletePost = useCallback(async () => {
    try {
      Alert.alert(
        'Delete Post',
        'Are you sure you want to delete this post? This action cannot be undone.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                const currentUser = AuthService.getCurrentUser();
                if (!currentUser) return;
                
                const { deletePost } = await import('../services/posts');
                await deletePost(post.id, currentUser.uid);
                
                Alert.alert('Success', 'Post deleted successfully');
                
                // Call the onDelete callback if provided, otherwise do nothing
                onDelete?.(post.id);
              } catch (error: any) {
                console.error('Error deleting post:', error);
                Alert.alert('Error', error.message || 'Failed to delete post');
              }
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error deleting post:', error);
      Alert.alert('Error', error.message || 'Failed to delete post');
    }
  }, [post.id, onDelete]);

  const handleFollowToggle = useCallback(async () => {
    try {
      const currentUser = AuthService.getCurrentUser();
      if (!currentUser || !post.userId) return;
      
      const { followUser, unfollowUser } = await import('../services/follow');
      const currentUserProfile = await AuthService.getCurrentUserProfile();
      
      if (isFollowing) {
        // Unfollow
        await unfollowUser(currentUser.uid, post.userId);
        setIsFollowing(false);
        Alert.alert('Success', `Unfollowed ${displayUsername}`);
      } else {
        // Follow
        await followUser(
          currentUser.uid, 
          post.userId, 
          currentUserProfile?.username || 'Anonymous',
          currentUserProfile?.profileImage
        );
        setIsFollowing(true);
        Alert.alert('Success', `Following ${displayUsername}`);
      }
    } catch (error: any) {
      console.error('Error toggling follow:', error);
      Alert.alert('Error', error.message || 'Failed to update follow status');
    }
  }, [isFollowing, post.userId, displayUsername]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerLeft} onPress={handleUserPress}>
          <Image
            source={{ uri: displayUserImage || 'https://via.placeholder.com/40' }}
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.username}>{displayUsername}</Text>
            {/* Có thể thêm location hoặc thông tin khác */}
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.moreButton} onPress={() => setOptionsVisible(true)}>
          <Ionicons name="ellipsis-vertical" size={20} color="#262626" />
        </TouchableOpacity>
      </View>

      {/* Image(s) */}
      <View style={{ position: 'relative' }}>
        <MultiImageViewer
          imageUrls={post.imageUrls && post.imageUrls.length > 0 ? post.imageUrls : (post.imageUrl ? [post.imageUrl] : [])}
          onDoublePress={() => {
            triggerLikeAnimation();
            if (!liked) {
              setLiked(true);
              onLike?.(post.id, true);
            }
          }}
          onSinglePress={(imageIndex) => onPress?.(post.id, imageIndex)}
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

      {/* Stats */}
      <View style={styles.statsContainer}>
        {likesCount > 0 && (
          <Text style={styles.statText}>
            {likesCount} {likesCount === 1 ? 'like' : 'likes'}
          </Text>
        )}
        {savesCount > 0 && (
          <Text style={styles.statText}>
            {savesCount} {savesCount === 1 ? 'save' : 'saves'}
          </Text>
        )}
      </View>

      {/* Caption */}
      {post.caption && removeHashtagsFromText(post.caption).length > 0 && (
        <View style={styles.captionContainer}>
          <Text style={styles.caption}>
            <Text style={styles.captionUsername}>{displayUsername}</Text>{' '}
            {removeHashtagsFromText(post.caption)}
          </Text>
        </View>
      )}

      {/* Hashtags */}
      {post.hashtags && post.hashtags.length > 0 && (
        <View style={styles.hashtagsContainer}>
          {post.hashtags.map((tag, index) => (
            <Text key={index} style={styles.hashtag}>
              {tag}{' '}
            </Text>
          ))}
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

      {/* Post options modal - appears when tapping more button */}
      <Modal
        animationType="fade"
        transparent
        visible={optionsVisible}
        onRequestClose={() => setOptionsVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setOptionsVisible(false)}>
          <View style={styles.optionsCard}>
            {isOwnPost ? (
              // Options for user's own posts
              <>
                <TouchableOpacity style={styles.optionItem} onPress={() => { setOptionsVisible(false); handleDeletePost(); }}>
                  <Text style={[styles.optionText, styles.optionDanger]}>Delete Post</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionItem} onPress={() => { setOptionsVisible(false); router.push(`/post/edit/${post.id}` as any); }}>
                  <Text style={styles.optionText}>Edit Post</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionItem} onPress={() => { setOptionsVisible(false); router.push(`/post/${post.id}` as any); }}>
                  <Text style={styles.optionText}>Go to Post</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionItem} onPress={() => { setOptionsVisible(false); onShare?.(post.id); }}>
                  <Text style={styles.optionText}>Share...</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionItem} onPress={async () => { await Clipboard.setStringAsync(`https://snapnow.app/post/${post.id}`); setOptionsVisible(false); Alert.alert('Copy Link', 'Link copied to clipboard'); }}>
                  <Text style={styles.optionText}>Copy Link</Text>
                </TouchableOpacity>
              </>
            ) : (
              // Options for other users' posts
              <>
                <TouchableOpacity style={styles.optionItem} onPress={() => { setOptionsVisible(false); Alert.alert('Report', 'Report flow not implemented yet'); }}>
                  <Text style={[styles.optionText, styles.optionDanger]}>Report</Text>
                </TouchableOpacity>
                {/* Show Follow/Unfollow based on current status */}
                <TouchableOpacity style={styles.optionItem} onPress={() => { setOptionsVisible(false); handleFollowToggle(); }}>
                  <Text style={[styles.optionText, isFollowing && styles.optionDanger]}>
                    {isFollowing ? 'Unfollow' : 'Follow'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionItem} onPress={() => { setOptionsVisible(false); Alert.alert('Add to Favorites', 'Added to favorites (mock)'); }}>
                  <Text style={styles.optionText}>Add to Favorites</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionItem} onPress={() => { setOptionsVisible(false); router.push(`/post/${post.id}` as any); }}>
                  <Text style={styles.optionText}>Go to Post</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionItem} onPress={() => { setOptionsVisible(false); onShare?.(post.id); }}>
                  <Text style={styles.optionText}>Share...</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionItem} onPress={async () => { await Clipboard.setStringAsync(`https://snapnow.app/post/${post.id}`); setOptionsVisible(false); Alert.alert('Copy Link', 'Link copied to clipboard'); }}>
                  <Text style={styles.optionText}>Copy Link</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionItem} onPress={() => { setOptionsVisible(false); Alert.alert('Embed', 'Embed is not implemented'); }}>
                  <Text style={styles.optionText}>Embed</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionItem} onPress={() => { setOptionsVisible(false); Alert.alert('About', `About account ${displayUsername}`); }}>
                  <Text style={styles.optionText}>About this Account</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity style={styles.optionItem} onPress={() => setOptionsVisible(false)}>
              <Text style={[styles.optionText, styles.optionCancel]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

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
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
    gap: SPACING.md,
  },
  statText: {
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
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
  hashtagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
  },
  hashtag: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.blue,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  optionsCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 8,
  },
  optionItem: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    color: '#262626',
  },
  optionDanger: {
    color: '#ED4956',
    fontWeight: '700',
  },
  optionCancel: {
    color: '#262626',
    fontWeight: '600',
  },
});
