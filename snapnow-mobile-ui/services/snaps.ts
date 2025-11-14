import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Snap {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  imageUrl: string;
  caption?: string;
  createdAt: any;
  expiresAt?: any; // Optional: Snaps có thể tự động xóa sau 24h
}

/**
 * Create a new snap
 */
export async function createSnap(params: {
  userId: string;
  userName: string;
  userPhoto: string;
  imageUrl: string;
  caption?: string;
  expiresIn24h?: boolean;
}): Promise<Snap> {
  const { userId, userName, userPhoto, imageUrl, caption, expiresIn24h = true } = params;

  const snapData: any = {
    userId,
    userName,
    userPhoto,
    imageUrl,
    caption: caption || '',
    createdAt: serverTimestamp(),
  };

  // Tự động xóa sau 24h (tùy chọn)
  if (expiresIn24h) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    snapData.expiresAt = expiresAt;
  }

  const docRef = await addDoc(collection(db, 'snaps'), snapData);

  return {
    id: docRef.id,
    ...snapData,
  };
}

/**
 * Fetch user's snaps
 */
export async function fetchUserSnaps(userId: string): Promise<Snap[]> {
  // Simplified query without orderBy to avoid composite index requirement
  const snapsQuery = query(
    collection(db, 'snaps'),
    where('userId', '==', userId)
  );

  const snapshot = await getDocs(snapsQuery);
  
  const snaps: Snap[] = [];
  const now = new Date();

  snapshot.forEach((doc) => {
    const data = doc.data();
    
    // Kiểm tra xem snap có hết hạn chưa
    if (data.expiresAt) {
      const expiresAt = data.expiresAt.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
      if (expiresAt < now) {
        // Xóa snap đã hết hạn
        deleteDoc(doc.ref);
        return;
      }
    }

    snaps.push({
      id: doc.id,
      userId: data.userId,
      userName: data.userName,
      userPhoto: data.userPhoto,
      imageUrl: data.imageUrl,
      caption: data.caption,
      createdAt: data.createdAt,
      expiresAt: data.expiresAt,
    });
  });

  // Sort manually after fetching
  snaps.sort((a, b) => {
    const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
    const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
    return timeB - timeA; // Descending order (newest first)
  });

  return snaps;
}

/**
 * Delete a snap
 */
export async function deleteSnap(snapId: string): Promise<void> {
  await deleteDoc(doc(db, 'snaps', snapId));
}

/**
 * Clean up expired snaps (có thể chạy định kỳ)
 */
export async function cleanupExpiredSnaps(userId: string): Promise<void> {
  const snapsQuery = query(
    collection(db, 'snaps'),
    where('userId', '==', userId)
  );

  const snapshot = await getDocs(snapsQuery);
  const now = new Date();

  const deletePromises: Promise<void>[] = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data.expiresAt) {
      const expiresAt = data.expiresAt.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
      if (expiresAt < now) {
        deletePromises.push(deleteDoc(doc.ref));
      }
    }
  });

  await Promise.all(deletePromises);
}
