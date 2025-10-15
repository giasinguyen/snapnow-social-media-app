"use client"

import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { auth } from "../../config/firebase"
import { markAllNotificationsAsRead, subscribeToNotifications } from "../../services/notifications"
import type { Notification } from "../../types"

export default function ActivityScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const router = useRouter()

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false)
      return
    }

    // Subscribe to real-time notifications
    const unsubscribe = subscribeToNotifications(auth.currentUser.uid, (newNotifications) => {
      setNotifications(newNotifications)
      setLoading(false)

      // Update unread count
      const unread = newNotifications.filter((n) => !n.isRead).length
      setUnreadCount(unread)
    })

    return () => unsubscribe()
  }, [])

  const handleMarkAllRead = async () => {
    if (!auth.currentUser) return

    try {
      await markAllNotificationsAsRead(auth.currentUser.uid)
      setUnreadCount(0)
    } catch (error) {
      console.error("Error marking all as read:", error)
    }
  }

  const handleNotificationPress = (notification: Notification) => {
    if (notification.type === "follow") {
      router.push(`/user/${notification.fromUserId}`)
    } else if (notification.postId) {
      // Navigate to post detail (you can implement this)
      console.log("Navigate to post:", notification.postId)
    }
  }

  const renderNotification = ({ item }: { item: Notification }) => {
    const getIcon = () => {
      switch (item.type) {
        case "like":
          return <Ionicons name="heart" size={24} color="#FF3040" />
        case "comment":
          return <Ionicons name="chatbubble" size={24} color="#0095f6" />
        case "follow":
          return <Ionicons name="person-add" size={24} color="#262626" />
        default:
          return <Ionicons name="notifications" size={24} color="#262626" />
      }
    }

    return (
      <TouchableOpacity
        style={[styles.notificationItem, !item.isRead && styles.unreadNotification]}
        onPress={() => handleNotificationPress(item)}
      >
        <Image
          source={
            item.fromUserProfileImage
              ? { uri: item.fromUserProfileImage }
              : require("../../assets/images/default-avatar.jpg")
          }
          style={styles.avatar}
        />
        <View style={styles.notificationContent}>
          <Text style={styles.notificationText} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={styles.notificationTime}>{formatTimestamp(item.createdAt)}</Text>
        </View>
        {item.postImageUrl && <Image source={{ uri: item.postImageUrl }} style={styles.postThumbnail} />}
        <View style={styles.iconContainer}>{getIcon()}</View>
      </TouchableOpacity>
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Activity</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#262626" />
        </View>
      </SafeAreaView>
    )
  }

  if (!auth.currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Activity</Text>
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off-outline" size={64} color="#c7c7c7" />
          <Text style={styles.emptyTitle}>Sign in to see notifications</Text>
          <Text style={styles.emptySubtitle}>Get notified when someone likes, comments, or follows you</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Activity</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markAllRead}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-outline" size={64} color="#c7c7c7" />
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptySubtitle}>When someone interacts with your posts, you'll see it here</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
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
    fontSize: 20,
    fontWeight: "700",
    color: "#262626",
  },
  markAllRead: {
    fontSize: 14,
    color: "#0095f6",
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
    lineHeight: 20,
  },
  listContent: {
    paddingVertical: 8,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#efefef",
  },
  unreadNotification: {
    backgroundColor: "#f0f8ff",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f0f0f0",
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationText: {
    fontSize: 14,
    color: "#262626",
    lineHeight: 18,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: "#8e8e8e",
  },
  postThumbnail: {
    width: 44,
    height: 44,
    backgroundColor: "#f0f0f0",
    marginRight: 8,
  },
  iconContainer: {
    marginLeft: 8,
  },
})
