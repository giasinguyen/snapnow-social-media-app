/**
 * Cloudinary Configuration
 * Reads from environment variables for security
 */
export const CLOUDINARY_CONFIG = {
  cloudName: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
  uploadPreset: process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '',
  apiKey: process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY || '',
  apiSecret: process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET || '', // Only for backend signed uploads
};

// Validate configuration
if (!CLOUDINARY_CONFIG.cloudName || !CLOUDINARY_CONFIG.uploadPreset) {
  console.error('❌ Cloudinary configuration missing! Check .env file');
  console.log('Required env variables:');
  console.log('- EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME');
  console.log('- EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET');
}

// Upload URL
export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`;

// Folder structure
export const CLOUDINARY_FOLDERS = {
  avatars: 'snapnow/avatars',
  posts: 'snapnow/posts',
  stories: 'snapnow/stories',
  messages: 'snapnow/messages',
  snaps: 'snapnow/snaps',
  albums: 'snapnow/albums',
};
