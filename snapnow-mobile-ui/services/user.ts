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
}
