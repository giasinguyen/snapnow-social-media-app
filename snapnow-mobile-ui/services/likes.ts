import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    increment,
    query,
    setDoc,
    updateDoc,
    where,
} from "firebase/firestore"
import { db } from "../config/firebase"
import { createNotification } from "./notifications"

export interface Like {
  id: string
  userId: string
  postId: string
  createdAt: Date
}

// Check if user has liked a post
export async function hasUserLikedPost(userId: string, postId: string): Promise<boolean> {
  try {
    const likeId = `${userId}_${postId}`
    const likeDoc = await getDoc(doc(db, "likes", likeId))
    return likeDoc.exists()
  } catch (error) {
    console.error("Error checking like status:", error)
    return false
  }
}

// Like a post
export async function likePost(
  userId: string,
  postId: string,
  username: string,
  userProfileImage?: string,
): Promise<void> {
  try {
    const likeId = `${userId}_${postId}`

    // Add like document
    await setDoc(doc(db, "likes", likeId), {
      userId,
      postId,
      createdAt: new Date(),
    })

    // Increment post likes count
    const postRef = doc(db, "posts", postId)
    await updateDoc(postRef, {
      likes: increment(1),
    })

    const postDoc = await getDoc(postRef)
    if (postDoc.exists()) {
      const postData = postDoc.data()
      const postOwnerId = postData.userId

      // Don't notify if user likes their own post
      if (postOwnerId !== userId) {
        await createNotification(postOwnerId, "like", userId, username, userProfileImage, postId, postData.imageUrl)
      }
    }
  } catch (error) {
    console.error("Error liking post:", error)
    throw error
  }
}

// Unlike a post
export async function unlikePost(userId: string, postId: string): Promise<void> {
  try {
    const likeId = `${userId}_${postId}`

    // Remove like document
    await deleteDoc(doc(db, "likes", likeId))

    // Decrement post likes count
    const postRef = doc(db, "posts", postId)
    await updateDoc(postRef, {
      likes: increment(-1),
    })
  } catch (error) {
    console.error("Error unliking post:", error)
    throw error
  }
}

// Get all likes for a post
export async function getPostLikes(postId: string): Promise<Like[]> {
  try {
    const likesQuery = query(collection(db, "likes"), where("postId", "==", postId))
    const snapshot = await getDocs(likesQuery)

    const likes: Like[] = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      likes.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
      } as Like)
    })

    return likes
  } catch (error) {
    console.error("Error getting post likes:", error)
    return []
  }
}

// Get user's liked posts
export async function getUserLikedPosts(userId: string): Promise<string[]> {
  try {
    const likesQuery = query(collection(db, "likes"), where("userId", "==", userId))
    const snapshot = await getDocs(likesQuery)

    const postIds: string[] = []
    snapshot.forEach((doc) => {
      postIds.push(doc.data().postId)
    })

    return postIds
  } catch (error) {
    console.error("Error getting user liked posts:", error)
    return []
  }
}
