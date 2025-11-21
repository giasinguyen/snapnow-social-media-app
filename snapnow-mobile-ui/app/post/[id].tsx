import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';
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
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CommentItem from '../../components/CommentItem';
import MentionInput from '../../components/MentionInput';
import MultiImageViewer from '../../components/MultiImageViewer';
import { useTheme } from '../../contexts/ThemeContext';
import { AuthService } from '../../services/authService';
import { addComment, deleteComment, getPostComments } from '../../services/comments';
import { likePost, unlikePost } from '../../services/likes';
import { getPost, getPostSavesCount, hasUserBookmarkedPost, savePost, unsavePost } from '../../services/posts';
import { UserService } from '../../services/user';
import { Comment, Post } from '../../types';

export default function PostDetailScreen() {
  const { id, imageIndex } = useLocalSearchParams<{ id: string; imageIndex?: string }>();
  const router = useRouter();
  const { colors } = useTheme();
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
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [savesCount, setSavesCount] = useState(0);
  const [commentImage, setCommentImage] = useState<string | null>(null);
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
        
        // Check bookmark status
        const isBookmarked = profile?.id ? await hasUserBookmarkedPost(profile.id, postData.id) : false;
        const realSavesCount = await getPostSavesCount(postData.id);
        
        setPost({
          ...postData,
          likes: realLikesCount,
          isLiked: isLiked
        });
        
        setBookmarked(isBookmarked);
        setSavesCount(realSavesCount);
        
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

  const handleBookmark = async () => {
    if (!post || !currentUserId) return;
    
    try {
      const newBookmarkedState = !bookmarked;
      setBookmarked(newBookmarkedState);
      setSavesCount(prev => newBookmarkedState ? prev + 1 : prev - 1);

      // Save or unsave the post
      if (newBookmarkedState) {
        await savePost(post.id, currentUserId);
      } else {
        await unsavePost(post.id, currentUserId);
      }

      // Get the real saves count from database
      const realSavesCount = await getPostSavesCount(post.id);
      setSavesCount(realSavesCount);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      // Revert on error
      setBookmarked(bookmarked);
      Alert.alert('Error', 'Failed to save post. Please try again.');
    }
  };

  const pickCommentImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCommentImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleComment = async () => {
    if ((!commentText.trim() && !commentImage) || !post || !currentUserId) return;

    try {
      setSubmittingComment(true);
      const profile = await AuthService.getCurrentUserProfile();
      
      await addComment(
        post.id,
        currentUserId,
        profile?.username || 'Anonymous',
        profile?.profileImage,
        commentText.trim(),
        replyingTo?.id, // Pass the parent comment ID if replying
        commentImage || undefined // imageUrl
      );

      // Extract mentions and send notifications
      const mentionRegex = /@(\w+)/g;
      const mentions = commentText.match(mentionRegex);
      
      if (mentions && mentions.length > 0) {
        const { UserService } = await import('../../services/user');
        const { createNotification } = await import('../../services/notifications');
        
        console.log('Found mentions in comment:', mentions);
        
        // Get the parent comment owner ID to avoid duplicate notifications
        let parentCommentOwnerId: string | null = null;
        if (replyingTo?.id) {
          try {
            const { getDoc, doc } = await import('firebase/firestore');
            const { db } = await import('../../config/firebase');
            const parentCommentDoc = await getDoc(doc(db, 'comments', replyingTo.id));
            if (parentCommentDoc.exists()) {
              parentCommentOwnerId = parentCommentDoc.data().userId;
            }
          } catch (error) {
            console.error('Error getting parent comment owner:', error);
          }
        }
        
        for (const mention of mentions) {
          const username = mention.substring(1); // Remove @
          try {
            const mentionedUser = await UserService.getUserByUsername(username);
            console.log('Looking up user:', username, 'Found:', mentionedUser?.id);
            
            // Skip if mentioning yourself, or if this user is already getting a reply notification
            if (mentionedUser && 
                mentionedUser.id !== currentUserId && 
                mentionedUser.id !== parentCommentOwnerId) {
              // Send notification to mentioned user
              console.log('Sending mention notification to:', mentionedUser.id);
              await createNotification(
                mentionedUser.id,
                'mention',
                currentUserId,
                profile?.username || 'Anonymous',
                profile?.profileImage,
                post.id,
                post.imageUrls?.[0] || post.imageUrl,
                commentText.trim()
              );
              console.log('Mention notification sent successfully');
            } else if (mentionedUser?.id === parentCommentOwnerId) {
              console.log('Skipping mention notification - user already getting reply notification');
            }
          } catch (error) {
            console.error(`Failed to notify @${username}:`, error);
          }
        }
      }

      // Reload comments
      const updatedComments = await getPostComments(post.id);
      setComments(updatedComments);
      setCommentText('');
      setCommentImage(null);
      setReplyingTo(null); // Clear reply state
      
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
      // Always navigate to user profile page (even for own profile) to show back button
      router.push(`/user/${post.userId}` as any);
    }
  };

  const handleReply = (commentId: string, username: string) => {
    // Find the comment being replied to
    const findComment = (comments: Comment[], id: string): Comment | null => {
      for (const comment of comments) {
        if (comment.id === id) return comment
        if (comment.replies) {
          const found = findComment(comment.replies, id)
          if (found) return found
        }
      }
      return null
    }

    const targetComment = findComment(comments, commentId)
    
    // If replying to a reply, use the parent comment ID to keep replies flat
    const parentId = targetComment?.parentCommentId || commentId

    setReplyingTo({ id: parentId, username })
    setCommentText(`@${username} `)
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId, post?.id || '')
      // Reload comments to get updated structure
      const commentsData = await getPostComments(post?.id || '')
      setComments(commentsData)
    } catch (error) {
      console.error("Error deleting comment:", error)
    }
  };

  const handleCancelReply = () => {
    setReplyingTo(null)
    setCommentText("")
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

  // Function to render text with clickable mentions
  const renderTextWithMentions = (text: string) => {
    const parts = text.split(/(@\w+)/g);
    
    return (
      <Text style={[styles.captionText, { color: colors.textPrimary }]}>
        {parts.map((part, index) => {
          if (part.startsWith('@')) {
            const username = part.substring(1);
            return (
              <Text
                key={index}
                style={{ fontWeight: '700', color: colors.textPrimary }}
                onPress={async () => {
                  try {
                    const user = await UserService.getUserByUsername(username);
                    if (user && user.id) {
                      router.push(`/user/${user.id}` as any);
                    } else {
                      Alert.alert('User not found', `@${username} does not exist`);
                    }
                  } catch (error) {
                    console.error('Error finding user:', error);
                    Alert.alert('Error', 'Failed to load user profile');
                  }
                }}
              >
                {part}
              </Text>
            );
          }
          return <Text key={index}>{part}</Text>;
        })}
      </Text>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.backgroundWhite, borderBottomColor: colors.borderLight }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Post</Text>
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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.backgroundWhite, borderBottomColor: colors.borderLight }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Post</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="image-outline" size={64} color="#DBDBDB" />
          <Text style={[styles.emptyText, { color: colors.textPrimary }]}>Post not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.backgroundWhite, borderBottomColor: colors.borderLight }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Post</Text>
          <TouchableOpacity style={styles.moreButton} onPress={() => setOptionsVisible(true)}>
            <Ionicons name="ellipsis-horizontal" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={[styles.content, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
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
                <Text style={[styles.username, { color: colors.textPrimary }]}>{displayUsername || 'Anonymous'}</Text>
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
                  color={post.isLiked ? '#FF3B30' : colors.textPrimary}
                />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => scrollViewRef.current?.scrollToEnd({ animated: true })} 
                style={styles.actionButton}
              >
                <Ionicons name="chatbubble-outline" size={26} color={colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="paper-plane-outline" size={26} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={handleBookmark} style={styles.actionButton}>
              <Ionicons 
                name={bookmarked ? 'bookmark' : 'bookmark-outline'} 
                size={26} 
                color={colors.textPrimary} 
              />
            </TouchableOpacity>
          </View>

          {/* Likes Count */}
          {post.likes ? (
            <Text style={[styles.likesCount, { color: colors.textPrimary }]}>
              {post.likes.toLocaleString()} {post.likes === 1 ? 'like' : 'likes'} 
            </Text>
          ) : null}

          {/* Saves Count */}
          {/* {savesCount > 0 && (
            <Text style={styles.savesCount}>
              {savesCount.toLocaleString()} {savesCount === 1 ? 'save' : 'saves'}
            </Text>
          )} */}

{/* 
          <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8 }}>
            {post.likes ? (
              <Text style={styles.likesCount}>
                {post.likes.toLocaleString()} {post.likes === 1 ? 'like' : 'likes'}
              </Text>
            ) : null}
            {savesCount > 0 && (
              <Text style={[styles.savesCount, { marginLeft: 10 }]}>
                {savesCount.toLocaleString()} {savesCount === 1 ? 'save' : 'saves'}
              </Text>
            )}
          </View> */}



          {/* Caption */}
          {post.caption && removeHashtagsFromText(post.caption).length > 0 && (
            <View style={styles.captionContainer}>
              <Text style={[styles.captionUsername, { color: colors.textPrimary }]}>{displayUsername} </Text>
              {renderTextWithMentions(removeHashtagsFromText(post.caption))}
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
          <View style={[styles.commentsSection, { borderTopColor: colors.borderLight }]}>
            <Text style={[styles.commentsTitle, { color: colors.textPrimary }]}>
              Comments ({comments.length})
            </Text>
            
            {comments.length === 0 ? (
              <View style={styles.noComments}>
                <Text style={styles.noCommentsText}>No comments yet</Text>
                <Text style={styles.noCommentsSubtext}>Be the first to comment!</Text>
              </View>
            ) : (
              comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onDelete={handleDeleteComment}
                  onReply={handleReply}
                  onUserPress={(userId: string) => {
                    // Always navigate to user profile page (even for own profile) to show back button
                    router.push(`/user/${userId}` as any);
                  }}
                />
              ))
            )}
          </View>
        </ScrollView>

        {/* Reply indicator */}
        {replyingTo && (
          <View style={styles.replyIndicator}>
            <View style={styles.replyIndicatorContent}>
              <Ionicons name="arrow-undo-outline" size={14} color="#8e8e8e" style={styles.replyIcon} />
              <Text style={styles.replyingText}>
                Replying to @{replyingTo.username}
              </Text>
            </View>
            <TouchableOpacity onPress={handleCancelReply} style={styles.cancelReplyBtn}>
              <Ionicons name="close" size={16} color="#8e8e8e" />
            </TouchableOpacity>
          </View>
        )}

        {/* Comment Input */}
        <View style={styles.commentInputContainer}>
          {currentUserAvatar ? (
            <Image
              source={{ uri: currentUserAvatar }}
              style={styles.commentInputAvatar}
            />
          ) : (
            <View style={[styles.commentInputAvatar, { backgroundColor: '#E1E8ED', justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ fontSize: 14, color: '#657786' }}>?</Text>
            </View>
          )}
          <View style={styles.commentInputWrapper}>
            {commentImage && (
              <View style={styles.commentImagePreview}>
                <Image source={{ uri: commentImage }} style={styles.commentImageThumb} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setCommentImage(null)}
                >
                  <Ionicons name="close-circle" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
            <MentionInput
              style={styles.commentInput}
              placeholder={replyingTo ? `Reply to @${replyingTo.username}...` : "Add a comment..."}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
            />
          </View>
          <TouchableOpacity
            onPress={pickCommentImage}
            style={styles.imageButton}
          >
            <Ionicons name="image-outline" size={24} color="#8E8E8E" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleComment}
            disabled={(!commentText.trim() && !commentImage) || submittingComment}
            style={styles.sendButton}
          >
            {submittingComment ? (
              <ActivityIndicator size="small" color="#0095F6" />
            ) : (
              <Text
                style={[
                  styles.sendButtonText,
                  (!commentText.trim() && !commentImage) && styles.sendButtonTextDisabled,
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
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  savesCount: {
    fontSize: 14,
    fontWeight: '600',
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
  },
  captionText: {
    fontSize: 14,
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
  viewCommentsButton: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  viewCommentsText: {
    color: '#8e8e8e',
    fontSize: 14,
  },
  commentsSection: {
    paddingHorizontal: 4,
    paddingVertical: 12,
    borderTopWidth: 1,
    marginTop: 8,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: '600',
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
    width: 35,
    height: 35,
    borderRadius: 17.5,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
  },
  commentTime: {
    fontSize: 13,
    color: '#8E8E8E',
  },
  commentText: {
    fontSize: 14,
    color: '#262626',
    lineHeight: 20,
  },
  commentImage: {
    width: 132,
    height: 132,
    borderRadius: 9,
    marginTop: 8,
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
    width: 35,
    height: 35,
    borderRadius: 17.5,
  },
  commentInputWrapper: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  commentInput: {
    fontSize: 14,
    color: '#262626',
    maxHeight: 80,
  },
  imageButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
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
  commentImagePreview: {
    position: 'relative',
    marginBottom: 8,
  },
  commentImageThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 10,
  },
  replyIndicator: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f8f9fa",
    borderTopWidth: 1,
    borderTopColor: "#efefef",
  },
  replyIndicatorContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  replyIcon: {
    marginRight: 6,
  },
  replyingText: {
    fontSize: 13,
    color: "#262626",
    fontWeight: "500",
  },
  cancelReplyBtn: {
    padding: 4,
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
