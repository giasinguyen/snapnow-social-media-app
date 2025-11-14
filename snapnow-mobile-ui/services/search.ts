import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface UserSearchResult {
  id: string;
  username?: string;
  displayName?: string;
  profileImage?: string;
}

export async function searchUsersByUsernamePrefix(prefix: string, maxResults = 20): Promise<UserSearchResult[]> {
  if (!prefix) return [];
  
  try {
    // Fetch all users (or use limit to avoid excessive reads)
    const q = query(collection(db, 'users'), orderBy('username'), limit(100));
    const snap = await getDocs(q);
    const results: UserSearchResult[] = [];
    const prefixLower = prefix.toLowerCase();
    
    snap.forEach((d: any) => {
      const data = d.data() as any;
      const username = (data.username || '').toLowerCase();
      const displayName = (data.displayName || '').toLowerCase();
      
      // Search by username prefix or displayName contains
      if (username.startsWith(prefixLower) || displayName.includes(prefixLower)) {
        results.push({ 
          id: d.id, 
          username: data.username,
          displayName: data.displayName,
          profileImage: data.profileImage 
        });
      }
    });
    
    return results.slice(0, maxResults);
  } catch (error: any) {
    console.error('Error searching users:', error);
    
    // Fallback: If ordering by username fails (no index), try fetching without order
    try {
      const q = query(collection(db, 'users'), limit(100));
      const snap = await getDocs(q);
      const results: UserSearchResult[] = [];
      const prefixLower = prefix.toLowerCase();
      
      snap.forEach((d: any) => {
        const data = d.data() as any;
        const username = (data.username || '').toLowerCase();
        const displayName = (data.displayName || '').toLowerCase();
        
        // Search by username prefix or displayName contains
        if (username.startsWith(prefixLower) || displayName.includes(prefixLower)) {
          results.push({ 
            id: d.id, 
            username: data.username,
            displayName: data.displayName,
            profileImage: data.profileImage 
          });
        }
      });
      
      return results.slice(0, maxResults);
    } catch (fallbackError: any) {
      console.error('Fallback search also failed:', fallbackError);
      return [];
    }
  }
}

export interface PostSearchResult {
  id: string;
  imageUrl?: string;
  caption?: string;
  username?: string;
  userImage?: string;
}

export async function searchPostsByQuery(qstr: string, maxResults = 50): Promise<PostSearchResult[]> {
  if (!qstr) return [];
  
  const qLower = qstr.toLowerCase();
  
  // Check if query is a hashtag search (starts with #)
  const isHashtagSearch = qLower.startsWith('#');
  const searchTerm = isHashtagSearch ? qLower.substring(1) : qLower;

  const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(maxResults));
  const snap = await getDocs(q);
  const results: PostSearchResult[] = [];
  
  snap.forEach((d: any) => {
    const data = d.data() as any;
    const caption = (data.caption || '').toString().toLowerCase();
    
    // Match caption text directly
    let captionMatches = caption.includes(searchTerm);
    
    // Match hashtags in caption
    const hashtagRegex = /#\w+/g;
    const hashtags = caption.match(hashtagRegex) || [];
    const hashtagMatches = hashtags.some((tag: string) => tag.toLowerCase().includes('#' + searchTerm));
    
    // If searching for hashtag specifically, only match hashtags
    // Otherwise, match both caption text and hashtags
    if (isHashtagSearch ? hashtagMatches : (captionMatches || hashtagMatches)) {
      results.push({ 
        id: d.id, 
        imageUrl: data.imageUrl, 
        caption: data.caption, 
        username: data.username, 
        userImage: data.userImage 
      });
    }
  });

  return results;
}

export default { searchUsersByUsernamePrefix };
