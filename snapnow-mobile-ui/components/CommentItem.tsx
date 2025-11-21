import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { auth, db } from '../config/firebase'
import { likeComment, unlikeComment } from '../services/comments'
import { UserService } from '../services/user'
import { Comment } from '../types'

interface CommentItemProps {
  comment: Comment
  onDelete?: (id: string) => void
  onReply?: (id: string, username: string) => void
  onUserPress?: (userId: string) => void
  isReply?: boolean // To distinguish replies from main comments
}

export default function CommentItem({ comment, onDelete, onReply, onUserPress, isReply = false }: CommentItemProps) {
  const [liked, setLiked] = useState(!!comment.isLiked)
  const [likesCount, setLikesCount] = useState(comment.likesCount || 0)
  const [showReplies, setShowReplies] = useState(false)
  const [showAllReplies, setShowAllReplies] = useState(false)
  const [realtimeAvatar, setRealtimeAvatar] = useState<string | null>(comment.userProfileImage || null)
  const [mentionUsernames, setMentionUsernames] = useState<Map<string, string>>(new Map())
  const scaleAnim = useRef(new Animated.Value(1)).current
  const router = useRouter()

  // Subscribe to real-time user profile updates for avatar
  useEffect(() => {
    if (!comment.userId) return;

    const userDocRef = doc(db, 'users', comment.userId);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        const avatarUrl = userData.profileImage || userData.photoURL;
        setRealtimeAvatar(avatarUrl || null);
      }
    }, (error) => {
      console.error('Error subscribing to user profile:', error);
    });

    return () => unsubscribe();
  }, [comment.userId]);

  // Load current usernames for mentioned users
  useEffect(() => {
    if (!comment.mentions || Object.keys(comment.mentions).length === 0) return;

    const loadMentionUsernames = async () => {
      const usernameMap = new Map<string, string>();
      
      for (const [oldUsername, userId] of Object.entries(comment.mentions!)) {
        try {
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            const currentUsername = userDoc.data().username;
            usernameMap.set(oldUsername, currentUsername);
          }
        } catch (error) {
          console.error(`Error loading username for ${oldUsername}:`, error);
        }
      }
      
      setMentionUsernames(usernameMap);
    };

    loadMentionUsernames();
  }, [comment.mentions]);

  const repliesCount = comment.replies?.length || 0
  const INITIAL_REPLIES_COUNT = 5
  const visibleReplies = showAllReplies 
    ? comment.replies 
    : comment.replies?.slice(0, INITIAL_REPLIES_COUNT)

  const animateHeart = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start()
  }

  const toggleLike = useCallback(async () => {
    try {
      if (!auth.currentUser) return
      if (liked) {
        await unlikeComment(comment.id)
        setLikesCount((c) => Math.max(0, c - 1))
      } else {
        await likeComment(comment.id)
        setLikesCount((c) => c + 1)
        animateHeart()
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
    // Simple regex: match @ followed by username (no spaces since usernames don't have spaces)
    const parts: { text: string; isMention: boolean; username?: string }[] = []
    const mentionRegex = /@([a-zA-Z0-9_]+)/g
    
    let lastIndex = 0
    let match
    
    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push({ text: text.slice(lastIndex, match.index), isMention: false })
      }
      
      // Add mention with username (without @)
      parts.push({ 
        text: match[0], // Full match including @
        isMention: true,
        username: match[1] // Captured username without @
      })
      lastIndex = match.index + match[0].length
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({ text: text.slice(lastIndex), isMention: false })
    }
    
    return parts.map((part, index) => {
      if (part.isMention && part.username) {
        // Get the current username if available, otherwise use the one in the text
        const currentUsername = mentionUsernames.get(part.username) || part.username;
        const displayText = `@${currentUsername}`;
        
        // Make mention clickable
        return (
          <Text 
            key={index} 
            style={[styles.mention, isReply && styles.replyMention]}
            onPress={() => handleMentionPress(part.username!)}
          >
            {displayText}
          </Text>
        )
      }
      return (
        <Text key={index} style={styles.regularText}>
          {part.text}
        </Text>
      )
    })
  }

  const handleMentionPress = async (username: string) => {
    try {
      // First, check if we have a stored user ID for this mention
      if (comment.mentions && comment.mentions[username]) {
        const userId = comment.mentions[username];
        console.log('Using stored user ID for mention:', username, userId);
        router.push(`/user/${userId}` as any);
        return;
      }
      
      // Fallback: Search for user by current username
      console.log('No stored user ID, searching by username:', username);
      const users = await UserService.searchUsers(username);
      if (users.length > 0) {
        const user = users[0];
        router.push(`/user/${user.id}` as any);
      } else {
        console.log('User not found:', username);
        Alert.alert('User Not Found', `The user @${username} could not be found. They may have changed their username or deleted their account.`);
      }
    } catch (error) {
      console.error('Error navigating to user profile:', error);
      Alert.alert('Error', 'Failed to open user profile');
    }
  }

  return (
    <View style={styles.container}>
      <View style={[styles.commentWrapper, isReply && styles.replyWrapper]}>
        <TouchableOpacity onPress={handleUserPress}>
          {realtimeAvatar ? (
            <Image source={{ uri: realtimeAvatar }} style={[styles.avatar, isReply && styles.replyAvatar]} />
          ) : (
            <View style={[styles.avatar, styles.placeholder, isReply && styles.replyAvatar]}>
              <Text style={[styles.initials, isReply && styles.replyInitials]}>
                {(comment.username || '??').slice(0,2).toUpperCase()}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.contentRow}>
          <View style={styles.commentContent}>
            <View style={[styles.commentHeader, isReply && styles.replyCommentHeader]}>
              <View style={styles.usernameTimeRow}>
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
            
            {/* Reply button */}
            <View style={styles.replyRow}>
              <TouchableOpacity onPress={handleReply}>
                <Text style={[styles.replyText2, isReply && styles.replyText2Small]}>Reply</Text>
              </TouchableOpacity>
              {isOwn && (
                <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
                  <Text style={styles.deleteText2}>Delete</Text>
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
          
          <View style={styles.likeSection}>
            <TouchableOpacity onPress={toggleLike} style={styles.likeButtonVertical}>
              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <Ionicons 
                  name={liked ? "heart" : "heart-outline"} 
                  size={14} 
                  color={liked ? "#ed4956" : "#8e8e8e"} 
                />
              </Animated.View>
            </TouchableOpacity>
            <View style={styles.likeCountContainer}>
              {likesCount > 0 && (
                <Text style={[styles.likeCountVertical, isReply && styles.replyLikeCount]}>
                  {likesCount.toLocaleString()}
                </Text>
              )}
            </View>
          </View>
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
  container: { paddingHorizontal: 8, paddingVertical: 6, marginBottom: 4, backgroundColor: '#ffffff' },
  commentWrapper: { flexDirection: 'row', alignItems: 'flex-start' },
  replyWrapper: { 
    paddingLeft: 22, 
    backgroundColor: '#ffffff',
    marginLeft: 44,
    paddingVertical: 5,
    marginTop: 2
  },
  avatar: { width: 35, height: 35, borderRadius: 17.5, marginRight: 13, backgroundColor: '#f0f0f0' },
  replyAvatar: { width: 32, height: 32, borderRadius: 16 },
  placeholder: { justifyContent: 'center', alignItems: 'center' },
  initials: { color: '#fff', fontWeight: '600', fontSize: 13 },
  replyInitials: { color: '#fff', fontWeight: '600', fontSize: 12 },
  content: { flex: 1 },
  contentRow: { flexDirection: 'row', alignItems: 'flex-start', flex: 1 },
  commentContent: { flex: 1 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 1 },
  replyCommentHeader: { marginBottom: 1 },
  usernameTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  likeSection: { flexDirection: 'column', alignItems: 'center', paddingLeft: 8, paddingTop: 0 },
  likeButtonVertical: { marginBottom: 0 },
  likeCountContainer: {position: 'fixed', minHeight: 14, justifyContent: 'center', alignItems: 'center' },
  likeCountVertical: { color: '#a5a3a3ff', fontSize: 11, fontWeight: '600' },
  commentContentRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 0, justifyContent: 'space-between' },
  username: { fontWeight: '600', fontSize: 14, lineHeight: 18, color: '#000000' },
  replyUsername: { fontWeight: '600', fontSize: 13.5, lineHeight: 17, color: '#000000' },
  time: { color: '#8e8e8e', fontSize: 12, fontWeight: '400' },
  replyTime: { color: '#8e8e8e', fontSize: 11, fontWeight: '400' },
  replyLikeCount: { color: '#a5a3a3ff', fontSize: 12, fontWeight: '600' },
  text: { color: '#000000', fontSize: 14, lineHeight: 18, flexShrink: 1 },
  replyText: { color: '#000000', fontSize: 13.5, lineHeight: 17.5, flexShrink: 1 },
  regularText: { fontWeight: '400' },
  replyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  replyText2: { color: '#a5a3a3ff', fontSize: 12, fontWeight: '600' },
  replyText2Small: { fontSize: 11 },
  deleteBtn: { marginLeft: 16 },
  deleteText2: { color: '#f05c69ff', fontSize: 12, fontWeight: '600' },
  mention: { fontWeight: '700', color: '#000000' },
  replyMention: { fontWeight: '700', color: '#000000' },
  commentImage: { 
    width: 132, 
    height: 132, 
    borderRadius: 9, 
    marginTop: 2, 
    marginBottom: 1
  },
  replyCommentImage: { 
    width: 120, 
    height: 120, 
    borderRadius: 8 
  },
  showRepliesBtn: { marginTop: 4 },
  showRepliesText: { color: '#8e8e8e', fontSize: 13, fontWeight: '600' },
  showMoreRepliesBtn: { paddingLeft: 48, marginTop: 9 },
  showMoreRepliesText: { color: '#8e8e8e', fontSize: 13, fontWeight: '500' },
  repliesContainer: { marginTop: 4, marginLeft: -13 },
})
