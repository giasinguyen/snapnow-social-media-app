/**
 * Simple Notification Service for Expo Go
 * Uses local notifications (no backend/FCM required)
 * 
 * Features:
 * - Local notifications cho likes, comments, follows
 * - In-app notification tracking
 */

import * as Notifications from "expo-notifications"
import { collection, addDoc, query, where, getDocs, orderBy, limit, serverTimestamp, updateDoc, doc } from "firebase/firestore"
import { db } from "../config/firebase"

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export interface AppNotification {
  id: string
  userId: string // Recipient
  type: "like" | "comment" | "follow"
  fromUserId: string
  fromUsername: string
  fromUserImage?: string
  postId?: string
  postImage?: string
  commentText?: string
  createdAt: Date
  read: boolean
}

/**
 * Create in-app notification (stored in Firestore)
 */
export async function createNotification(
  userId: string,
  type: "like" | "comment" | "follow",
  fromUserId: string,
  fromUsername: string,
  fromUserImage?: string,
  postId?: string,
  postImage?: string,
  commentText?: string,
): Promise<void> {
  try {
    // Don't notify self
    if (userId === fromUserId) return

    // Add to Firestore notifications collection
    await addDoc(collection(db, "notifications"), {
      userId,
      type,
      fromUserId,
      fromUsername,
      fromUserImage: fromUserImage || null,
      postId: postId || null,
      postImage: postImage || null,
      commentText: commentText || null,
      createdAt: serverTimestamp(),
      read: false,
    })

    // Send local notification (for demo purposes)
    await sendLocalNotification(type, fromUsername, commentText)
  } catch (error) {
    console.error("Error creating notification:", error)
  }
}

/**
 * Send local push notification (visible even when app is in background)
 */
async function sendLocalNotification(type: string, username: string, text?: string): Promise<void> {
  try {
    const { status } = await Notifications.getPermissionsAsync()
    if (status !== "granted") {
      console.log("Notification permission not granted")
      return
    }

    let title = ""
    let body = ""

    switch (type) {
      case "like":
        title = "New Like"
        body = `${username} liked your post`
        break
      case "comment":
        title = "New Comment"
        body = `${username}: ${text || "commented on your post"}`
        break
      case "follow":
        title = "New Follower"
        body = `${username} started following you`
        break
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger: null, // Show immediately
    })
  } catch (error) {
    console.error("Error sending local notification:", error)
  }
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== "granted") {
      console.log("Failed to get notification permissions")
      return false
    }

    return true
  } catch (error) {
    console.error("Error requesting notification permissions:", error)
    return false
  }
}

/**
 * Get user's notifications from Firestore
 */
export async function getUserNotifications(userId: string, limitCount: number = 50): Promise<AppNotification[]> {
  try {
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(limitCount),
    )

    const snapshot = await getDocs(notificationsQuery)
    const notifications: AppNotification[] = []

    snapshot.forEach((doc) => {
      const data = doc.data()
      notifications.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
      } as AppNotification)
    })

    return notifications
  } catch (error) {
    console.error("Error getting notifications:", error)
    return []
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      where("read", "==", false),
    )

    const snapshot = await getDocs(notificationsQuery)
    return snapshot.size
  } catch (error) {
    console.error("Error getting unread count:", error)
    return 0
  }
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
  try {
    const notificationRef = doc(db, "notifications", notificationId)
    await updateDoc(notificationRef, {
      read: true,
    })
  } catch (error) {
    console.error("Error marking notification as read:", error)
  }
}

/**
 * Setup notification listeners (call in App root)
 */
export function setupNotificationListeners() {
  // Notification received while app is in foreground
  const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
    console.log("📨 Notification received:", notification)
  })

  // Notification tapped/clicked
  const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log("👆 Notification tapped:", response)
    // TODO: Navigate to relevant screen
  })

  // Return cleanup function
  return () => {
    notificationListener.remove()
    responseListener.remove()
  }
}

export default {
  createNotification,
  requestNotificationPermissions,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  setupNotificationListeners,
}
