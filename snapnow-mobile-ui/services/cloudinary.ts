import { CLOUDINARY_CONFIG, CLOUDINARY_UPLOAD_URL } from '../config/cloudinary';

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  bytes: number;
  url: string;
}

export interface UploadOptions {
  folder?: string;
  transformation?: string;
  tags?: string[];
  onProgress?: (progress: number) => void;
}

/**
 * Upload image to Cloudinary using unsigned upload
 * @param uri - Local image URI
 * @param options - Upload options
 */
export const uploadToCloudinary = async (
  uri: string,
  options: UploadOptions = {}
): Promise<CloudinaryUploadResponse> => {
  try {
    // Debug: Log config
    console.log('🔧 Cloudinary Config:', {
      cloudName: CLOUDINARY_CONFIG.cloudName,
      uploadPreset: CLOUDINARY_CONFIG.uploadPreset,
      uploadUrl: CLOUDINARY_UPLOAD_URL,
    });

    // Create form data
    const formData = new FormData();
    
    // Get file info from URI
    const filename = uri.split('/').pop() || 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    // Append file
    formData.append('file', {
      uri,
      type,
      name: filename,
    } as any);

    // Append upload preset (required for unsigned upload)
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    console.log('📋 Using upload preset:', CLOUDINARY_CONFIG.uploadPreset);

    // Optional folder
    if (options.folder) {
      formData.append('folder', options.folder);
    }

    // Optional tags
    if (options.tags && options.tags.length > 0) {
      formData.append('tags', options.tags.join(','));
    }


    // Upload to Cloudinary
    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Cloudinary API Error:', {
        status: response.status,
        error: errorData,
      });
      throw new Error(errorData.error?.message || 'Upload failed');
    }

    const data: CloudinaryUploadResponse = await response.json();
    
    console.log('✅ Cloudinary upload success:', {
      url: data.secure_url,
      publicId: data.public_id,
      size: `${(data.bytes / 1024).toFixed(2)} KB`,
    });

    return data;
  } catch (error: any) {
    console.error('❌ Cloudinary upload error:', error);
    
    // Show helpful fix instructions
    if (error.message?.includes('preset')) {
      console.error(`
╔════════════════════════════════════════════════════════════╗
║  🔧 FIX: Upload Preset Not Found                          ║
╠════════════════════════════════════════════════════════════╣
║  1. Go to: https://console.cloudinary.com/settings/upload ║
║  2. Click: "Add upload preset"                            ║
║  3. Name: ${CLOUDINARY_CONFIG.uploadPreset.padEnd(45)} ║
║  4. Signing Mode: Unsigned ⚠️  (MUST BE UNSIGNED!)        ║
║  5. Click: Save                                            ║
║                                                            ║
║  📖 Detailed guide: FIX_UPLOAD_PRESET_ERROR.md            ║
╚════════════════════════════════════════════════════════════╝
      `);
    }
    
    throw error;
  }
};

/**
 * Upload avatar to Cloudinary
 */
export const uploadAvatar = async (
  uri: string,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const result = await uploadToCloudinary(uri, {
    folder: 'snapnow/avatars',
    tags: ['avatar', userId],
    // Transformation removed - configure in upload preset instead
    onProgress,
  });

  return result.secure_url;
};

/**
 * Upload post image to Cloudinary
 */
export const uploadPostImage = async (
  uri: string,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const result = await uploadToCloudinary(uri, {
    folder: 'snapnow/posts',
    tags: ['post', userId],
    // Transformation removed - configure in upload preset instead
    onProgress,
  });

  return result.secure_url;
};

/**
 * Delete image from Cloudinary (requires signed request)
 * Note: For production, this should be done via backend API
 */
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  console.warn('⚠️ Delete operation requires backend API with signature');
  // This requires API secret, should be implemented in backend
  throw new Error('Delete operation must be implemented in backend');
};

/**
 * Generate Cloudinary URL with transformations
 */
export const getCloudinaryUrl = (
  publicId: string,
  transformation?: string
): string => {
  const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload`;
  
  if (transformation) {
    return `${baseUrl}/${transformation}/${publicId}`;
  }
  
  return `${baseUrl}/${publicId}`;
};

/**
 * Get optimized thumbnail URL
 */
export const getThumbnailUrl = (url: string, size: number = 200): string => {
  // Extract public_id from Cloudinary URL
  const match = url.match(/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
  if (!match) return url;
  
  const publicId = match[1];
  return getCloudinaryUrl(publicId, `c_fill,w_${size},h_${size},q_auto:low`);
};
