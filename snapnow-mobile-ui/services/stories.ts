import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from "firebase/firestore"
import { auth, db } from "../config/firebase"
import { createNotification } from "./notifications"

export interface Story {
  id: string
  userId: string
  username: string
  userProfileImage: string
  imageUrl: string
  text?: string
  textStyle?: {
    color: string
    fontSize: number
    fontWeight: string
    backgroundColor?: string
    position: { x: number; y: number }
  }
  createdAt: any
  expiresAt: any
  views: string[] // Array of userIds who viewed
  reactions: { [userId: string]: string } // userId -> emoji
}

export interface StoryView {
  storyId: string
  userId: string
  username: string
  userProfileImage: string
  viewedAt: any
}

// Create a new story
export async function createStory(
  imageUrl: string,
  text?: string,
  textStyle?: Story["textStyle"]
): Promise<string> {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) throw new Error("User must be logged in")

    // Get user profile
    const userDoc = await getDoc(doc(db, "users", currentUser.uid))
    const userData = userDoc.data()

    const now = new Date()
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours

    const storyData = {
      userId: currentUser.uid,
      username: userData?.username || currentUser.displayName || "Unknown",
      userProfileImage: userData?.profileImage || currentUser.photoURL || "",
      imageUrl,
      text: text || null,
      textStyle: textStyle || null,
      createdAt: serverTimestamp(),
      expiresAt: expiresAt,
      views: [],
      reactions: {},
    }

    const docRef = await addDoc(collection(db, "stories"), storyData)
    return docRef.id
  } catch (error) {
    console.error("Error creating story:", error)
    throw error
  }
}

// Get all active stories (not expired)
export async function getActiveStories(): Promise<Story[]> {
  try {
    const now = new Date()
    const storiesQuery = query(
      collection(db, "stories"),
      where("expiresAt", ">", now),
      orderBy("expiresAt", "desc")
    )

    const snapshot = await getDocs(storiesQuery)
    const stories: Story[] = []

    snapshot.forEach((doc) => {
      const data = doc.data()
      stories.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        expiresAt: data.expiresAt?.toDate?.() || new Date(),
      } as Story)
    })

    // Sort by creation time (newest first)
    return stories.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  } catch (error) {
    console.error("Error getting stories:", error)
    return []
  }
}

// Get stories from followed users
export async function getFollowedUsersStories(currentUserId: string): Promise<Story[]> {
  try {
    // Get list of followed users
    const followingQuery = query(
      collection(db, "follows"),
      where("followerId", "==", currentUserId)
    )
    const followingSnapshot = await getDocs(followingQuery)
    const followedUserIds = followingSnapshot.docs.map((doc) => doc.data().followingId)

    // Add current user to the list to see own stories
    followedUserIds.push(currentUserId)

    if (followedUserIds.length === 0) return []

    // Get active stories from followed users
    const now = new Date()
    const allStories: Story[] = []

    // Firebase 'in' queries are limited to 10 items, so we need to batch
    const batchSize = 10
    for (let i = 0; i < followedUserIds.length; i += batchSize) {
      const batch = followedUserIds.slice(i, i + batchSize)
      const storiesQuery = query(
        collection(db, "stories"),
        where("userId", "in", batch),
        where("expiresAt", ">", now)
      )

      const snapshot = await getDocs(storiesQuery)
      snapshot.forEach((doc) => {
        const data = doc.data()
        allStories.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          expiresAt: data.expiresAt?.toDate?.() || new Date(),
        } as Story)
      })
    }

    // Sort by creation time (newest first)
    return allStories.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  } catch (error) {
    console.error("Error getting followed users stories:", error)
    return []
  }
}

// Mark story as viewed
export async function markStoryAsViewed(storyId: string, userId: string): Promise<void> {
  try {
    const storyRef = doc(db, "stories", storyId)
    const storyDoc = await getDoc(storyRef)

    if (!storyDoc.exists()) return

    const storyData = storyDoc.data()
    const views = storyData.views || []

    // Only add if not already viewed
    if (!views.includes(userId)) {
      await updateDoc(storyRef, {
        views: [...views, userId],
      })

      // Create a story view record for detailed tracking
      const userDoc = await getDoc(doc(db, "users", userId))
      const userData = userDoc.data()

      await addDoc(collection(db, "storyViews"), {
        storyId,
        userId,
        username: userData?.username || "Unknown",
        userProfileImage: userData?.profileImage || "",
        viewedAt: serverTimestamp(),
      })
    }
  } catch (error) {
    console.error("Error marking story as viewed:", error)
  }
}

