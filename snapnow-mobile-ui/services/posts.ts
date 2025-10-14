import {
  addDoc,
  collection,
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

export interface Post {
  id: string
  userId?: string
  username?: string
  userImage?: string
  imageUrl?: string
  caption?: string
  hashtags?: string[]
  likes?: number
  commentsCount?: number
  createdAt?: any
}

// Fetch all posts ordered by creation date
export async function fetchPosts(): Promise<Post[]> {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"))
  const snap = await getDocs(q)
  const posts: Post[] = []
  snap.forEach((docSnap) => {
    const data = docSnap.data() as any
    posts.push({
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || new Date(),
    } as Post)
  })
  return posts
}

// Fetch posts from users that the current user follows
export async function fetchFeedPosts(userId: string): Promise<Post[]> {
  try {
    // Get list of users the current user is following
    const followingQuery = query(collection(db, "follows"), where("followerId", "==", userId))
    const followingSnap = await getDocs(followingQuery)
    const followingIds = followingSnap.docs.map((doc) => doc.data().followingId)

    // Include the user's own posts
    followingIds.push(userId)

    if (followingIds.length === 0) {
      return []
    }

    // Fetch posts from followed users (Firestore 'in' query supports up to 10 items)
    // For production, you'd need to batch this or use a different approach
    const postsQuery = query(
      collection(db, "posts"),
      where("userId", "in", followingIds.slice(0, 10)),
      orderBy("createdAt", "desc"),
    )

    const postsSnap = await getDocs(postsQuery)
    const posts: Post[] = []

    postsSnap.forEach((docSnap) => {
      const data = docSnap.data()
      posts.push({
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
      } as Post)
    })

    return posts
  } catch (error) {
    console.error("Error fetching feed posts:", error)
    return []
  }
}

// Get a single post by ID
export async function getPost(postId: string): Promise<Post | null> {
  try {
    const postDoc = await getDoc(doc(db, "posts", postId))
    if (postDoc.exists()) {
      const data = postDoc.data()
      return {
        id: postDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
      } as Post
    }
    return null
  } catch (error) {
    console.error("Error getting post:", error)
    return null
  }
}

// Like a post
export async function likePost(postId: string) {
  const ref = doc(db, "posts", postId)
  await updateDoc(ref, { likes: increment(1) })
}

// Unlike a post
export async function unlikePost(postId: string) {
  const ref = doc(db, "posts", postId)
  await updateDoc(ref, { likes: increment(-1) })
}

// Create a new post
export async function createPost(postData: {
  userId: string
  username: string
  userImage?: string
  imageUrl: string
  caption: string
  hashtags?: string[]
}) {
  try {
    const docRef = await addDoc(collection(db, "posts"), {
      ...postData,
      likes: 0,
      commentsCount: 0,
      createdAt: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error creating post:", error)
    throw error
  }
}

// Extract hashtags from caption
export function extractHashtags(caption: string): string[] {
  const hashtagRegex = /#[\w]+/g
  const matches = caption.match(hashtagRegex)
  return matches ? matches.map((tag) => tag.toLowerCase()) : []
}

export default { fetchPosts, fetchFeedPosts, getPost, likePost, unlikePost, createPost, extractHashtags }
