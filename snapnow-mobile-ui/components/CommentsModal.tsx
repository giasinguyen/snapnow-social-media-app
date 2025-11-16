import { Ionicons } from "@expo/vector-icons"
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import { useEffect, useRef, useState } from "react"
import {
    ActivityIndicator,
    Alert,
    Animated,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    PanResponder,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { auth } from "../config/firebase"
import { uploadToCloudinary } from "../services/cloudinary"
import { addComment, deleteComment, getPostComments } from "../services/comments"
import type { Comment } from "../types"
import CommentItem from './CommentItem'
import MentionInput from './MentionInput'

interface CommentsModalProps {
  visible: boolean
  postId: string
  onClose: () => void
}

export default function CommentsModal({ visible, postId, onClose }: CommentsModalProps) {
  const router = useRouter()
  const [comments, setComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const inputRef = useRef<TextInput>(null)
  const translateY = useRef(new Animated.Value(0)).current

  // Pan responder for swipe down to close
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to vertical swipes
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && gestureState.dy > 0
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy)
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          // Swipe down threshold reached, close modal
          Animated.timing(translateY, {
            toValue: 500,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(0)
            onClose()
          })
        } else {
          // Reset position
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start()
        }
      },
    })
  ).current

  useEffect(() => {
    if (visible) {
      loadComments()
    }
  }, [visible, postId])

  const loadComments = async () => {
    setLoading(true)
    try {
      const fetchedComments = await getPostComments(postId)
      setComments(fetchedComments)
    } catch (error) {
      console.error("Error loading comments:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async () => {
    if ((!commentText.trim() && !selectedImage) || !auth.currentUser) return

    console.log('Adding comment:', { 
      text: commentText, 
      isReply: !!replyingTo, 
      parentId: replyingTo?.id,
      hasImage: !!selectedImage
    })

    setSubmitting(true)
    try {
      let imageUrl: string | undefined = undefined

      // Upload image if selected
      if (selectedImage) {
        const uploadResult = await uploadToCloudinary(selectedImage)
        imageUrl = uploadResult.secure_url
      }

      const commentId = await addComment(
        postId,
        auth.currentUser.uid,
        auth.currentUser.displayName || auth.currentUser.email || "user",
        auth.currentUser.photoURL || undefined,
        commentText,
        replyingTo?.id, // Pass the parent comment ID if replying
        imageUrl
      )

      // Extract mentions and send notifications
      const mentionRegex = /@(\w+)/g;
      const mentions = commentText.match(mentionRegex);
      
      if (mentions && mentions.length > 0) {
        const { UserService } = await import('../services/user');
        const { createNotification } = await import('../services/notifications');
        const { getPost } = await import('../services/posts');
        
        console.log('Found mentions in comment:', mentions);
        
        // Get post data for image URL
        const postData = await getPost(postId);
        
        // Get the parent comment owner ID to avoid duplicate notifications
        let parentCommentOwnerId: string | null = null;
        if (replyingTo?.id) {
          try {
            const { getDoc, doc } = await import('firebase/firestore');
            const { db } = await import('../config/firebase');
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
                mentionedUser.id !== auth.currentUser.uid && 
                mentionedUser.id !== parentCommentOwnerId) {
              // Send notification to mentioned user
              console.log('Sending mention notification to:', mentionedUser.id);
              await createNotification(
                mentionedUser.id,
                'mention',
                auth.currentUser.uid,
                auth.currentUser.displayName || auth.currentUser.email || "user",
                auth.currentUser.photoURL || undefined,
                postId,
                postData?.imageUrls?.[0] || postData?.imageUrl,
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

      // For now, reload comments to get the updated structure with nested replies
      await loadComments()
      
      setCommentText("")
      setSelectedImage(null) // Clear selected image
      setReplyingTo(null) // Clear reply state
    } catch (error) {
      console.error("Error adding comment:", error)
      Alert.alert('Error', 'Failed to add comment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId, postId)
      // Reload comments to get updated structure
      await loadComments()
    } catch (error) {
      console.error("Error deleting comment:", error)
    }
  }

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
    // Focus the input to show keyboard
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }

  const handleCancelReply = () => {
    setReplyingTo(null)
    setCommentText("")
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
  }

  const handleCameraPress = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to add images to comments.')
        return
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri)
      }
    } catch (error) {
      console.error('Error picking image:', error)
      Alert.alert('Error', 'Failed to pick image. Please try again.')
    }
  }

  const renderComment = ({ item }: { item: Comment }) => {
    const handleUserPress = (userId: string) => {
      // Always navigate to user profile page (even for own profile) to show back button
      router.push(`/user/${userId}` as any)
    }
    
    return (
      <CommentItem comment={item} onDelete={handleDeleteComment} onReply={handleReply} onUserPress={handleUserPress} />
    )
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Animated.View 
          style={[
            styles.modalContent,
            { transform: [{ translateY }] }
          ]}
        >
          {/* Drag indicator */}
          <View {...panResponder.panHandlers} style={styles.dragIndicatorContainer}>
            <View style={styles.dragIndicator} />
          </View>

          <View style={styles.header}>
            <Text style={styles.headerTitle}>Comments</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#262626" />
            </TouchableOpacity>
          </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#262626" />
          </View>
        ) : comments.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubble-outline" size={64} color="#c7c7c7" />
            <Text style={styles.emptyTitle}>No comments yet</Text>
            <Text style={styles.emptySubtitle}>Be the first to comment!</Text>
          </View>
        ) : (
          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.commentsList}
          />
        )}

        {/* Selected image preview */}
        {selectedImage && (
          <View style={styles.imagePreview}>
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
            <TouchableOpacity onPress={handleRemoveImage} style={styles.removeImageBtn}>
              <Ionicons name="close-circle" size={24} color="#ed4956" />
            </TouchableOpacity>
          </View>
        )}

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

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inputContainer}>
          {auth.currentUser?.photoURL && auth.currentUser.photoURL.trim() !== '' ? (
            <Image
              source={{ uri: auth.currentUser.photoURL }}
              style={styles.inputAvatar}
            />
          ) : (
            <View style={[styles.inputAvatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {auth.currentUser?.displayName?.slice(0, 2).toUpperCase() || 
                 auth.currentUser?.email?.slice(0, 2).toUpperCase() || '??'}
              </Text>
            </View>
          )}
          <View style={styles.inputWrapper}>
            <MentionInput
              ref={inputRef}
              style={styles.input}
              placeholder={replyingTo ? `Reply to @${replyingTo.username}...` : "Add a comment..."}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
            />
          </View>
          <TouchableOpacity style={styles.cameraButton} onPress={handleCameraPress}>
            <Ionicons name="image-outline" size={24} color="#8e8e8e" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleAddComment}
            disabled={(!commentText.trim() && !selectedImage) || submitting}
            style={styles.sendButton}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#0095f6" />
            ) : (
              <Text style={[styles.sendButtonText, (!commentText.trim() && !selectedImage) && styles.sendButtonTextDisabled]}>Post</Text>
            )}
          </TouchableOpacity>
        </KeyboardAvoidingView>
        </Animated.View>
      </SafeAreaView>
    </Modal>
  )
}

