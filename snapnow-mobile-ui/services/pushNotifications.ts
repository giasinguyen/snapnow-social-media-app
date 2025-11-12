import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, AppState } from 'react-native';
import { auth, db } from '../config/firebase';
import { doc, setDoc } from 'firebase/firestore';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Register for push notifications and get token
 * 
 * For Development: Uses device push token (local notifications only)
 * For Production: Run `eas init` and `eas build:configure` to get Expo project ID
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    // Check if device supports push notifications
    if (!Device.isDevice) {
      console.log('⚠️ Push notifications only work on physical devices');
      return null;
    }

    // Get existing permission status
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permission if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('❌ Permission for push notifications denied');
      return null;
    }

    // Get push notification token
    let token: string;
    try {
      // For development/testing - use device push token
      // This works for local notifications without requiring EAS project
      console.log('📱 Getting device push token for development...');
      const deviceToken = await Notifications.getDevicePushTokenAsync();
      token = deviceToken.data;
      console.log('✅ Device push token obtained');
      
      // Note: For production with Expo Push Notification service:
      // 1. Run: npx eas init
      // 2. Get projectId from app.json extra.eas.projectId
      // 3. Use: Notifications.getExpoPushTokenAsync({ projectId })
    } catch (error) {
      console.error('❌ Error getting push token:', error);
      return null;
    }
    
    console.log('✅ Push notification token:', token.substring(0, 20) + '...');

    // Save token to Firestore for current user
    const currentUser = auth.currentUser;
    if (currentUser) {
      await savePushToken(currentUser.uid, token);
    }

    // Configure Android channel (required for Android 8.0+)
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('messages', {
        name: 'Messages',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF3B30',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3b82f6',
        sound: 'default',
      });
    }

    return token;
  } catch (error) {
    console.error('❌ Error registering for push notifications:', error);
    return null;
  }
}

/**
 * Save push token to Firestore
 */
async function savePushToken(userId: string, token: string): Promise<void> {
  try {
    const tokenRef = doc(db, 'users', userId, 'tokens', token);
    await setDoc(tokenRef, {
      token,
      platform: Platform.OS,
      deviceName: Device.deviceName || 'Unknown',
      createdAt: new Date(),
      updatedAt: new Date(),
    }, { merge: true });

    console.log('✅ Push token saved to Firestore');
  } catch (error) {
    console.error('❌ Error saving push token:', error);
  }
}

/**
 * Send local notification (for testing or immediate notifications)
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: any
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
        badge: 1,
      },
      trigger: null, // Show immediately
    });
  } catch (error) {
    console.error('❌ Error sending local notification:', error);
  }
}

/**
 * Show notification when app receives new message
 */
export async function showMessageNotification(
  senderName: string,
  messageText: string,
  conversationId: string
): Promise<void> {
  try {
    console.log('🔔 Scheduling notification:', { senderName, messageText, conversationId });
    
    // Always schedule the notification
    // iOS/Android will handle whether to show it based on app state
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: senderName,
        body: messageText || 'Sent you an image',
        data: {
          type: 'message',
          conversationId,
        },
        sound: 'default',
        badge: 1,
        categoryIdentifier: 'message',
      },
      trigger: null, // Show immediately
    });
    
    console.log('✅ Notification scheduled with ID:', notificationId);
  } catch (error) {
    console.error('❌ Error showing message notification:', error);
    throw error;
  }
}

/**
 * Clear app badge count
 */
export async function clearBadgeCount(): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(0);
  } catch (error) {
    console.error('❌ Error clearing badge count:', error);
  }
}

/**
 * Set up notification listeners
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void
): () => void {
  // Listener for when notification is received while app is open
  const receivedListener = Notifications.addNotificationReceivedListener((notification) => {
    console.log('📬 Notification received:', notification);
    if (onNotificationReceived) {
      onNotificationReceived(notification);
    }
  });

  // Listener for when user taps on notification
  const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('👆 Notification tapped:', response);
    if (onNotificationResponse) {
      onNotificationResponse(response);
    }
  });

  // Return cleanup function
  return () => {
    receivedListener.remove();
    responseListener.remove();
  };
}

export default {
  registerForPushNotifications,
  sendLocalNotification,
  showMessageNotification,
  clearBadgeCount,
  setupNotificationListeners,
};
