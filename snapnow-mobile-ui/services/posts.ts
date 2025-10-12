import { collection, doc, getDocs, increment, orderBy, query, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Post {
  id: string;
  userId?: string;
  username?: string;
  userImage?: string;
  imageUrl?: string;
  caption?: string;
  likes?: number;
  createdAt?: any;
}

export async function fetchPosts(): Promise<Post[]> {
  const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  const posts: Post[] = [];
  snap.forEach(docSnap => {
    const data = docSnap.data() as any;
    posts.push({ id: docSnap.id, ...data } as Post);
  });
  return posts;
}

export async function likePost(postId: string) {
  const ref = doc(db, 'posts', postId);
  await updateDoc(ref, { likes: increment(1) });
}

export async function unlikePost(postId: string) {
  const ref = doc(db, 'posts', postId);
  await updateDoc(ref, { likes: increment(-1) });
}

export default { fetchPosts, likePost, unlikePost };
