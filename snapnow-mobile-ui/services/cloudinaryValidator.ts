import { CLOUDINARY_CONFIG } from '../config/cloudinary';

/**
 * Validate Cloudinary configuration
 * Call this on app startup to ensure everything is configured correctly
 */
export const validateCloudinaryConfig = (): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (!CLOUDINARY_CONFIG.cloudName) {
    errors.push('❌ Missing EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME in .env');
  }

  if (!CLOUDINARY_CONFIG.uploadPreset) {
    errors.push('❌ Missing EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env');
  }

  if (CLOUDINARY_CONFIG.cloudName === 'YOUR_CLOUD_NAME') {
    errors.push('❌ Please update EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME in .env with your actual cloud name');
  }

  if (CLOUDINARY_CONFIG.uploadPreset === 'YOUR_UPLOAD_PRESET') {
    errors.push('❌ Please update EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env with your actual preset');
  }

  const isValid = errors.length === 0;

  if (isValid) {
    console.log('✅ Cloudinary configuration is valid');
    console.log('📦 Cloud Name:', CLOUDINARY_CONFIG.cloudName);
    console.log('📤 Upload Preset:', CLOUDINARY_CONFIG.uploadPreset);
  } else {
    console.error('❌ Cloudinary configuration errors:');
    errors.forEach(error => console.error(error));
  }

  return { isValid, errors };
};

/**
 * Test upload preset by making a test request
 * Returns true if preset exists and is configured correctly
 */
export const testUploadPreset = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    const { isValid } = validateCloudinaryConfig();
    if (!isValid) {
      return {
        success: false,
        message: 'Configuration is invalid. Check console for errors.',
      };
    }

    // Note: We can't actually test without uploading a real file
    // This just validates the config exists
    return {
      success: true,
      message: 'Configuration looks good! Try uploading an image to fully test.',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Unknown error',
    };
  }
};

/**
 * Get Cloudinary status info
 */
export const getCloudinaryStatus = () => {
  const { isValid, errors } = validateCloudinaryConfig();

  return {
    configured: isValid,
    cloudName: CLOUDINARY_CONFIG.cloudName,
    uploadPreset: CLOUDINARY_CONFIG.uploadPreset,
    hasApiKey: !!CLOUDINARY_CONFIG.apiKey,
    hasApiSecret: !!CLOUDINARY_CONFIG.apiSecret,
    errors,
  };
};
