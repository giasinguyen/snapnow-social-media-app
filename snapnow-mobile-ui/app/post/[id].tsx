import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MultiImageViewer from '../../components/MultiImageViewer';
import { AuthService } from '../../services/authService';
import { addComment, getPostComments } from '../../services/comments';
import { likePost, unlikePost } from '../../services/likes';
import { getPost } from '../../services/posts';
import { UserService } from '../../services/user';
import { Comment, Post } from '../../types';

export default function PostDetailScreen() {
  const { id, imageIndex } = useLocalSearchParams<{ id: string; imageIndex?: string }>();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string>('');
  const [displayUsername, setDisplayUsername] = useState('');
  const [displayUserImage, setDisplayUserImage] = useState('');
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentZoom, setCurrentZoom] = useState(1);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [isOwnPost, setIsOwnPost] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const heartScale = useState(new Animated.Value(0))[0];
  const [showHeart, setShowHeart] = useState(false);
  let lastTap = useRef<number>(0);
  let lastFullscreenTap = useRef<number>(0);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Set initial image index from URL parameter
  useEffect(() => {
    if (imageIndex) {
      const index = parseInt(imageIndex, 10);
      if (!isNaN(index) && index >= 0) {
        setCurrentImageIndex(index);
      }
    }
  }, [imageIndex]);

  // Fetch fresh user data when post loads
  useEffect(() => {
    if (post?.userId) {
      (async () => {
        try {
          const user = await UserService.getUserProfile(post.userId!);
          if (user) {
            setDisplayUsername(user.username || post.username || '');
            setDisplayUserImage(user.profileImage || post.userImage || '');
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setDisplayUsername(post.username || '');
          setDisplayUserImage(post.userImage || '');
        }
      })();
    }
  }, [post?.userId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [postData, commentsData, profile] = await Promise.all([
        getPost(id),
        getPostComments(id),
        AuthService.getCurrentUserProfile(),
      ]);
      
      if (postData) {
        // Get real-time likes count from the likes collection
        const { getPostLikesCount, hasUserLikedPost } = await import('../../services/likes');
        const realLikesCount = await getPostLikesCount(postData.id);
        const isLiked = profile?.id ? await hasUserLikedPost(profile.id, postData.id) : false;
        
        setPost({
          ...postData,
          likes: realLikesCount,
          isLiked: isLiked
        });
        
        // Check if this is user's own post
        setIsOwnPost(profile?.id === postData.userId);
      }
      setComments(commentsData);
      setCurrentUserId(profile?.id || '');
      setCurrentUserAvatar(profile?.profileImage || '');
    } catch (error) {
      console.error('Failed to load post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!post || !currentUserId) return;
    
    try {
      const profile = await AuthService.getCurrentUserProfile();
      if (post.isLiked) {
        await unlikePost(currentUserId, post.id);
      } else {
        await likePost(
          currentUserId,
          post.id,
          profile?.username || 'Anonymous',
          profile?.profileImage
        );
      }
      
      // Get updated likes count and like status from the database
      const { getPostLikesCount, hasUserLikedPost } = await import('../../services/likes');
      const [updatedLikesCount, isLiked] = await Promise.all([
        getPostLikesCount(post.id),
        hasUserLikedPost(currentUserId, post.id)
      ]);
      
      setPost({
        ...post,
        isLiked: isLiked,
        likes: updatedLikesCount,
      });
    } catch (error) {
      console.error('Failed to like/unlike post:', error);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || !post || !currentUserId) return;

    try {
      setSubmittingComment(true);
      const profile = await AuthService.getCurrentUserProfile();
      
      await addComment(
        post.id,
        currentUserId,
        profile?.username || 'Anonymous',
        profile?.profileImage,
        commentText.trim()
      );

      // Reload comments
      const updatedComments = await getPostComments(post.id);
      setComments(updatedComments);
      setCommentText('');
      
      // Dismiss keyboard
      Keyboard.dismiss();
      
      // Update comments count
      setPost({
        ...post,
        commentsCount: (post.commentsCount || 0) + 1,
      });
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setSubmittingComment(false);
    }
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
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => setShowHeart(false));
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      // Double tap - like
      triggerLikeAnimation();
      if (!post?.isLiked) {
        handleLike();
      }
    } else {
      // Single tap - show fullscreen after delay
      setTimeout(() => {
        if (Date.now() - lastTap.current >= DOUBLE_TAP_DELAY) {
          setCurrentZoom(1); // Reset zoom when opening fullscreen
          setShowFullscreen(true);
        }
      }, DOUBLE_TAP_DELAY);
    }
    lastTap.current = now;
  };

  const handleImagePress = (imageIndex: number = 0) => {
    setCurrentImageIndex(imageIndex);
    setCurrentZoom(1); // Reset zoom when opening fullscreen
    setShowFullscreen(true);
  };

  const handleUserPress = () => {
    if (post?.userId) {
      router.push(`/user/${post.userId}` as any);
    }
  };

  const handleDeletePost = async () => {
    if (!post || !currentUserId) return;
    
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
                const { deletePost } = await import('../../services/posts');
                await deletePost(post.id, currentUserId);
                
                Alert.alert('Success', 'Post deleted successfully', [
                  {
                    text: 'OK',
                    onPress: () => router.back() // Navigate back after successful deletion
                  }
                ]);
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
  };

  const handleFullscreenDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastFullscreenTap.current < DOUBLE_TAP_DELAY) {
      // Double tap - toggle zoom
      const newZoom = currentZoom === 1 ? 2 : 1;
      setCurrentZoom(newZoom);
    } else {
      // Single tap - close if not zoomed
      setTimeout(() => {
        if (Date.now() - lastFullscreenTap.current >= DOUBLE_TAP_DELAY && currentZoom <= 1.1) {
          setShowFullscreen(false);
        }
      }, DOUBLE_TAP_DELAY);
    }
    lastFullscreenTap.current = now;
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return formatDistanceToNow(d, { addSuffix: true });
  };

  // Function to remove hashtags from caption text
  const removeHashtagsFromText = (text: string) => {
    return text.replace(/#\w+/g, '').replace(/\s+/g, ' ').trim();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#262626" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0095F6" />
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#262626" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="image-outline" size={64} color="#DBDBDB" />
          <Text style={styles.emptyText}>Post not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#262626" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post</Text>
          <TouchableOpacity style={styles.moreButton} onPress={() => setOptionsVisible(true)}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#262626" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Post Header */}
          <View style={styles.postHeader}>
            <TouchableOpacity style={styles.userInfo} onPress={handleUserPress}>
              <Image
                source={{
                  uri: displayUserImage || 'https://i.pravatar.cc/150?img=1',
                }}
                style={styles.avatar}
              />
              <View style={styles.userDetails}>
                <Text style={styles.username}>{displayUsername || 'Anonymous'}</Text>
                <Text style={styles.timestamp}>{formatDate(post.createdAt)}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Post Image(s) */}
          {((post.imageUrls && post.imageUrls.length > 0) || post.imageUrl) && (
            <View style={{ position: 'relative' }}>
              <MultiImageViewer
                imageUrls={post.imageUrls && post.imageUrls.length > 0 ? post.imageUrls : (post.imageUrl ? [post.imageUrl] : [])}
                onDoublePress={() => {
                  triggerLikeAnimation();
                  if (!post.isLiked) {
                    handleLike();
                  }
                }}
                onSinglePress={handleImagePress}
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
                    style={{
                      textShadowColor: 'rgba(0,0,0,0.35)',
                      textShadowRadius: 8,
                    }}
                  />
                </Animated.View>
              )}
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <View style={styles.leftActions}>
              <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
                <Ionicons
                  name={post.isLiked ? 'heart' : 'heart-outline'}
                  size={28}
                  color={post.isLiked ? '#FF3B30' : '#262626'}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="chatbubble-outline" size={26} color="#262626" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="paper-plane-outline" size={26} color="#262626" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="bookmark-outline" size={26} color="#262626" />
            </TouchableOpacity>
          </View>

          {/* Likes Count */}
          {post.likes ? (
            <Text style={styles.likesCount}>
              {post.likes.toLocaleString()} {post.likes === 1 ? 'like' : 'likes'}
            </Text>
          ) : null}

          {/* Caption */}
          {post.caption && removeHashtagsFromText(post.caption).length > 0 && (
            <View style={styles.captionContainer}>
              <Text style={styles.captionUsername}>{displayUsername} </Text>
              <Text style={styles.captionText}>{removeHashtagsFromText(post.caption)}</Text>
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

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>
              Comments ({comments.length})
            </Text>
            
            {comments.length === 0 ? (
              <View style={styles.noComments}>
                <Text style={styles.noCommentsText}>No comments yet</Text>
                <Text style={styles.noCommentsSubtext}>Be the first to comment!</Text>
              </View>
            ) : (
              comments.map((comment) => (
                <View key={comment.id} style={styles.commentItem}>
                  {comment.userProfileImage ? (
                    <Image
                      source={{ uri: comment.userProfileImage }}
                      style={styles.commentAvatar}
                    />
                  ) : (
                    <View style={[styles.commentAvatar, { backgroundColor: '#E1E8ED' }]}>
                      <Text style={{ fontSize: 20, color: '#657786' }}>
                        {comment.username?.charAt(0).toUpperCase() || '?'}
                      </Text>
                    </View>
                  )}
                  <View style={styles.commentContent}>
                    <View style={styles.commentHeader}>
                      <Text style={styles.commentUsername}>{comment.username}</Text>
                      <Text style={styles.commentTime}>{formatDate(comment.createdAt)}</Text>
                    </View>
                    <Text style={styles.commentText}>{comment.text}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {/* Comment Input */}
        <View style={styles.commentInputContainer}>
          {currentUserAvatar ? (
            <Image
              source={{ uri: currentUserAvatar }}
              style={styles.commentInputAvatar}
            />
          ) : (
            <View style={[styles.commentInputAvatar, { backgroundColor: '#E1E8ED', justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ fontSize: 20, color: '#657786' }}>?</Text>
            </View>
          )}
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment..."
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            onPress={handleComment}
            disabled={!commentText.trim() || submittingComment}
            style={styles.sendButton}
          >
            {submittingComment ? (
              <ActivityIndicator size="small" color="#0095F6" />
            ) : (
              <Text
                style={[
                  styles.sendButtonText,
                  !commentText.trim() && styles.sendButtonTextDisabled,
                ]}
              >
                Post
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Fullscreen Image Modal */}
      <Modal
        visible={showFullscreen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFullscreen(false)}
      >
        <View style={styles.fullscreenContainer}>
          <TouchableOpacity 
            style={styles.fullscreenCloseButton}
            onPress={() => setShowFullscreen(false)}
          >
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          
          {currentZoom > 1 && (
            <View style={styles.zoomIndicator}>
              <Text style={styles.zoomText}>{currentZoom.toFixed(1)}x</Text>
            </View>
          )}
          
          {(() => {
            const images = post?.imageUrls && post.imageUrls.length > 0 ? post.imageUrls : (post?.imageUrl ? [post.imageUrl] : []);
            const currentImage = images[currentImageIndex] || images[0];
            
            return (
              <>
                {/* Image counter for multiple images */}
                {images.length > 1 && (
                  <View style={styles.fullscreenImageCounter}>
                    <Text style={styles.fullscreenCounterText}>
                      {currentImageIndex + 1} of {images.length}
                    </Text>
                  </View>
                )}
                
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  style={styles.fullscreenImageScroll}
                  contentOffset={{ x: currentImageIndex * Dimensions.get('window').width, y: 0 }}
                  onScroll={(event) => {
                    const newIndex = Math.round(event.nativeEvent.contentOffset.x / Dimensions.get('window').width);
                    setCurrentImageIndex(newIndex);
                  }}
                  scrollEventThrottle={16}
                >
                  {images.map((imageUrl, index) => (
                    <ScrollView
                      key={index}
                      style={styles.scrollViewContainer}
                      contentContainerStyle={styles.scrollViewContent}
                      minimumZoomScale={1}
                      maximumZoomScale={3}
                      bouncesZoom={true}
                      showsHorizontalScrollIndicator={false}
                      showsVerticalScrollIndicator={false}
                      centerContent={true}
                    >
                      <TouchableWithoutFeedback onPress={handleFullscreenDoubleTap}>
                        <Image
                          source={{ uri: imageUrl }}
                          style={styles.fullscreenImage}
                          resizeMode="contain"
                        />
                      </TouchableWithoutFeedback>
                    </ScrollView>
                  ))}
                </ScrollView>
              </>
            );
          })()}
        </View>
      </Modal>

      {/* Post options modal */}
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
              </>
            ) : (
              // Options for other users' posts
              <>
                <TouchableOpacity style={styles.optionItem} onPress={() => { setOptionsVisible(false); Alert.alert('Report', 'Report flow not implemented yet'); }}>
                  <Text style={[styles.optionText, styles.optionDanger]}>Report</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionItem} onPress={() => { setOptionsVisible(false); Alert.alert('Unfollow', `Unfollow ${displayUsername} (not implemented)`); }}>
                  <Text style={styles.optionText}>Unfollow</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity style={styles.optionItem} onPress={() => setOptionsVisible(false)}>
              <Text style={[styles.optionText, styles.optionCancel]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#262626',
  },
  moreButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E8E',
    marginTop: 16,
  },
  content: {
    flex: 1,
  },
  postHeader: {
    padding: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
  },
  timestamp: {
    fontSize: 12,
    color: '#8E8E8E',
    marginTop: 2,
  },
  postImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F0F0F0',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  leftActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
  likesCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  captionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  captionUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
  },
  captionText: {
    fontSize: 14,
    color: '#262626',
    flex: 1,
  },
  hashtagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  hashtag: {
    fontSize: 14,
    color: '#0095F6',
  },
  commentsSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
    marginTop: 8,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#262626',
    marginBottom: 16,
  },
  noComments: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noCommentsText: {
    fontSize: 14,
    color: '#8E8E8E',
    fontWeight: '500',
  },
  noCommentsSubtext: {
    fontSize: 12,
    color: '#AAAAAA',
    marginTop: 4,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentContent: {
    flex: 1,
    marginLeft: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentUsername: {
    fontSize: 13,
    fontWeight: '600',
    color: '#262626',
  },
  commentTime: {
    fontSize: 12,
    color: '#8E8E8E',
  },
  commentText: {
    fontSize: 14,
    color: '#262626',
    lineHeight: 18,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
    backgroundColor: '#FFFFFF',
  },
  commentInputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentInput: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
    fontSize: 14,
    color: '#262626',
    maxHeight: 80,
  },
  sendButton: {
    padding: 4,
  },
  sendButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0095F6',
  },
  sendButtonTextDisabled: {
    color: '#B0D4F1',
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
  fullscreenContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
  },
  zoomIndicator: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 15,
  },
  zoomText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  fullscreenImageCounter: {
    position: 'absolute',
    top: 50,
    left: '50%',
    transform: [{ translateX: -50 }],
    zIndex: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 15,
  },
  fullscreenCounterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  fullscreenImageScroll: {
    flex: 1,
    width: '100%',
  },
  fullscreenImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollViewContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
