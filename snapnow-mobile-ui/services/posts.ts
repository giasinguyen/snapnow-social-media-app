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
import { Post } from "../types"
import { deletePostActivities, logPostActivity } from "./activityHistory"

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

export async function getSavedPosts(userId: string): Promise<Post[]> {
  try {
    // First get the saved post IDs from the user's saves collection
    const savesQuery = query(
      collection(db, "saves"),
      where("userId", "==", userId),
      orderBy("savedAt", "desc")
    );
    const savesSnap = await getDocs(savesQuery);
    const savedPostIds = savesSnap.docs.map(doc => doc.data().postId);

    if (savedPostIds.length === 0) {
      return [];
    }

    // Fetch each post by id
    const posts: Post[] = [];
    for (const postId of savedPostIds) {
      const postDoc = await getDoc(doc(db, "posts", postId));
      if (postDoc.exists()) {
        const data = postDoc.data() as any;
        posts.push({
          id: postDoc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
        });
      }
    }
    return posts;
  } catch (error) {
    console.error("Error getting saved posts:", error);
    return [];
  }
}

export async function savePost(postId: string, userId: string): Promise<void> {
  try {
    // Add to saves collection
    await addDoc(collection(db, "saves"), {
      postId,
      userId,
      savedAt: serverTimestamp(),
    });

    // Update post saved count
    await updateDoc(doc(db, "posts", postId), {
      savesCount: increment(1),
    });
  } catch (error) {
    console.error("Error saving post:", error);
    throw error;
  }
}

export async function unsavePost(postId: string, userId: string): Promise<void> {
  try {
    // Find and delete the save document
    const saveQuery = query(
      collection(db, "saves"),
      where("postId", "==", postId),
      where("userId", "==", userId)
    );
    const saveSnap = await getDocs(saveQuery);
    
    if (!saveSnap.empty) {
      await deleteDoc(saveSnap.docs[0].ref);
      
      // Update post saved count
      await updateDoc(doc(db, "posts", postId), {
        savesCount: increment(-1),
      });
    }
  } catch (error) {
    console.error("Error unsaving post:", error);
    throw error;
  }
}

