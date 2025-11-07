import { Ionicons } from '@expo/vector-icons'
import React, { useCallback, useState } from 'react'
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { auth } from '../config/firebase'
import { likeComment, unlikeComment } from '../services/comments'
import { Comment } from '../types'

interface CommentItemProps {
  comment: Comment
  onDelete?: (id: string) => void
  onReply?: (id: string, username: string) => void
  onUserPress?: (userId: string) => void
  isReply?: boolean // To distinguish replies from main comments
  level?: number // Nesting level for indentation
}

export default function CommentItem({ comment, onDelete, onReply, onUserPress, isReply = false, level = 0 }: CommentItemProps) {
  const [liked, setLiked] = useState(!!comment.isLiked)
  const [likesCount, setLikesCount] = useState(comment.likesCount || 0)
  const [showReplies, setShowReplies] = useState(false)
  const [showAllReplies, setShowAllReplies] = useState(false)

  // Debug log to verify component is being rendered
  console.log('CommentItem rendering:', {
    username: comment.username, 
    text: comment.text.slice(0, 20) + '...', 
    isReply,
    hasReplies: !!comment.replies?.length,
    repliesCount: comment.replies?.length || 0
  })

  const repliesCount = comment.replies?.length || 0
  const INITIAL_REPLIES_COUNT = 5
  const visibleReplies = showAllReplies 
    ? comment.replies 
    : comment.replies?.slice(0, INITIAL_REPLIES_COUNT)

  const toggleLike = useCallback(async () => {
    try {
      if (!auth.currentUser) return
      if (liked) {
        await unlikeComment(comment.id)
        setLikesCount((c) => Math.max(0, c - 1))
      } else {
        await likeComment(comment.id)
        setLikesCount((c) => c + 1)
      }
      setLiked((s) => !s)
    } catch (err) {
      console.error('Error toggling comment like', err)
    }
  }, [comment.id, liked])

  const handleReply = () => {
    onReply?.(comment.id, comment.username)
  }

  const handleDelete = () => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete?.(comment.id),
        },
      ]
    )
  }

  const handleUserPress = () => {
    onUserPress?.(comment.userId)
  }

  const isOwn = auth.currentUser && comment.userId === auth.currentUser.uid

  // Function to render text with bold @mentions
  const renderTextWithMentions = (text: string) => {
    const parts = text.split(/(@\w+)/g)
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <Text key={index} style={[styles.mention, isReply && styles.replyMention]}>
            {part}
          </Text>
        )
      }
      return part
    })
  }

  return (
    <View style={styles.container}>
      <View style={[styles.commentWrapper, isReply && styles.replyWrapper]}>
        <TouchableOpacity onPress={handleUserPress}>
          {comment.userProfileImage ? (
            <Image source={{ uri: comment.userProfileImage }} style={[styles.avatar, isReply && styles.replyAvatar]} />
          ) : (
            <View style={[styles.avatar, styles.placeholder, isReply && styles.replyAvatar]}>
              <Text style={[styles.initials, isReply && styles.replyInitials]}>
                {(comment.username || '??').slice(0,2).toUpperCase()}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={[styles.commentHeader, isReply && styles.replyCommentHeader]}>
            <TouchableOpacity onPress={handleUserPress}>
              <Text style={[
                styles.username, 
                isReply && styles.replyUsername
              ]}>
                {comment.username}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.time, isReply && styles.replyTime]}>{formatTime(comment.createdAt)}</Text>
          </View>
          
          <Text style={[
            styles.text, 
            isReply && styles.replyText
          ]}>
            {renderTextWithMentions(comment.text)}
          </Text>
          
          {/* Display comment image if exists */}
          {comment.imageUrl && (
            <Image 
              source={{ uri: comment.imageUrl }} 
              style={[styles.commentImage, isReply && styles.replyCommentImage]} 
            />
          )}
          <View style={styles.metaRow}>
            <TouchableOpacity onPress={toggleLike} style={styles.actionBtn}>
              <View style={styles.actionBtnContent}>
                {liked && <Ionicons name="heart" size={12} color="#ed4956" style={styles.heartIcon} />}
                <Text style={[styles.actionText, isReply && styles.replyActionText, liked && styles.likedText]}>
                  {likesCount > 0 ? `${likesCount} ${likesCount === 1 ? 'like' : 'likes'}` : 'Like'}
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleReply} style={styles.actionBtn}>
              <Text style={[styles.actionText, isReply && styles.replyActionText]}>Reply</Text>
            </TouchableOpacity>
            {isOwn && (
              <TouchableOpacity onPress={handleDelete} style={styles.actionBtn}>
                <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Show replies toggle - only show if there are replies and this is not a reply itself */}
          {!isReply && repliesCount > 0 && (
            <TouchableOpacity 
              onPress={() => setShowReplies(!showReplies)} 
              style={styles.showRepliesBtn}
            >
              <Text style={styles.showRepliesText}>
                {showReplies ? 'Hide replies' : `${repliesCount} ${repliesCount === 1 ? 'reply' : 'replies'}`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Render replies */}
      {!isReply && showReplies && visibleReplies && visibleReplies.length > 0 && (
        <View style={styles.repliesContainer}>
          {visibleReplies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onDelete={onDelete}
              onReply={onReply}
              onUserPress={onUserPress}
              isReply={true}
              level={level + 1}
            />
          ))}
          
          {/* Show "Show more replies" button if there are more than INITIAL_REPLIES_COUNT replies */}
          {!showAllReplies && repliesCount > INITIAL_REPLIES_COUNT && (
            <TouchableOpacity 
              onPress={() => setShowAllReplies(true)} 
              style={styles.showMoreRepliesBtn}
            >
              <Text style={styles.showMoreRepliesText}>
                Show {repliesCount - INITIAL_REPLIES_COUNT} more {repliesCount - INITIAL_REPLIES_COUNT === 1 ? 'reply' : 'replies'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  )
}

function formatTime(date: any) {
  try {
    const d = date?.toDate ? date.toDate() : new Date(date)
    const now = Date.now()
    const diff = Math.floor((now - d.getTime()) / 1000)
    if (diff < 60) return `${diff}s`
    const mins = Math.floor(diff / 60)
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    const days = Math.floor(hrs / 24)
    return `${days}d`
  } catch (err) {
    return ''
  }
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 8, paddingVertical: 9, backgroundColor: '#ffffff' },
  commentWrapper: { flexDirection: 'row', alignItems: 'flex-start' },
  replyWrapper: { 
    paddingLeft: 22, 
    backgroundColor: '#ffffff',
    marginLeft: 44,
    paddingVertical: 7,
    marginTop: 4
  },
  avatar: { width: 35, height: 35, borderRadius: 17.5, marginRight: 13, backgroundColor: '#f0f0f0' },
  replyAvatar: { width: 32, height: 32, borderRadius: 16 }, // Increased from 29 to 32
  placeholder: { justifyContent: 'center', alignItems: 'center' },
  initials: { color: '#fff', fontWeight: '600', fontSize: 13 },
  replyInitials: { color: '#fff', fontWeight: '600', fontSize: 12 }, // Increased from 11 to 12
  content: { flex: 1 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, minHeight: 20 },
  replyCommentHeader: { marginBottom: 3, minHeight: 18 },
  commentLine: { marginBottom: 4, fontSize: 14, lineHeight: 18 },
  replyCommentLine: { fontSize: 13, lineHeight: 16 },
  commentContentRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  username: { fontWeight: '600', marginRight: 7, fontSize: 14, lineHeight: 18, color: '#000000' },
  replyUsername: { fontWeight: '600', marginRight: 4, fontSize: 13.5, lineHeight: 17, color: '#000000' }, // Increased from 13 to 13.5
  time: { color: '#8e8e8e', fontSize: 13, lineHeight: 18, marginRight: 13 },
  replyTime: { color: '#8e8e8e', fontSize: 12.5, lineHeight: 16, marginRight: 13 }, // Increased from 12 to 12.5
  text: { color: '#000000', fontSize: 14, lineHeight: 18, flexShrink: 1 },
  replyText: { color: '#000000', fontSize: 13.5, lineHeight: 17.5, flexShrink: 1 }, // Increased from 13/16 to 13.5/17.5
  mention: { fontWeight: '700', color: '#000000' },
  replyMention: { fontWeight: '700', color: '#000000' },
  commentImage: { 
    width: 132, 
    height: 132, 
    borderRadius: 9, 
    marginTop: 9, 
    marginBottom: 4 
  },
  replyCommentImage: { 
    width: 120, 
    height: 120, 
    borderRadius: 8 
  },
  actionsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  actionBtn: { marginRight: 18 },
  actionBtnContent: { flexDirection: 'row', alignItems: 'center' },
  actionText: { color: '#8e8e8e', fontSize: 13, fontWeight: '600' },
  replyActionText: { color: '#8e8e8e', fontSize: 12.5, fontWeight: '600' }, // Increased from 12 to 12.5
  heartIcon: { marginRight: 4 },
  likedText: { color: '#ed4956' },
  deleteText: { color: '#ed4956' },
  showRepliesBtn: { marginTop: 4 },
  showRepliesText: { color: '#8e8e8e', fontSize: 13, fontWeight: '600' },
  showMoreRepliesBtn: { paddingLeft: 48, marginTop: 9 },
  showMoreRepliesText: { color: '#8e8e8e', fontSize: 13, fontWeight: '500' },
  repliesContainer: { marginTop: 4, marginLeft: -13 },
})
