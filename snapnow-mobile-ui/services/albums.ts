import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Album {
  id: string;
  userId: string;
  title: string;
  description?: string;
  coverPhoto?: string; // URL của ảnh bìa album
  postIds: string[]; // Danh sách ID các posts trong album
  postsCount: number;
  createdAt: any;
  updatedAt: any;
}

/**
 * Create a new album
 */
export async function createAlbum(params: {
  userId: string;
  title: string;
  description?: string;
  coverPhoto?: string;
}): Promise<Album> {
  const { userId, title, description, coverPhoto } = params;

  const albumData = {
    userId,
    title,
    description: description || '',
    coverPhoto: coverPhoto || '',
    postIds: [],
    postsCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'albums'), albumData);

  return {
    id: docRef.id,
    ...albumData,
  };
}

/**
 * Fetch user's albums
 */
export async function fetchUserAlbums(userId: string): Promise<Album[]> {
  // Simplified query without orderBy to avoid composite index requirement
  const albumsQuery = query(
    collection(db, 'albums'),
    where('userId', '==', userId)
  );

  const snapshot = await getDocs(albumsQuery);
  
  const albums: Album[] = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    albums.push({
      id: doc.id,
      userId: data.userId,
      title: data.title,
      description: data.description,
      coverPhoto: data.coverPhoto,
      postIds: data.postIds || [],
      postsCount: data.postsCount || 0,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  });

  // Sort manually after fetching
  albums.sort((a, b) => {
    const timeA = a.updatedAt?.toDate ? a.updatedAt.toDate().getTime() : 0;
    const timeB = b.updatedAt?.toDate ? b.updatedAt.toDate().getTime() : 0;
    return timeB - timeA; // Descending order (newest first)
  });

  return albums;
}

/**
 * Get album by ID
 */
export async function getAlbumById(albumId: string): Promise<Album | null> {
  const albumDoc = await getDoc(doc(db, 'albums', albumId));
  
  if (!albumDoc.exists()) {
    return null;
  }

  const data = albumDoc.data();
  return {
    id: albumDoc.id,
    userId: data.userId,
    title: data.title,
    description: data.description,
    coverPhoto: data.coverPhoto,
    postIds: data.postIds || [],
    postsCount: data.postsCount || 0,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

/**
 * Update album
 */
export async function updateAlbum(
  albumId: string,
  updates: {
    title?: string;
    description?: string;
    coverPhoto?: string;
  }
): Promise<void> {
  const updateData: any = {
    ...updates,
    updatedAt: serverTimestamp(),
  };

  await updateDoc(doc(db, 'albums', albumId), updateData);
}

/**
 * Add post to album
 */
export async function addPostToAlbum(albumId: string, postId: string): Promise<void> {
  const albumRef = doc(db, 'albums', albumId);
  const albumDoc = await getDoc(albumRef);

  if (!albumDoc.exists()) {
    throw new Error('Album not found');
  }

  const data = albumDoc.data();
  const postIds = data.postIds || [];

  if (postIds.includes(postId)) {
    return; // Post already in album
  }

  postIds.push(postId);

  await updateDoc(albumRef, {
    postIds,
    postsCount: postIds.length,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Remove post from album
 */
export async function removePostFromAlbum(albumId: string, postId: string): Promise<void> {
  const albumRef = doc(db, 'albums', albumId);
  const albumDoc = await getDoc(albumRef);

  if (!albumDoc.exists()) {
    throw new Error('Album not found');
  }

  const data = albumDoc.data();
  const postIds = (data.postIds || []).filter((id: string) => id !== postId);

  await updateDoc(albumRef, {
    postIds,
    postsCount: postIds.length,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete album
 */
export async function deleteAlbum(albumId: string): Promise<void> {
  await deleteDoc(doc(db, 'albums', albumId));
}