function formatTimestamp(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#efefef",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#262626",
    marginTop: 18,
    marginBottom: 9,
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#8e8e8e",
    textAlign: "center",
  },
  commentsList: {
    paddingVertical: 9,
  },
  commentItem: {
    flexDirection: "row",
    paddingHorizontal: 18,
    paddingVertical: 13,
    alignItems: "flex-start",
  },
  commentAvatar: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    marginRight: 13,
    backgroundColor: "#f0f0f0",
  },
  avatarPlaceholder: {
    backgroundColor: "#DBDBDB",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  commentUsername: {
    fontWeight: "600",
    fontSize: 15,
    marginRight: 9,
  },
  commentTime: {
    fontSize: 13,
    color: "#8e8e8e",
  },
  commentText: {
    fontSize: 15,
    lineHeight: 20,
    color: "#262626",
  },
  commentLikes: {
    fontSize: 13,
    color: "#8e8e8e",
    marginTop: 5,
  },
  deleteButton: {
    padding: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: "#efefef",
    backgroundColor: "#fff",
  },
  cameraButton: {
    padding: 9,
    marginRight: 9,
  },
  inputAvatar: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    marginRight: 13,
    backgroundColor: "#f0f0f0",
  },
  inputWrapper: {
    flex: 1,
  },
  input: {
    maxHeight: 110,
    paddingVertical: 9,
    paddingHorizontal: 13,
    backgroundColor: "#fafafa",
    borderRadius: 22,
    fontSize: 15,
  },
  sendButton: {
    marginLeft: 13,
    paddingHorizontal: 9,
  },
  sendButtonText: {
    color: "#0095f6",
    fontWeight: "600",
    fontSize: 15,
  },
  sendButtonTextDisabled: {
    opacity: 0.3,
  },
  replyIndicator: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 9,
    backgroundColor: "#f8f9fa",
    borderTopWidth: 1,
    borderTopColor: "#efefef",
  },
  replyIndicatorContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  replyIcon: {
    marginRight: 7,
  },
  replyingText: {
    fontSize: 14,
    color: "#262626",
    fontWeight: "500",
  },
  cancelReplyBtn: {
    padding: 5,
  },
  imagePreview: {
    paddingHorizontal: 18,
    paddingVertical: 13,
    backgroundColor: "#f8f9fa",
    borderTopWidth: 1,
    borderTopColor: "#efefef",
  },
  previewImage: {
    width: 110,
    height: 110,
    borderRadius: 9,
    alignSelf: "flex-start",
  },
  removeImageBtn: {
    position: "absolute",
    top: 9,
    right: 18,
  },
  modalContent: {
    flex: 1,
    backgroundColor: "#fff",
  },
  dragIndicatorContainer: {
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  dragIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#d1d5db",
  },
})
