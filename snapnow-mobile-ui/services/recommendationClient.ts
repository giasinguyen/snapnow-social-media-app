import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore"
import { db } from "../config/firebase"
import type { User, Post } from "../types"


export async function getRecommendedUsers(userId: string, limitCount: number = 10): Promise<User[]> {
  try {
    const followingQuery = query(collection(db, "follows"), where("followerId", "==", userId))
    const followingSnap = await getDocs(followingQuery)
    const followingIds = followingSnap.docs.map((doc) => doc.data().followingId)
    followingIds.push(userId) 

    if (followingIds.length === 0) {
      return getPopularUsers(limitCount)
    }

    const recommendations = new Map<string, number>() 

    for (const followedUserId of followingIds.slice(0, 10)) {
      const theirFollowingQuery = query(
        collection(db, "follows"),
        where("followerId", "==", followedUserId),
      )
      const theirSnap = await getDocs(theirFollowingQuery)

      theirSnap.forEach((doc) => {
        const suggestedUserId = doc.data().followingId
        if (!followingIds.includes(suggestedUserId)) {
          const currentScore = recommendations.get(suggestedUserId) || 0
          recommendations.set(suggestedUserId, currentScore + 1)
        }
      })
    }

    const sortedUserIds = Array.from(recommendations.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limitCount)
      .map(([userId]) => userId)

    const users: User[] = []
    for (const uid of sortedUserIds) {
      const userDoc = await getDocs(query(collection(db, "users"), where("id", "==", uid)))
      if (!userDoc.empty) {
        const data = userDoc.docs[0].data()
        users.push({
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
        } as User)
      }
    }

    return users
  } catch (error) {
    console.error("Error getting recommended users:", error)
    return []
  }
}

async function getPopularUsers(limitCount: number = 10): Promise<User[]> {
  try {
    const usersQuery = query(
      collection(db, "users"),
      orderBy("followersCount", "desc"),
      limit(limitCount),
    )
    const snapshot = await getDocs(usersQuery)
    const users: User[] = []

    snapshot.forEach((doc) => {
      const data = doc.data()
      users.push({
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
      } as User)
    })

    return users
  } catch (error) {
    console.error("Error getting popular users:", error)
    return []
  }
}


export async function getRecommendedPosts(limitCount: number = 20): Promise<Post[]> {
  try {
    const postsQuery = query(
      collection(db, "posts"),
      orderBy("likes", "desc"),
      orderBy("createdAt", "desc"),
      limit(limitCount),
    )

    const snapshot = await getDocs(postsQuery)
    const posts: Post[] = []

    snapshot.forEach((doc) => {
      const data = doc.data()
      posts.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
      } as Post)
    })

    return posts
  } catch (error) {
    console.error("Error getting recommended posts:", error)
    return []
  }
}

export async function getTrendingHashtags(limitCount: number = 10): Promise<{ tag: string; count: number }[]> {
  try {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const postsQuery = query(
      collection(db, "posts"),
      where("createdAt", ">=", sevenDaysAgo),
      orderBy("createdAt", "desc"),
    )

    const snapshot = await getDocs(postsQuery)
    const hashtagCounts = new Map<string, number>()

    snapshot.forEach((doc) => {
      const data = doc.data()
      const hashtags = data.hashtags || []

      hashtags.forEach((tag: string) => {
        const cleanTag = tag.toLowerCase().replace("#", "")
        const currentCount = hashtagCounts.get(cleanTag) || 0
        hashtagCounts.set(cleanTag, currentCount + 1)
      })
    })

    const trending = Array.from(hashtagCounts.entries())
      .map(([tag, count]) => ({ tag: `#${tag}`, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limitCount)

    return trending
  } catch (error) {
    console.error("Error getting trending hashtags:", error)
    return [
      { tag: "#snapnow", count: 0 },
      { tag: "#photography", count: 0 },
      { tag: "#travel", count: 0 },
    ]
  }
}


export async function getPersonalizedFeed(userId: string, limitCount: number = 20): Promise<Post[]> {
  try {
    const likesQuery = query(collection(db, "likes"), where("userId", "==", userId))
    const likesSnap = await getDocs(likesQuery)
    const likedPostIds = likesSnap.docs.map((doc) => doc.data().postId)

    if (likedPostIds.length === 0) {
      return getRecommendedPosts(limitCount)
    }

    const hashtags = new Set<string>()
    for (const postId of likedPostIds.slice(0, 10)) {
      const postDoc = await getDocs(query(collection(db, "posts"), where("id", "==", postId)))
      if (!postDoc.empty) {
        const data = postDoc.docs[0].data()
        ;(data.hashtags || []).forEach((tag: string) => hashtags.add(tag.toLowerCase()))
      }
    }

    if (hashtags.size === 0) {
      return getRecommendedPosts(limitCount)
    }

    const hashtagArray = Array.from(hashtags).slice(0, 5) 
    const postsQuery = query(
      collection(db, "posts"),
      where("hashtags", "array-contains-any", hashtagArray),
      orderBy("createdAt", "desc"),
      limit(limitCount),
    )

    const snapshot = await getDocs(postsQuery)
    const posts: Post[] = []

    snapshot.forEach((doc) => {
      const data = doc.data()
      if (!likedPostIds.includes(doc.id)) {
        posts.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
        } as Post)
      }
    })

    return posts
  } catch (error) {
    console.error("Error getting personalized feed:", error)
    return []
  }
}

export default {
  getRecommendedUsers,
  getRecommendedPosts,
  getTrendingHashtags,
  getPersonalizedFeed,
}
