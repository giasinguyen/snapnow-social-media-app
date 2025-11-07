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

// Check if user is following another user
export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  try {
    const followId = `${followerId}_${followingId}`
    const followDoc = await getDoc(doc(db, "follows", followId))
    return followDoc.exists()
  } catch (error) {
    console.error("Error checking follow status:", error)
    return false
  }
}

// Follow a user
export async function followUser(
  followerId: string,
  followingId: string,
  followerUsername: string,
  followerProfileImage?: string,
): Promise<void> {
  try {
    const followId = `${followerId}_${followingId}`

    // Add follow document
    await setDoc(doc(db, "follows", followId), {
      followerId,
      followingId,
      createdAt: new Date(),
    })

    // Increment follower's following count
    const followerRef = doc(db, "users", followerId)
    await updateDoc(followerRef, {
      followingCount: increment(1),
    })

    // Increment following user's followers count
    const followingRef = doc(db, "users", followingId)
    await updateDoc(followingRef, {
      followersCount: increment(1),
    })

    await createNotification(followingId, "follow", followerId, followerUsername, followerProfileImage)
  } catch (error) {
    console.error("Error following user:", error)
    throw error
  }
}

// Unfollow a user
export async function unfollowUser(followerId: string, followingId: string): Promise<void> {
  try {
    const followId = `${followerId}_${followingId}`

    // Remove follow document
    await deleteDoc(doc(db, "follows", followId))

    // Decrement follower's following count
    const followerRef = doc(db, "users", followerId)
    await updateDoc(followerRef, {
      followingCount: increment(-1),
    })

    // Decrement following user's followers count
    const followingRef = doc(db, "users", followingId)
    await updateDoc(followingRef, {
      followersCount: increment(-1),
    })
  } catch (error) {
    console.error("Error unfollowing user:", error)
    throw error
  }
}

// Get list of users that a user is following
export async function getFollowing(userId: string): Promise<string[]> {
  try {
    console.log('📡 getFollowing: Querying Firestore for userId:', userId);
    const followsQuery = query(collection(db, "follows"), where("followerId", "==", userId))
    const snapshot = await getDocs(followsQuery)
    console.log('📡 getFollowing: Query returned', snapshot.size, 'documents');

    const followingIds: string[] = []
    snapshot.forEach((doc) => {
      console.log('📡 getFollowing: Found following document:', doc.id, doc.data());
      followingIds.push(doc.data().followingId)
    })

    console.log('📡 getFollowing: Returning', followingIds.length, 'following IDs:', followingIds);
    return followingIds
  } catch (error) {
    console.error("Error getting following list:", error)
    return []
  }
}

// Get list of users that follow a user
export async function getFollowers(userId: string): Promise<string[]> {
  try {
    console.log('📡 getFollowers: Querying Firestore for userId:', userId);
    const followsQuery = query(collection(db, "follows"), where("followingId", "==", userId))
    const snapshot = await getDocs(followsQuery)
    console.log('📡 getFollowers: Query returned', snapshot.size, 'documents');

    const followerIds: string[] = []
    snapshot.forEach((doc) => {
      console.log('📡 getFollowers: Found follower document:', doc.id, doc.data());
      followerIds.push(doc.data().followerId)
    })

    console.log('📡 getFollowers: Returning', followerIds.length, 'follower IDs:', followerIds);
    return followerIds
  } catch (error) {
    console.error("Error getting followers list:", error)
    return []
  }
}

// Get follow counts for a user
export async function getFollowCounts(userId: string): Promise<{ followers: number; following: number }> {
  try {
    const userDoc = await getDoc(doc(db, "users", userId))
    if (userDoc.exists()) {
      const data = userDoc.data()
      return {
        followers: data.followersCount || 0,
        following: data.followingCount || 0,
      }
    }
    return { followers: 0, following: 0 }
  } catch (error) {
    console.error("Error getting follow counts:", error)
    return { followers: 0, following: 0 }
  }
}