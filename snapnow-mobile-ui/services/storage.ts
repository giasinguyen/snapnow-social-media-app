import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../config/firebase';

/**
 * Upload a blob or file bytes to Firebase Storage and return the public URL.
 * @param path storage path, e.g. `users/{uid}/avatar.jpg`
 * @param data ArrayBuffer or Uint8Array or Blob
 */
export async function uploadToStorage(path: string, data: Blob | Uint8Array | ArrayBuffer) {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, data as any);
  const url = await getDownloadURL(snapshot.ref);
  return url;
}

export default { uploadToStorage };
