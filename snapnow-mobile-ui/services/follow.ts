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
import { cancelFollowRequest, hasFollowRequest, sendFollowRequest } from "./followRequests"
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

// Follow a user or send follow request if private
export async function followUser(
  followerId: string,
  followingId: string,
  followerUsername: string,
  followerProfileImage?: string,
): Promise<"followed" | "requested"> {
  try {
    // Check if the target user has a private account
    const userDoc = await getDoc(doc(db, "users", followingId));
    const isPrivate = userDoc.data()?.isPrivate || false;

    if (isPrivate) {
      // Send follow request instead of following directly
      await sendFollowRequest(followerId, followingId, followerUsername, followerProfileImage);
      return "requested";
    } else {
      // Follow directly if account is public
      await createDirectFollow(followerId, followingId, followerUsername, followerProfileImage);
      return "followed";
    }
  } catch (error) {
    console.error("Error following user:", error)
    throw error
  }
}

// Create a direct follow relationship (used internally and when accepting requests)
export async function createDirectFollow(
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

    // Send notification
    await createNotification(followingId, "follow", followerId, followerUsername, followerProfileImage)
  } catch (error) {
    console.error("Error creating direct follow:", error)
    throw error
  }
}

// Unfollow a user or cancel follow request
export async function unfollowUser(followerId: string, followingId: string): Promise<void> {
  try {
    // Check if there's a pending follow request instead
    const hasPendingRequest = await hasFollowRequest(followerId, followingId);
    
    if (hasPendingRequest) {
      // Cancel the follow request
      await cancelFollowRequest(followerId, followingId);
    } else {
      // Unfollow normally
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
    }
  } catch (error) {
    console.error("Error unfollowing user:", error)
    throw error
  }
}

// Remove a follower (force someone to unfollow you)
export async function removeFollower(currentUserId: string, followerUserId: string): Promise<void> {
  try {
    // This is essentially making the follower unfollow you
    // The follow document is: followerUserId_currentUserId
    const followId = `${followerUserId}_${currentUserId}`

    // Check if follow relationship exists
    const followDoc = await getDoc(doc(db, "follows", followId))
    
    if (!followDoc.exists()) {
      console.log('Follow relationship does not exist');
      return;
    }

    // Remove follow document
    await deleteDoc(doc(db, "follows", followId))

    // Decrement the follower's following count
    const followerRef = doc(db, "users", followerUserId)
    await updateDoc(followerRef, {
      followingCount: increment(-1),
    })

    // Decrement current user's followers count
    const currentUserRef = doc(db, "users", currentUserId)
    await updateDoc(currentUserRef, {
      followersCount: increment(-1),
    })

    console.log(`✅ Successfully removed follower ${followerUserId} from ${currentUserId}`);
  } catch (error) {
    console.error("Error removing follower:", error)
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

// Check if current user can view another user's private content
export async function canViewPrivateContent(
  currentUserId: string,
  targetUserId: string
): Promise<boolean> {
  try {
    // User can always view their own content
    if (currentUserId === targetUserId) {
      return true;
    }

    // Check if target user's account is private
    const userDoc = await getDoc(doc(db, "users", targetUserId));
    const isPrivate = userDoc.data()?.isPrivate || false;

    // If account is not private, everyone can view
    if (!isPrivate) {
      return true;
    }

    // If account is private, check if current user is following
    const isFollowingUser = await isFollowing(currentUserId, targetUserId);
    return isFollowingUser;
  } catch (error) {
    console.error("Error checking if can view private content:", error);
    return false;
  }
}
