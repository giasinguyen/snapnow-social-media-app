import { collection, endAt, getDocs, limit, orderBy, query, startAt } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface UserSearchResult {
  id: string;
  username?: string;
  displayName?: string;
  profileImage?: string;
}

export async function searchUsersByUsernamePrefix(prefix: string, maxResults = 20): Promise<UserSearchResult[]> {
  if (!prefix) return [];
  // Simple prefix query using >= prefix and < prefix+'\uf8ff'
  const end = prefix + '\uf8ff';
  const q = query(collection(db, 'users'), orderBy('username'), startAt(prefix), endAt(end), limit(maxResults));
  const snap = await getDocs(q);
  const results: UserSearchResult[] = [];
  snap.forEach(d => results.push({ id: d.id, ...(d.data() as any) }));
  return results;
}

export interface PostSearchResult {
  id: string;
  imageUrl?: string;
  caption?: string;
  username?: string;
  userImage?: string;
}

/**
 * Basic posts search: fetch recent posts and filter client-side by caption or hashtag.
 * This is not a full-text search; for production consider Algolia or a text index.
 */
export async function searchPostsByQuery(qstr: string, maxResults = 50): Promise<PostSearchResult[]> {
  if (!qstr) return [];
  // Normalize
  const qLower = qstr.toLowerCase();

  // Fetch recent posts (limit to keep cost low)
  const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(maxResults));
  const snap = await getDocs(q);
  const results: PostSearchResult[] = [];
  snap.forEach(d => {
    const data = d.data() as any;
    const caption = (data.caption || '').toString().toLowerCase();
    // simple contains check for caption or hashtags (hashtags assumed embedded in caption as #tag)
    if (caption.includes(qLower) || caption.split(/\s+/).some((w: string) => w.includes('#') && w.includes(qLower))) {
      results.push({ id: d.id, imageUrl: data.imageUrl, caption: data.caption, username: data.username, userImage: data.userImage });
    }
  });

  return results;
}

export default { searchUsersByUsernamePrefix };
