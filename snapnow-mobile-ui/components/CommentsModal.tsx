import { Ionicons } from "@expo/vector-icons"
import { useEffect, useState } from "react"
import {
    ActivityIndicator,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { auth } from "../config/firebase"
import { addComment, deleteComment, getPostComments } from "../services/comments"
import type { Comment } from "../types"
import CommentItem from './CommentItem'

interface CommentsModalProps {
  visible: boolean
  postId: string
  onClose: () => void
}

export default function CommentsModal({ visible, postId, onClose }: CommentsModalProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

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
    if (!commentText.trim() || !auth.currentUser) return

    setSubmitting(true)
    try {
      const commentId = await addComment(
        postId,
        auth.currentUser.uid,
        auth.currentUser.displayName || auth.currentUser.email || "user",
        auth.currentUser.photoURL || undefined,
        commentText,
      )

      // Add comment to local state
      const newComment: Comment = {
        id: commentId,
        postId,
        userId: auth.currentUser.uid,
        username: auth.currentUser.displayName || auth.currentUser.email || "user",
        userProfileImage: auth.currentUser.photoURL || undefined,
        text: commentText.trim(),
        likesCount: 0,
        isLiked: false,
        createdAt: new Date(),
      }

      setComments([newComment, ...comments])
      setCommentText("")
    } catch (error) {
      console.error("Error adding comment:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId, postId)
      setComments(comments.filter((c) => c.id !== commentId))
    } catch (error) {
      console.error("Error deleting comment:", error)
    }
  }

  const handleReply = (commentId: string, username: string) => {
    setCommentText(`@${username} `)
  }

  const renderComment = ({ item }: { item: Comment }) => {
    return (
      <CommentItem comment={item} onDelete={handleDeleteComment} onReply={handleReply} />
    )
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
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

        <KeyboardAvoidingView behavior="padding" style={styles.inputContainer}>
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
          <TextInput
            style={styles.input}
            placeholder="Add a comment..."
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            onPress={handleAddComment}
            disabled={!commentText.trim() || submitting}
            style={styles.sendButton}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#0095f6" />
            ) : (
              <Text style={[styles.sendButtonText, !commentText.trim() && styles.sendButtonTextDisabled]}>Post</Text>
            )}
          </TouchableOpacity>
        </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#efefef",
  },
  headerTitle: {
    fontSize: 16,
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
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#8e8e8e",
    textAlign: "center",
  },
  commentsList: {
    paddingVertical: 8,
  },
  commentItem: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "flex-start",
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    backgroundColor: "#f0f0f0",
  },
  avatarPlaceholder: {
    backgroundColor: "#DBDBDB",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  commentUsername: {
    fontWeight: "600",
    fontSize: 14,
    marginRight: 8,
  },
  commentTime: {
    fontSize: 12,
    color: "#8e8e8e",
  },
  commentText: {
    fontSize: 14,
    lineHeight: 18,
    color: "#262626",
  },
  commentLikes: {
    fontSize: 12,
    color: "#8e8e8e",
    marginTop: 4,
  },
  deleteButton: {
    padding: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#efefef",
    backgroundColor: "#fff",
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    backgroundColor: "#f0f0f0",
  },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fafafa",
    borderRadius: 20,
    fontSize: 14,
  },
  sendButton: {
    marginLeft: 12,
    paddingHorizontal: 8,
  },
  sendButtonText: {
    color: "#0095f6",
    fontWeight: "600",
    fontSize: 14,
  },
  sendButtonTextDisabled: {
    opacity: 0.3,
  },
})
