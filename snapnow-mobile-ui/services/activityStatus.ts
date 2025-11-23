import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface ActivityStatus {
  isOnline: boolean;
  lastActive: Date;
  activityStatusEnabled: boolean;
}

/**
 * Update user's online status
 */
export async function updateOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isOnline,
      lastActive: serverTimestamp(),
    });
  } catch (error: any) {
    // Silently ignore permission errors - this feature requires specific Firestore rules
    if (error?.code !== 'permission-denied') {
      console.error('Error updating online status:', error);
    }
  }
}

/**
 * Get user's activity status
 */
export async function getUserActivityStatus(userId: string): Promise<ActivityStatus | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return null;
    }
    
    const data = userSnap.data();
    
    return {
      isOnline: data.isOnline || false,
      lastActive: data.lastActive?.toDate() || new Date(),
      activityStatusEnabled: data.activityStatus !== false, // Default to true
    };
  } catch (error: any) {
    // Nếu lỗi do security rules, trả về null mà không spam console
    if (error?.code === 'permission-denied') {
      return null;
    }
    console.error('Error getting activity status:', error);
    return null;
  }
}

/**
 * Format last active time
 */
export function formatLastActive(lastActive: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - lastActive.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'Active now';
  if (diffMins < 60) return `Active ${diffMins}m ago`;
  if (diffHours < 24) return `Active ${diffHours}h ago`;
  if (diffDays === 1) return 'Active yesterday';
  if (diffDays < 7) return `Active ${diffDays}d ago`;
  
  return 'Active a while ago';
}
