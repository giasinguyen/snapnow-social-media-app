import {
    addDoc,
    collection,
    deleteDoc,
    getDocs,
    limit,
    orderBy,
    query,
    Timestamp,
    where
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Activity {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'post';
  description: string;
  postId?: string;
  commentId?: string;
  thumbnailUrl?: string;
  timestamp: Timestamp;
}

/**
 * Get user's activity history
 */
export async function getUserActivityHistory(
  userId: string,
  activityType?: 'likes' | 'comments' | 'posts',
  limitCount: number = 50
): Promise<Activity[]> {
  try {
    let q = query(
      collection(db, 'activities'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    // Add filter by activity type if specified
    if (activityType) {
      const typeMap: Record<string, Activity['type']> = {
        likes: 'like',
        comments: 'comment',
        posts: 'post',
      };
      q = query(
        collection(db, 'activities'),
        where('userId', '==', userId),
        where('type', '==', typeMap[activityType]),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Activity[];
  } catch (error) {
    console.error('Error fetching activity history:', error);
    return [];
  }
}

/**
 * Log a like activity
 */
export async function logLikeActivity(
  userId: string,
  postId: string,
  postOwnerId: string,
  thumbnailUrl?: string
): Promise<void> {
  try {
    await addDoc(collection(db, 'activities'), {
      userId,
      type: 'like',
      description: 'You liked a post',
      postId,
      postOwnerId,
      thumbnailUrl,
      timestamp: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error logging like activity:', error);
  }
}

/**
 * Log a comment activity
 */
export async function logCommentActivity(
  userId: string,
  postId: string,
  commentId: string,
  commentText: string,
  postOwnerId: string,
  thumbnailUrl?: string
): Promise<void> {
  try {
    const truncatedText = commentText.length > 50 
      ? commentText.substring(0, 50) + '...' 
      : commentText;
    
    await addDoc(collection(db, 'activities'), {
      userId,
      type: 'comment',
      description: `You commented: "${truncatedText}"`,
      postId,
      commentId,
      postOwnerId,
      thumbnailUrl,
      timestamp: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error logging comment activity:', error);
  }
}

/**
 * Log a post activity
 */
export async function logPostActivity(
  userId: string,
  postId: string,
  caption: string,
  thumbnailUrl?: string
): Promise<void> {
  try {
    const truncatedCaption = caption.length > 50 
      ? caption.substring(0, 50) + '...' 
      : caption;
    
    await addDoc(collection(db, 'activities'), {
      userId,
      type: 'post',
      description: caption ? `You posted: "${truncatedCaption}"` : 'You created a new post',
      postId,
      thumbnailUrl,
      timestamp: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error logging post activity:', error);
  }
}

/**
 * Delete activities related to a post (when post is deleted)
 */
export async function deletePostActivities(postId: string): Promise<void> {
  try {
    const q = query(
      collection(db, 'activities'),
      where('postId', '==', postId)
    );
    const snapshot = await getDocs(q);
    
    // Delete all activities related to this post
    const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting post activities:', error);
  }
}

/**
 * Delete activities related to a comment (when comment is deleted)
 */
export async function deleteCommentActivities(commentId: string): Promise<void> {
  try {
    const q = query(
      collection(db, 'activities'),
      where('commentId', '==', commentId)
    );
    const snapshot = await getDocs(q);
    
    // Delete all activities related to this comment
    const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting comment activities:', error);
  }
}

/**
 * Delete a specific like activity (when unliked)
 */
export async function deleteLikeActivity(
  userId: string,
  postId: string
): Promise<void> {
  try {
    const q = query(
      collection(db, 'activities'),
      where('userId', '==', userId),
      where('postId', '==', postId),
      where('type', '==', 'like')
    );
    const snapshot = await getDocs(q);
    
    // Delete the like activity
    const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting like activity:', error);
  }
}
