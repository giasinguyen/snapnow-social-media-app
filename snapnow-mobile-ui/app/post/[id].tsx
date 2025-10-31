import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthService } from '../../services/authService';
import { addComment, getPostComments } from '../../services/comments';
import { likePost, unlikePost } from '../../services/likes';
import { getPost } from '../../services/posts';
import { UserService } from '../../services/user';
import { Comment, Post } from '../../types';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [displayUsername, setDisplayUsername] = useState('');
  const [displayUserImage, setDisplayUserImage] = useState('');
  const heartScale = useState(new Animated.Value(0))[0];
  const [showHeart, setShowHeart] = useState(false);
  let lastTap = useRef<number>(0);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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
        setPost(postData);
      }
      setComments(commentsData);
      setCurrentUserId(profile?.id || '');
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
        setPost({
          ...post,
          isLiked: false,
          likes: (post.likes || 0) - 1,
        });
      } else {
        await likePost(
          currentUserId,
          post.id,
          profile?.username || 'Anonymous',
          profile?.profileImage
        );
        setPost({
          ...post,
          isLiked: true,
          likes: (post.likes || 0) + 1,
        });
      }
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
    }
    lastTap.current = now;
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return formatDistanceToNow(d, { addSuffix: true });
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#262626" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post</Text>
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#262626" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Post Header */}
          <View style={styles.postHeader}>
            <View style={styles.userInfo}>
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
            </View>
          </View>

          {/* Post Image */}
          {post.imageUrl && (
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
                      style={{
                        textShadowColor: 'rgba(0,0,0,0.35)',
                        textShadowRadius: 8,
                      }}
                    />
                  </Animated.View>
                )}
              </View>
            </TouchableWithoutFeedback>
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
          {post.caption && (
            <View style={styles.captionContainer}>
              <Text style={styles.captionUsername}>{displayUsername} </Text>
              <Text style={styles.captionText}>{post.caption}</Text>
            </View>
          )}

          {/* Hashtags */}
          {post.hashtags && post.hashtags.length > 0 && (
            <View style={styles.hashtagsContainer}>
              {post.hashtags.map((tag, index) => (
                <Text key={index} style={styles.hashtag}>
                  #{tag}{' '}
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
                  <Image
                    source={{
                      uri: comment.userProfileImage || 'https://i.pravatar.cc/150?img=2',
                    }}
                    style={styles.commentAvatar}
                  />
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
          <Image
            source={{
              uri: displayUserImage || 'https://i.pravatar.cc/150?img=1',
            }}
            style={styles.commentInputAvatar}
          />
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
});
