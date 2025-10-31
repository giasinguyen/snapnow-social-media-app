import { CLOUDINARY_CONFIG } from '../config/cloudinary';

/**
 * Test if upload preset exists on Cloudinary
 * This makes a test request to check preset configuration
 */
export const testCloudinaryPreset = async (): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> => {
  try {
    console.log('🧪 Testing Cloudinary upload preset...');
    console.log('Config:', {
      cloudName: CLOUDINARY_CONFIG.cloudName,
      uploadPreset: CLOUDINARY_CONFIG.uploadPreset,
    });

    if (!CLOUDINARY_CONFIG.cloudName) {
      return {
        success: false,
        message: 'Cloud name is missing. Check .env file for EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME',
      };
    }

    if (!CLOUDINARY_CONFIG.uploadPreset) {
      return {
        success: false,
        message: 'Upload preset is missing. Check .env file for EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET',
      };
    }

    // Create a minimal test upload (1x1 transparent PNG)
    const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const formData = new FormData();
    formData.append('file', testImage);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`;

    console.log('📤 Testing upload to:', uploadUrl);

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Test failed:', data);
      
      if (data.error?.message?.includes('preset')) {
        return {
          success: false,
          message: `Upload preset "${CLOUDINARY_CONFIG.uploadPreset}" not found. Please create it in Cloudinary Console:\n\n1. Go to https://console.cloudinary.com/settings/upload\n2. Click "Add upload preset"\n3. Name: ${CLOUDINARY_CONFIG.uploadPreset}\n4. Signing Mode: Unsigned ⚠️\n5. Click Save`,
          details: data.error,
        };
      }

      return {
        success: false,
        message: data.error?.message || 'Upload test failed',
        details: data.error,
      };
    }

    console.log('✅ Test upload successful!');
    console.log('Public ID:', data.public_id);

    return {
      success: true,
      message: `Upload preset "${CLOUDINARY_CONFIG.uploadPreset}" is working correctly!`,
      details: {
        publicId: data.public_id,
        url: data.secure_url,
      },
    };
  } catch (error: any) {
    console.error('❌ Test error:', error);
    return {
      success: false,
      message: error.message || 'Unknown error',
    };
  }
};

/**
 * Get quick fix instructions for common errors
 */
export const getCloudinaryFixInstructions = (errorMessage: string): string => {
  if (errorMessage.includes('preset')) {
    return `
🔧 FIX: Create Upload Preset

1. Go to: https://console.cloudinary.com/settings/upload
2. Click: "Add upload preset"
3. Fill in:
   - Name: ${CLOUDINARY_CONFIG.uploadPreset}
   - Signing Mode: Unsigned ⚠️ (IMPORTANT!)
   - Folder: snapnow (optional)
4. Click: Save
5. Try upload again!

📖 Detailed guide: FIX_UPLOAD_PRESET_ERROR.md
`;
  }

  if (errorMessage.includes('cloud name')) {
    return `
🔧 FIX: Check Cloud Name

1. Go to: https://console.cloudinary.com/
2. Find your Cloud Name (top left corner)
3. Update .env file:
   EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
4. Restart Metro: npx expo start -c
`;
  }

  return `
🔧 Check configuration:
1. Verify .env file exists and contains:
   - EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME
   - EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET
2. Restart Metro: npx expo start -c
3. Check console logs for details
`;
};
