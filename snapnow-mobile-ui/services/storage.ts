import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { storage } from '../config/firebase';


export async function uploadImageFromUri(path: string, uri: string): Promise<string> {
  try {
    console.log('🔄 Starting upload:', { path, uri });
    
    // Fetch the image as blob using React Native's fetch
    console.log('📤 Fetching image as blob...');
    const response = await fetch(uri);
    const blob = await response.blob();
    
    console.log('📤 Uploading blob, size:', blob.size, 'type:', blob.type);
    
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, blob, {
      contentType: 'image/jpeg',
    });
    
    // Wait for upload to complete
    await new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`📊 Upload progress: ${progress.toFixed(0)}%`);
        },
        (error) => reject(error),
        () => resolve(uploadTask.snapshot)
      );
    });
    
    const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
    
    console.log('✅ Upload successful:', { path, url: downloadUrl });
    return downloadUrl;
  } catch (error: any) {
    console.error('❌ Upload failed:', {
      error: error.message,
      code: error.code,
      path,
      uri,
    });
    throw new Error(`Failed to upload: ${error.message}`);
  }
}

export default { uploadImageFromUri };
