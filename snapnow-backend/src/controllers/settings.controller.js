const admin = require('firebase-admin');
const db = admin.firestore();

/**
 * Get current application settings
 * @route GET /api/settings
 */
const getSettings = async (req, res) => {
  try {
    const settingsDoc = await db.collection('settings').doc('app_config').get();
    
    if (!settingsDoc.exists) {
      // Return default settings if none exist
      const defaultSettings = {
        siteName: 'SnapNow',
        allowRegistration: true,
        requireEmailVerification: false,
        enableNotifications: true,
        autoModeration: false,
        maxFileSize: 5,
        allowedFileTypes: 'image/jpeg, image/png, image/gif',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      
      // Create default settings in database
      await db.collection('settings').doc('app_config').set(defaultSettings);
      
      return res.status(200).json({
        success: true,
        data: defaultSettings,
        message: 'Default settings returned',
      });
    }

    const settings = settingsDoc.data();
    
    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve settings',
      error: error.message,
    });
  }
};

/**
 * Update application settings
 * @route PUT /api/settings
 */
const updateSettings = async (req, res) => {
  try {
    const {
      siteName,
      allowRegistration,
      requireEmailVerification,
      enableNotifications,
      autoModeration,
      maxFileSize,
      allowedFileTypes,
    } = req.body;

    // Validate settings
    if (!siteName || siteName.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Site name is required',
      });
    }

    if (maxFileSize && (maxFileSize < 1 || maxFileSize > 50)) {
      return res.status(400).json({
        success: false,
        message: 'Max file size must be between 1 and 50 MB',
      });
    }

    // Prepare settings update
    const updatedSettings = {
      siteName: siteName.trim(),
      allowRegistration: Boolean(allowRegistration),
      requireEmailVerification: Boolean(requireEmailVerification),
      enableNotifications: Boolean(enableNotifications),
      autoModeration: Boolean(autoModeration),
      maxFileSize: Number(maxFileSize) || 5,
      allowedFileTypes: allowedFileTypes || 'image/jpeg, image/png, image/gif',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Update settings in Firestore
    await db.collection('settings').doc('app_config').set(updatedSettings, { merge: true });

    res.status(200).json({
      success: true,
      data: updatedSettings,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings',
      error: error.message,
    });
  }
};

/**
 * Reset settings to default
 * @route POST /api/settings/reset
 */
const resetSettings = async (req, res) => {
  try {
    const defaultSettings = {
      siteName: 'SnapNow',
      allowRegistration: true,
      requireEmailVerification: false,
      enableNotifications: true,
      autoModeration: false,
      maxFileSize: 5,
      allowedFileTypes: 'image/jpeg, image/png, image/gif',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('settings').doc('app_config').set(defaultSettings);

    res.status(200).json({
      success: true,
      data: defaultSettings,
      message: 'Settings reset to default successfully',
    });
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset settings',
      error: error.message,
    });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  resetSettings,
};
