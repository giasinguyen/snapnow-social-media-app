import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    increment,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where,
} from "firebase/firestore"
import { db } from "../config/firebase"
import type { Comment } from "../types"
import { deleteCommentActivities, logCommentActivity } from "./activityHistory"
import { createNotification } from "./notifications"
// Add a comment to a post
export async function addComment(
  postId: string,
  userId: string,
  username: string,
  userProfileImage: string | undefined,
  text: string,
  parentCommentId?: string,
  imageUrl?: string,
): Promise<string> {
  try {
    // Extract mentions and get their user IDs
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const mentionMatches = text.match(mentionRegex);
    const mentions: { [username: string]: string } = {};
    
    if (mentionMatches && mentionMatches.length > 0) {
      const { UserService } = await import('./user');
      
      for (const mention of mentionMatches) {
        const mentionUsername = mention.substring(1); // Remove @
        try {
          const user = await UserService.getUserByUsername(mentionUsername);
          if (user) {
            mentions[mentionUsername] = user.id;
          }
        } catch (error) {
          console.error(`Failed to find user ID for @${mentionUsername}:`, error);
        }
      }
    }
    
    const commentData: any = {
      postId,
      userId,
      username,
      userProfileImage: userProfileImage || null,
      text: text.trim(),
      ...(imageUrl && { imageUrl }),
      likesCount: 0,
      createdAt: serverTimestamp(),
      ...(parentCommentId && { parentCommentId }),
    };
    
    // Add mentions if any were found
    if (Object.keys(mentions).length > 0) {
      commentData.mentions = mentions;
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

      // Log comment activity
      await logCommentActivity(userId, postId, docRef.id, text.trim(), postOwnerId, postData.imageUrl)

      // If this is a reply to another comment, notify the parent comment author
      if (parentCommentId) {
        const parentCommentDoc = await getDoc(doc(db, "comments", parentCommentId))
        if (parentCommentDoc.exists()) {
          const parentCommentData = parentCommentDoc.data()
          const parentCommentOwnerId = parentCommentData.userId
          
          // Don't notify if user replies to their own comment
          if (parentCommentOwnerId !== userId) {
            await createNotification(
              parentCommentOwnerId,
              "comment_reply",
              userId,
              username,
              userProfileImage,
              postId,
              postData.imageUrl,
              text.trim(),
              parentCommentId,
            )
          }
        }
      } else {
        // If this is a regular comment (not a reply), notify the post owner
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
    // Only use where() to avoid composite index requirement
    // We'll sort in memory instead
    const commentsQuery = query(collection(db, "comments"), where("postId", "==", postId))

    const snapshot = await getDocs(commentsQuery)
    const allComments: Comment[] = []

    snapshot.forEach((doc) => {
      const data = doc.data()
      allComments.push({
        id: doc.id,
        ...data,
        isLiked: false, // Will be updated below
        createdAt: data.createdAt?.toDate?.() || new Date(),
      } as Comment)
    })

    // Fetch real usernames from users collection
    const userIds = [...new Set(allComments.map(c => c.userId))]
    const userMap = new Map<string, string>()
    
    // Batch fetch all users
    await Promise.all(
      userIds.map(async (userId) => {
        try {
          const userDoc = await getDoc(doc(db, "users", userId))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            userMap.set(userId, userData.username || userData.displayName || 'Unknown')
          }
        } catch (error) {
          console.error(`Error fetching user ${userId}:`, error)
        }
      })
    )

    // Update all comments with real usernames
    allComments.forEach(comment => {
      const realUsername = userMap.get(comment.userId)
      if (realUsername) {
        comment.username = realUsername
      }
    })

    // Check which comments the current user has liked
    const currentUserId = require("../config/firebase").auth.currentUser?.uid
    if (currentUserId) {
      // Get all comment likes for this user
      const likesQuery = query(
        collection(db, "commentLikes"), 
        where("userId", "==", currentUserId)
      )
      const likesSnapshot = await getDocs(likesQuery)
      const likedCommentIds = new Set<string>()
      
      likesSnapshot.forEach((doc) => {
        likedCommentIds.add(doc.data().commentId)
      })

      // Update isLiked status for comments
      allComments.forEach(comment => {
        comment.isLiked = likedCommentIds.has(comment.id)
      })
    }

    // Sort in memory by createdAt descending (newest first)
    allComments.sort((a, b) => {
      const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0
      const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0
      return timeB - timeA
    })

    // Separate parent comments and replies
    const parentComments: Comment[] = []
    const allReplies: Comment[] = []

    allComments.forEach(comment => {
      if (comment.parentCommentId) {
        allReplies.push(comment)
      } else {
        parentComments.push(comment)
      }
    })

    // Helper function to find the root parent ID
    const findRootParentId = (commentId: string): string => {
      const comment = allReplies.find(r => r.id === commentId)
      if (!comment || !comment.parentCommentId) {
        return commentId
      }
      // If this comment's parent is also a reply, keep looking up
      const parentComment = allReplies.find(r => r.id === comment.parentCommentId)
      if (parentComment && parentComment.parentCommentId) {
        return findRootParentId(comment.parentCommentId)
      }
      return comment.parentCommentId
    }

    // Group all replies under their root parent comments
    const structuredComments = parentComments.map(parentComment => {
      // Find all replies that belong to this parent comment tree
      const allRepliesForParent = allReplies.filter(reply => {
        const rootParentId = findRootParentId(reply.id)
        return rootParentId === parentComment.id
      })

      const sortedReplies = allRepliesForParent.sort((a, b) => {
        const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0
        const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0
        return timeA - timeB // Sort replies oldest first
      })

      return {
        ...parentComment,
        replies: sortedReplies.length > 0 ? sortedReplies : undefined,
        repliesCount: sortedReplies.length
      }
    })

    return structuredComments
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

    // Delete activity logs
    await deleteCommentActivities(commentId)
  } catch (error) {
    console.error("Error deleting comment:", error)
    throw error
  }
}

// Like a comment
export async function likeComment(commentId: string): Promise<void> {
  try {
    const currentUserId = require("../config/firebase").auth.currentUser?.uid
    const currentUser = require("../config/firebase").auth.currentUser
    if (!currentUserId) {
      throw new Error("User must be logged in to like comments")
    }

    // Get comment details
    const commentDoc = await getDoc(doc(db, "comments", commentId))
    if (!commentDoc.exists()) {
      throw new Error("Comment not found")
    }
    
    const commentData = commentDoc.data()
    const commentOwnerId = commentData.userId

    // Create a like record in commentLikes collection
    const likeId = `${currentUserId}_${commentId}`
    await setDoc(doc(db, "commentLikes", likeId), {
      userId: currentUserId,
      commentId: commentId,
      createdAt: serverTimestamp(),
    })

    // Increment the comment's like count
    const commentRef = doc(db, "comments", commentId)
    await updateDoc(commentRef, {
      likesCount: increment(1),
    })

    // Send notification to comment owner (don't notify if user likes their own comment)
    if (commentOwnerId !== currentUserId) {
      // Get post details for the notification
      const postDoc = await getDoc(doc(db, "posts", commentData.postId))
      const postData = postDoc.exists() ? postDoc.data() : null

      // Get current user details
      const userDoc = await getDoc(doc(db, "users", currentUserId))
      const userData = userDoc.exists() ? userDoc.data() : null

      await createNotification(
        commentOwnerId,
        "comment_like",
        currentUserId,
        userData?.username || currentUser?.displayName || "Someone",
        userData?.profileImage || currentUser?.photoURL,
        commentData.postId,
        postData?.imageUrl,
        undefined,
        commentId,
      )
    }
  } catch (error) {
    console.error("Error liking comment:", error)
    throw error
  }
}

// Unlike a comment
export async function unlikeComment(commentId: string): Promise<void> {
  try {
    const currentUserId = require("../config/firebase").auth.currentUser?.uid
    if (!currentUserId) {
      throw new Error("User must be logged in to unlike comments")
    }

    // Remove the like record from commentLikes collection
    const likeId = `${currentUserId}_${commentId}`
    await deleteDoc(doc(db, "commentLikes", likeId))

    // Decrement the comment's like count
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
