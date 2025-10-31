import React, { useCallback, useState } from 'react'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Comment } from '../types'
import { likeComment, unlikeComment } from '../services/comments'
import { auth } from '../config/firebase'

interface CommentItemProps {
  comment: Comment
  onDelete?: (id: string) => void
  onReply?: (id: string, username: string) => void
}

export default function CommentItem({ comment, onDelete, onReply }: CommentItemProps) {
  const [liked, setLiked] = useState(!!comment.isLiked)
  const [likesCount, setLikesCount] = useState(comment.likesCount || 0)

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

  const isOwn = auth.currentUser && comment.userId === auth.currentUser.uid

  return (
    <View style={styles.container}>
      {comment.userProfileImage ? (
        <Image source={{ uri: comment.userProfileImage }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.placeholder]}><Text style={styles.initials}>{(comment.username || '??').slice(0,2).toUpperCase()}</Text></View>
      )}

      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.username}>{comment.username}</Text>
          <Text style={styles.time}>{formatTime(comment.createdAt)}</Text>
        </View>
        <Text style={styles.text}>{comment.text}</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity onPress={toggleLike} style={styles.actionBtn}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={16} color={liked ? '#ed4956' : '#8e8e8e'} />
            <Text style={styles.actionText}>{likesCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleReply} style={styles.actionBtn}>
            <Ionicons name="arrow-undo-outline" size={16} color="#8e8e8e" />
            <Text style={styles.actionText}>Reply</Text>
          </TouchableOpacity>
          {isOwn && (
            <TouchableOpacity onPress={() => onDelete?.(comment.id)} style={styles.actionBtn}>
              <Ionicons name="trash-outline" size={16} color="#ed4956" />
            </TouchableOpacity>
          )}
        </View>
      </View>
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
  container: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, alignItems: 'flex-start' },
  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12, backgroundColor: '#eee' },
  placeholder: { justifyContent: 'center', alignItems: 'center' },
  initials: { color: '#fff', fontWeight: '700' },
  content: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  username: { fontWeight: '700', marginRight: 8 },
  time: { color: '#8e8e8e', fontSize: 12 },
  text: { color: '#262626', marginBottom: 6 },
  actionsRow: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', marginRight: 12 },
  actionText: { marginLeft: 6, color: '#8e8e8e', fontSize: 13 },
})