export async function fetchFeedPosts(userId: string): Promise<Post[]> {
  try {
    const followingQuery = query(collection(db, "follows"), where("followerId", "==", userId))
    const followingSnap = await getDocs(followingQuery)
    const followingIds = followingSnap.docs.map((doc) => doc.data().followingId)

    followingIds.push(userId)

    if (followingIds.length === 0) {
      return []
    }

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

export async function likePost(postId: string) {
  const ref = doc(db, "posts", postId)
  await updateDoc(ref, { likes: increment(1) })
}

export async function unlikePost(postId: string) {
  const ref = doc(db, "posts", postId)
  await updateDoc(ref, { likes: increment(-1) })
}

export async function createPost(postData: {
  userId: string
  username: string
  userImage?: string
  imageUrl?: string // Keep for backward compatibility
  imageUrls?: string[] // Add support for multiple images
  caption: string
  hashtags?: string[]
}) {
  try {
    // Clean data - remove undefined values to avoid Firestore error
    const cleanData: any = {
      userId: postData.userId,
      username: postData.username,
      userImage: postData.userImage || '', // Default to empty string instead of undefined
      caption: postData.caption,
      hashtags: postData.hashtags || [],
      likes: 0,
      commentsCount: 0,
      createdAt: serverTimestamp(),
    };

    // Add image fields only if they have values
    if (postData.imageUrl) {
      cleanData.imageUrl = postData.imageUrl;
    }
    if (postData.imageUrls && postData.imageUrls.length > 0) {
      cleanData.imageUrls = postData.imageUrls;
    }

    const docRef = await addDoc(collection(db, "posts"), cleanData);

    // Log post activity
    const thumbnailUrl = postData.imageUrls?.[0] || postData.imageUrl;
    await logPostActivity(postData.userId, docRef.id, postData.caption, thumbnailUrl);

    return docRef.id;
  } catch (error) {
    console.error("Error creating post:", error);
    throw error;
  }
}

export function extractHashtags(caption: string): string[] {
  const hashtagRegex = /#[\w]+/g
  const matches = caption.match(hashtagRegex)
  return matches ? matches.map((tag) => tag.toLowerCase()) : []
}

export async function updatePost(postId: string, updates: { 
  caption?: string; 
  hashtags?: string[];
  imageUrls?: string[];
  imageUrl?: string;
}) {
  try {
    const postRef = doc(db, "posts", postId)
    await updateDoc(postRef, updates)
  } catch (error) {
    console.error("Error updating post:", error)
    throw error
  }
}

export async function deletePost(postId: string, userId: string) {
  try {
    const postDoc = await getDoc(doc(db, "posts", postId))
    if (!postDoc.exists()) {
      throw new Error("Post not found")
    }
    
    if (postDoc.data().userId !== userId) {
      throw new Error("Unauthorized: You can only delete your own posts")
    }

    await deleteDoc(doc(db, "posts", postId))

    // Delete all activities related to this post
    await deletePostActivities(postId)

  } catch (error) {
    console.error("Error deleting post:", error)
    throw error
  }
}

export async function getPostsByHashtag(hashtag: string): Promise<Post[]> {
  try {
    const cleanTag = hashtag.toLowerCase().replace('#', '')
    const postsQuery = query(
      collection(db, "posts"),
      where("hashtags", "array-contains", `#${cleanTag}`),
      orderBy("createdAt", "desc")
    )

    const snapshot = await getDocs(postsQuery)
    const posts: Post[] = []

    snapshot.forEach((docSnap) => {
      const data = docSnap.data()
      posts.push({
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
      } as Post)
    })

    return posts
  } catch (error) {
    console.error("Error fetching posts by hashtag:", error)
    return []
  }
}

export async function hasUserBookmarkedPost(userId: string, postId: string): Promise<boolean> {
  try {
    const q = query(
      collection(db, "saves"),
      where("userId", "==", userId),
      where("postId", "==", postId)
    );
    const snap = await getDocs(q);
    return !snap.empty;
  } catch (error) {
    console.error("Error checking bookmark status:", error);
    return false;
  }
}

export async function fetchFeedPostsPaginated(userId: string, page: number = 1): Promise<Post[]> {
  try {
    const followingQuery = query(collection(db, "follows"), where("followerId", "==", userId))
    const followingSnap = await getDocs(followingQuery)
    const followingIds = followingSnap.docs.map((doc) => doc.data().followingId)
    followingIds.push(userId) 

    if (followingIds.length === 0) {
      return []
    }

    const batchSize = 10
    const batches = []
    
    for (let i = 0; i < followingIds.length; i += batchSize) {
      const batch = followingIds.slice(i, i + batchSize)
      const postsQuery = query(
        collection(db, "posts"),
        where("userId", "in", batch),
        orderBy("createdAt", "desc")
      )
      batches.push(getDocs(postsQuery))
    }

    const snapshots = await Promise.all(batches)
    const posts: Post[] = []

    snapshots.forEach((snapshot) => {
      snapshot.forEach((docSnap) => {
        const data = docSnap.data()
        posts.push({
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
        } as Post)
      })
    })

    posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    return posts
  } catch (error) {
    console.error("Error fetching paginated feed posts:", error)
    return []
  }
}


export async function searchPosts(searchTerm: string): Promise<Post[]> {
  try {
    const allPosts = await fetchPosts()
    const lowerSearch = searchTerm.toLowerCase()
    
    return allPosts.filter(post => 
      post.caption?.toLowerCase().includes(lowerSearch) ||
      post.username?.toLowerCase().includes(lowerSearch) ||
      post.hashtags?.some(tag => tag.toLowerCase().includes(lowerSearch))
    )
  } catch (error) {
    console.error("Error searching posts:", error)
    return []
  }
}

/**
 * Fetch all posts by a specific user
 */
export async function fetchUserPosts(userId: string): Promise<Post[]> {
  try {
    console.log('📥 Fetching posts for user:', userId);
    // Use where() only, then sort in memory to avoid needing a composite index
    const q = query(
      collection(db, "posts"),
      where("userId", "==", userId)
    );
    const snap = await getDocs(q);
    const posts: Post[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data() as any;
      posts.push({
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
      } as Post);
    });
    
    // Sort by createdAt in memory (newest first)
    posts.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
      const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
    
    console.log(`✅ Loaded ${posts.length} posts for user ${userId}`);
    return posts;
  } catch (error) {
    console.error("Error fetching user posts:", error);
    return [];
  }
}

export async function getPostSavesCount(postId: string): Promise<number> {
  try {
    const savesQuery = query(
      collection(db, "saves"),
      where("postId", "==", postId)
    );
    const savesSnap = await getDocs(savesQuery);
    return savesSnap.size;
  } catch (error) {
    console.error("Error getting saves count:", error);
    return 0;
  }
}

export default {
  fetchPosts,
  fetchFeedPosts,
  fetchFeedPostsPaginated,
  fetchUserPosts,
  getPost,
  likePost,
  unlikePost,
  createPost,
  updatePost,
  deletePost,
  getPostsByHashtag,
  searchPosts,
  extractHashtags,
  hasUserBookmarkedPost,
}
