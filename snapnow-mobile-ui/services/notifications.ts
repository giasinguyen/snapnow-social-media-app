import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    limit,
    onSnapshot,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from "firebase/firestore"
import { db } from "../config/firebase"
import type { Notification } from "../types"

// Create a notification
export async function createNotification(
  userId: string,
  type: "like" | "comment" | "follow",
  fromUserId: string,
  fromUsername: string,
  fromUserProfileImage: string | undefined,
  postId?: string,
  postImageUrl?: string,
  commentText?: string,
): Promise<string> {
  try {
    let message = ""
    switch (type) {
      case "like":
        message = `${fromUsername} liked your post`
        break
      case "comment":
        message = commentText ? `${fromUsername} commented: ${commentText}` : `${fromUsername} commented on your post`
        break
      case "follow":
        message = `${fromUsername} started following you`
        break
    }

    const notificationData = {
      userId,
      type,
      fromUserId,
      fromUsername,
      fromUserProfileImage: fromUserProfileImage || null,
      postId: postId || null,
      postImageUrl: postImageUrl || null,
      message,
      isRead: false,
      createdAt: serverTimestamp(),
    }

    const docRef = await addDoc(collection(db, "notifications"), notificationData)
    return docRef.id
  } catch (error) {
    console.error("Error creating notification:", error)
    throw error
  }
}

// Get notifications for a user
export async function getUserNotifications(userId: string, limitCount = 50): Promise<Notification[]> {
  try {
    // Remove orderBy to avoid composite index requirement
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      limit(limitCount),
    )

    const snapshot = await getDocs(notificationsQuery)
    const notifications: Notification[] = []

    snapshot.forEach((doc) => {
      const data = doc.data()
      notifications.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
      } as Notification)
    })

    // Sort by createdAt in memory
    return notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  } catch (error) {
    console.error("Error getting notifications:", error)
    return []
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const notificationRef = doc(db, "notifications", notificationId)
    await updateDoc(notificationRef, {
      isRead: true,
    })
  } catch (error) {
    console.error("Error marking notification as read:", error)
    throw error
  }
}

// Mark all notifications as read for a user
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      where("isRead", "==", false),
    )

    const snapshot = await getDocs(notificationsQuery)
    const updatePromises = snapshot.docs.map((doc) =>
      updateDoc(doc.ref, {
        isRead: true,
      }),
    )

    await Promise.all(updatePromises)
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    throw error
  }
}

// Delete a notification
export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "notifications", notificationId))
  } catch (error) {
    console.error("Error deleting notification:", error)
    throw error
  }
}

// Get unread notification count
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      where("isRead", "==", false),
    )

    const snapshot = await getDocs(notificationsQuery)
    return snapshot.size
  } catch (error) {
    console.error("Error getting unread count:", error)
    return 0
  }
}

// Subscribe to real-time notifications
export function subscribeToNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void,
): () => void {
  // Remove orderBy to avoid composite index requirement
  const notificationsQuery = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    limit(50),
  )

  const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
    const notifications: Notification[] = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      notifications.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
      } as Notification)
    })
    
    // Sort by createdAt in memory (newest first)
    const sortedNotifications = notifications.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    )
    
    callback(sortedNotifications)
  })

  return unsubscribe
}
