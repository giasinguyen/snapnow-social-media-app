"use client"

import { Ionicons } from "@expo/vector-icons"
import { useEffect, useState } from "react"
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import type { Post } from "../services/posts"

interface PostCardProps {
  post: Post
  isLiked?: boolean
  onLike?: (id: string, liked: boolean) => void
  onComment?: (id: string) => void
  onShare?: (id: string) => void
  onUserPress?: (userId: string) => void
}

export default function PostCard({ post, isLiked = false, onLike, onComment, onShare, onUserPress }: PostCardProps) {
  const [liked, setLiked] = useState(isLiked)

  // Update local liked state when prop changes
  useEffect(() => {
    setLiked(isLiked)
  }, [isLiked])

  const toggleLike = () => {
    const newLikedState = !liked
    setLiked(newLikedState)
    onLike?.(post.id, newLikedState)
  }

  const handleUserPress = () => {
    if (post.userId) {
      onUserPress?.(post.userId)
    }
  }

  const renderCaption = () => {
    if (!post.caption) return null

    const parts = post.caption.split(/(#[\w]+)/g)
    return (
      <Text style={styles.captionText}>
        <Text style={styles.username}>{post.username}</Text>{" "}
        {parts.map((part, index) => {
          if (part.startsWith("#")) {
            return (
              <Text key={index} style={styles.hashtag}>
                {part}
              </Text>
            )
          }
          return <Text key={index}>{part}</Text>
        })}
      </Text>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.userInfo} onPress={handleUserPress} activeOpacity={0.7}>
          <Image source={{ uri: post.userImage || "https://via.placeholder.com/40" }} style={styles.avatar} />
          <Text style={styles.username}>{post.username || "user"}</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={20} color="#262626" />
        </TouchableOpacity>
      </View>

      {/* Post Image */}
      <Image source={{ uri: post.imageUrl }} style={styles.postImage} resizeMode="cover" />

      {/* Action Buttons */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity onPress={toggleLike} style={styles.actionButton}>
            <Ionicons name={liked ? "heart" : "heart-outline"} size={28} color={liked ? "#FF3040" : "#262626"} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => onComment?.(post.id)}>
            <Ionicons name="chatbubble-outline" size={26} color="#262626" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => onShare?.(post.id)}>
            <Ionicons name="paper-plane-outline" size={26} color="#262626" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity>
          <Ionicons name="bookmark-outline" size={26} color="#262626" />
        </TouchableOpacity>
      </View>

      {/* Likes Count */}
      {(post.likes || 0) > 0 && <Text style={styles.likes}>{post.likes} likes</Text>}

      {/* Caption */}
      <View style={styles.captionContainer}>{renderCaption()}</View>

      {/* Comments Count */}
      {post.commentsCount && post.commentsCount > 0 && (
        <TouchableOpacity style={styles.commentsLink} onPress={() => onComment?.(post.id)}>
          <Text style={styles.commentsText}>View all {post.commentsCount} comments</Text>
        </TouchableOpacity>
      )}

      {/* Timestamp */}
      {post.createdAt && <Text style={styles.timestamp}>{formatTimestamp(post.createdAt)}</Text>}
    </View>
  )
}

function formatTimestamp(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#efefef",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    backgroundColor: "#f0f0f0",
  },
  username: {
    fontWeight: "600",
    fontSize: 14,
    color: "#262626",
  },
  postImage: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#f0f0f0",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  leftActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    marginRight: 16,
  },
  likes: {
    fontWeight: "600",
    fontSize: 14,
    paddingHorizontal: 12,
    marginBottom: 8,
    color: "#262626",
  },
  captionContainer: {
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  captionText: {
    fontSize: 14,
    lineHeight: 18,
    color: "#262626",
  },
  hashtag: {
    color: "#00376b",
    fontWeight: "500",
  },
  commentsLink: {
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  commentsText: {
    color: "#8e8e8e",
    fontSize: 14,
  },
  timestamp: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    fontSize: 11,
    color: "#8e8e8e",
  },
})