// Add reaction to story
export async function addStoryReaction(storyId: string, userId: string, emoji: string): Promise<void> {
  try {
    const storyRef = doc(db, "stories", storyId)
    const storyDoc = await getDoc(storyRef)

    if (!storyDoc.exists()) return

    const storyData = storyDoc.data()
    const reactions = storyData.reactions || {}

    await updateDoc(storyRef, {
      reactions: {
        ...reactions,
        [userId]: emoji,
      },
    })

    // Send notification to story owner (if not reacting to own story)
    if (storyData.userId !== userId) {
      const userDoc = await getDoc(doc(db, "users", userId))
      const userData = userDoc.data()

      // Check if a notification already exists for this story from this user
      const existingNotifQuery = query(
        collection(db, "notifications"),
        where("userId", "==", storyData.userId),
        where("fromUserId", "==", userId),
        where("storyId", "==", storyId),
        where("type", "==", "story_reaction")
      )
      const existingNotifs = await getDocs(existingNotifQuery)

      // Only create notification if one doesn't exist already
      if (existingNotifs.empty) {
        await createNotification(
          storyData.userId, // story owner
          "story_reaction",
          userId, // reactor
          userData?.username || "Someone",
          userData?.profileImage,
          undefined, // postId
          storyData.imageUrl, // postImageUrl (reuse for story image)
          undefined, // commentText
          undefined, // commentId
          storyId, // storyId
          emoji // reaction emoji
        )
      }
    }
  } catch (error) {
    console.error("Error adding story reaction:", error)
    throw error
  }
}

// Get story viewers
export async function getStoryViewers(storyId: string): Promise<StoryView[]> {
  try {
    const viewsQuery = query(
      collection(db, "storyViews"),
      where("storyId", "==", storyId),
      orderBy("viewedAt", "desc")
    )

    const snapshot = await getDocs(viewsQuery)
    const viewers: StoryView[] = []

    snapshot.forEach((doc) => {
      const data = doc.data()
      viewers.push({
        ...data,
        viewedAt: data.viewedAt?.toDate?.() || new Date(),
      } as StoryView)
    })

    return viewers
  } catch (error) {
    console.error("Error getting story viewers:", error)
    return []
  }
}

// Delete story
export async function deleteStory(storyId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "stories", storyId))

    // Delete associated views
    const viewsQuery = query(collection(db, "storyViews"), where("storyId", "==", storyId))
    const viewsSnapshot = await getDocs(viewsQuery)
    const deletePromises = viewsSnapshot.docs.map((doc) => deleteDoc(doc.ref))
    await Promise.all(deletePromises)
  } catch (error) {
    console.error("Error deleting story:", error)
    throw error
  }
}

// Check if user has viewed story
export function hasViewedStory(story: Story, userId: string): boolean {
  return story.views?.includes(userId) || false
}

// Subscribe to stories in real-time
export function subscribeToStories(
  currentUserId: string,
  callback: (stories: Story[]) => void
): () => void {
  const now = new Date()
  
  // This will need to be optimized based on your follow system
  // For now, get all active stories
  const storiesQuery = query(
    collection(db, "stories"),
    where("expiresAt", ">", now)
  )

  const unsubscribe = onSnapshot(storiesQuery, (snapshot) => {
    const stories: Story[] = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      stories.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        expiresAt: data.expiresAt?.toDate?.() || new Date(),
      } as Story)
    })

    callback(stories.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()))
  })

  return unsubscribe
}

/**
 * Save a story to user's archive
 */
export const saveStory = async (
  storyId: string,
  userId: string,
  storyData?: {
    imageUrl?: string
    username?: string
    caption?: string
  }
) => {
  try {
    const saveRef = doc(db, 'savedStories', `${userId}_${storyId}`)
    await updateDoc(saveRef, {
      storyId,
      userId,
      imageUrl: storyData?.imageUrl || '',
      username: storyData?.username || 'Anonymous',
      caption: storyData?.caption || '',
      savedAt: serverTimestamp(),
    }).catch(() => {
      // If doc doesn't exist, create it
      return addDoc(collection(db, 'savedStories'), {
        storyId,
        userId,
        imageUrl: storyData?.imageUrl || '',
        username: storyData?.username || 'Anonymous',
        caption: storyData?.caption || '',
        savedAt: serverTimestamp(),
      })
    })
  } catch (error) {
    console.error('Error saving story:', error)
    throw error
  }
}

/**
 * Remove a story from user's archive
 */
export const unsaveStory = async (storyId: string, userId: string) => {
  try {
    const q = query(
      collection(db, 'savedStories'),
      where('userId', '==', userId),
      where('storyId', '==', storyId)
    )
    
    const querySnapshot = await getDocs(q)
    querySnapshot.forEach(async (doc) => {
      await deleteDoc(doc.ref)
    })
  } catch (error) {
    console.error('Error unsaving story:', error)
    throw error
  }
}

/**
 * Check if user has saved a story
 */
export const hasUserSavedStory = async (
  userId: string,
  storyId: string
): Promise<boolean> => {
  try {
    const q = query(
      collection(db, 'savedStories'),
      where('userId', '==', userId),
      where('storyId', '==', storyId)
    )

    const querySnapshot = await getDocs(q)
    return !querySnapshot.empty
  } catch (error) {
    console.error('Error checking saved story:', error)
    return false
  }
}

/**
 * Get count of saved stories
 */
export const getSavedStoriesCount = async (storyId: string): Promise<number> => {
  try {
    const q = query(collection(db, 'savedStories'), where('storyId', '==', storyId))
    const querySnapshot = await getDocs(q)
    return querySnapshot.size
  } catch (error) {
    console.error('Error getting saves count:', error)
    return 0
  }
}
