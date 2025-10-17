import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../config/firebase'

export interface Bookmark {
  id: string
  userId: string
  postId: string
  createdAt: Date
}

export async function getUserBookmarkedPosts(userId: string): Promise<string[]> {
  try {
    const q = query(collection(db, 'bookmarks'), where('userId', '==', userId))
    const snap = await getDocs(q)
    const postIds: string[] = []
    snap.forEach((doc) => {
      const data = doc.data() as any
      postIds.push(data.postId)
    })
    return postIds
  } catch (error) {
    console.error('Error getting user bookmarks:', error)
    return []
  }
}

export default {
  getUserBookmarkedPosts,
}
