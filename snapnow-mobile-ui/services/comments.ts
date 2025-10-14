import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    increment,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from "firebase/firestore"
import { db } from "../config/firebase"
import type { Comment } from "../types"
import { createNotification } from "./notifications"

// Add a comment to a post
export async function addComment(
  postId: string,
  userId: string,
  username: string,
  userProfileImage: string | undefined,
  text: string,
): Promise<string> {
  try {
    const commentData = {
      postId,
      userId,
      username,
      userProfileImage: userProfileImage || null,
      text: text.trim(),
      likesCount: 0,
      createdAt: serverTimestamp(),
    }

    const docRef = await addDoc(collection(db, "comments"), commentData)

    // Increment post comments count
    const postRef = doc(db, "posts", postId)
    await updateDoc(postRef, {
      commentsCount: increment(1),
    })

    const postDoc = await getDoc(postRef)
    if (postDoc.exists()) {
      const postData = postDoc.data()
      const postOwnerId = postData.userId

      // Don't notify if user comments on their own post
      if (postOwnerId !== userId) {
        await createNotification(
          postOwnerId,
          "comment",
          userId,
          username,
          userProfileImage,
          postId,
          postData.imageUrl,
          text.trim(),
        )
      }
    }

    return docRef.id
  } catch (error) {
    console.error("Error adding comment:", error)
    throw error
  }
}

// Get comments for a post
export async function getPostComments(postId: string): Promise<Comment[]> {
  try {
    const commentsQuery = query(collection(db, "comments"), where("postId", "==", postId), orderBy("createdAt", "desc"))

    const snapshot = await getDocs(commentsQuery)
    const comments: Comment[] = []

    snapshot.forEach((doc) => {
      const data = doc.data()
      comments.push({
        id: doc.id,
        ...data,
        isLiked: false,
        createdAt: data.createdAt?.toDate?.() || new Date(),
      } as Comment)
    })

    return comments
  } catch (error) {
    console.error("Error getting comments:", error)
    return []
  }
}

// Delete a comment
export async function deleteComment(commentId: string, postId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "comments", commentId))

    // Decrement post comments count
    const postRef = doc(db, "posts", postId)
    await updateDoc(postRef, {
      commentsCount: increment(-1),
    })
  } catch (error) {
    console.error("Error deleting comment:", error)
    throw error
  }
}

// Like a comment
export async function likeComment(commentId: string): Promise<void> {
  try {
    const commentRef = doc(db, "comments", commentId)
    await updateDoc(commentRef, {
      likesCount: increment(1),
    })
  } catch (error) {
    console.error("Error liking comment:", error)
    throw error
  }
}

// Unlike a comment
export async function unlikeComment(commentId: string): Promise<void> {
  try {
    const commentRef = doc(db, "comments", commentId)
    await updateDoc(commentRef, {
      likesCount: increment(-1),
    })
  } catch (error) {
    console.error("Error unliking comment:", error)
    throw error
  }
}

// Get comment count for a post
export async function getCommentCount(postId: string): Promise<number> {
  try {
    const postDoc = await getDoc(doc(db, "posts", postId))
    if (postDoc.exists()) {
      return postDoc.data().commentsCount || 0
    }
    return 0
  } catch (error) {
    console.error("Error getting comment count:", error)
    return 0
  }
}
