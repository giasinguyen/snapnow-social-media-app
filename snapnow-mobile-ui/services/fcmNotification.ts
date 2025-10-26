import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import apiClient, { getErrorMessage } from './api';


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});


export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push notification permissions');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};


export const getFcmToken = async (): Promise<string | null> => {
  try {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: 'your-expo-project-id', 
    });

    console.log('📱 FCM Token:', token.data);
    return token.data;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

export const registerFcmToken = async (): Promise<void> => {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('Notification permissions not granted');
      return;
    }

    const token = await getFcmToken();
    if (!token) {
      console.log('Failed to get FCM token');
      return;
    }

    await apiClient.post('/users/fcm-token', {
      token,
      platform: Platform.OS,
    });

    console.log('✅ FCM token registered with backend');
  } catch (error) {
    console.error('Error registering FCM token:', error);
    throw new Error(getErrorMessage(error));
  }
};


export const removeFcmToken = async (): Promise<void> => {
  try {
    const token = await getFcmToken();
    if (!token) return;

    await apiClient.delete('/users/fcm-token', {
      data: { token },
    });

    console.log('✅ FCM token removed from backend');
  } catch (error) {
    console.error('Error removing FCM token:', error);
  }
};


export const setupNotificationListeners = () => {
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('📨 Notification received:', notification);
  });

  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('👆 Notification tapped:', response);
    
    const data = response.notification.request.content.data;
    
    if (data.postId) {
      console.log('Navigate to post:', data.postId);
    } else if (data.userId) {
      console.log('Navigate to profile:', data.userId);
    }
  });

  return () => {
    notificationListener.remove();
    responseListener.remove();
  };
};
