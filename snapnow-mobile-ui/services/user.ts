import { collection, doc, getDoc, getDocs, increment, query, updateDoc, where } from "firebase/firestore"
import { db } from "../config/firebase"
import type { User } from "../types"

export class UserService {
  // Get user profile by ID
  static async getUserProfile(userId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, "users", userId))
      if (userDoc.exists()) {
        const data = userDoc.data()
        return {
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
        } as User
      }
      return null
    } catch (error) {
      console.error("Error getting user profile:", error)
      throw error
    }
  }

  // Get user profile by username
  static async getUserByUsername(username: string): Promise<User | null> {
    try {
      const usersRef = collection(db, "users")
      const q = query(usersRef, where("username", "==", username.toLowerCase()))
      const snapshot = await getDocs(q)
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0]
        const data = doc.data()
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate?.() || new Date(),
        } as User
      }
      return null
    } catch (error) {
      console.error("Error getting user by username:", error)
      throw error
    }
  }

  // Update user profile
  static async updateUserProfile(userId: string, updates: Partial<User>) {
    try {
      const userRef = doc(db, "users", userId)
      await updateDoc(userRef, updates)
    } catch (error) {
      console.error("Error updating user profile:", error)
      throw error
    }
  }

  // Search users by username or display name
  static async searchUsers(searchTerm: string): Promise<User[]> {
    try {
      const usersRef = collection(db, "users")
      const lowerSearch = searchTerm.toLowerCase()

      // Search by username
      const usernameQuery = query(
        usersRef,
        where("username", ">=", lowerSearch),
        where("username", "<=", lowerSearch + "\uf8ff"),
      )

      const usernameSnapshot = await getDocs(usernameQuery)
      const users: User[] = []

      usernameSnapshot.forEach((doc) => {
        const data = doc.data()
        users.push({
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
        } as User)
      })

      return users
    } catch (error) {
      console.error("Error searching users:", error)
      throw error
    }
  }

  // Increment post count
  static async incrementPostCount(userId: string) {
    try {
      const userRef = doc(db, "users", userId)
      await updateDoc(userRef, {
        postsCount: increment(1),
      })
    } catch (error) {
      console.error("Error incrementing post count:", error)
      throw error
    }
  }

  // Decrement post count
  static async decrementPostCount(userId: string) {
    try {
      const userRef = doc(db, "users", userId)
      await updateDoc(userRef, {
        postsCount: increment(-1),
      })
    } catch (error) {
      console.error("Error decrementing post count:", error)
      throw error
    }
  }

  // Get suggested users (users not followed by current user)
  static async getSuggestedUsers(currentUserId: string, limit: number = 5): Promise<User[]> {
    try {
      // Get list of users current user is already following
      const { getFollowing } = await import('./follow');
      const followingIds = await getFollowing(currentUserId);

      // Get all users
      const usersRef = collection(db, "users");
      const snapshot = await getDocs(usersRef);

      const suggestions: User[] = [];
      snapshot.forEach((doc) => {
        const userId = doc.id;
        // Exclude current user and already followed users
        if (userId !== currentUserId && !followingIds.includes(userId)) {
          const data = doc.data();
          suggestions.push({
            id: userId,
            ...data,
            createdAt: data.createdAt?.toDate?.() || new Date(),
          } as User);
        }
      });

      // Sort by followers count (most popular first) and limit
      return suggestions
        .sort((a, b) => (b.followersCount || 0) - (a.followersCount || 0))
        .slice(0, limit);
    } catch (error) {
      console.error("Error getting suggested users:", error);
      return [];
    }
  }
}
