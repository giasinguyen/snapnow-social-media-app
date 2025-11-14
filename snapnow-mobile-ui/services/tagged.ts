import {
  collection,
  getDocs,
  query,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Post } from '../types';

/**
 * Extract mentions from caption text
 * Tìm tất cả @username trong caption
 */
export function extractMentions(text: string): string[] {
  if (!text) return [];
  
  // Match @username pattern (chữ, số, dấu gạch dưới, dấu chấm)
  const mentionRegex = /@([a-zA-Z0-9_.]+)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]); // match[1] là username không có @
  }

  return [...new Set(mentions)]; // Remove duplicates
}

/**
 * Fetch posts where user is tagged
 * Tìm tất cả posts có mention @username của user
 */
export async function fetchTaggedPosts(username: string): Promise<Post[]> {
  try {
    // Query tất cả posts
    const postsQuery = query(collection(db, 'posts'));
    const snapshot = await getDocs(postsQuery);

    const taggedPosts: Post[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      
      // Kiểm tra caption có chứa @username không
      if (data.caption) {
        const mentions = extractMentions(data.caption);
        
        if (mentions.includes(username)) {
          taggedPosts.push({
            id: doc.id,
            userId: data.userId,
            username: data.userName || data.username,
            userImage: data.userPhoto,
            imageUrl: data.imageUrl,
            caption: data.caption,
            likes: data.likesCount || 0,
            commentsCount: data.commentsCount || 0,
            createdAt: data.createdAt,
          });
        }
      }
    });

    // Sort by createdAt descending
    taggedPosts.sort((a, b) => {
      const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return timeB - timeA;
    });

    return taggedPosts;
  } catch (error) {
    console.error('Error fetching tagged posts:', error);
    return [];
  }
}

/**
 * Check if a post mentions a specific user
 */
export function isUserTagged(caption: string, username: string): boolean {
  const mentions = extractMentions(caption);
  return mentions.includes(username);
}

/**
 * Add mention to caption text
 */
export function addMentionToCaption(caption: string, username: string): string {
  const mention = `@${username}`;
  
  if (caption.includes(mention)) {
    return caption; // Already mentioned
  }

  return caption ? `${caption} ${mention}` : mention;
}

/**
 * Remove mention from caption text
 */
export function removeMentionFromCaption(caption: string, username: string): string {
  const mention = `@${username}`;
  return caption.replace(new RegExp(mention, 'g'), '').trim();
}
