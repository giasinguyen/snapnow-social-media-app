import * as Notifications from 'expo-notifications';

/**
 * Check and display current notification permission status
 */
export async function checkNotificationPermissions(): Promise<void> {
  try {
    const { status, canAskAgain, granted } = await Notifications.getPermissionsAsync();
    
    console.log('📋 Notification Permissions Status:');
    console.log('  - Status:', status);
    console.log('  - Granted:', granted);
    console.log('  - Can Ask Again:', canAskAgain);
    
    if (!granted) {
      console.log('⚠️ Notification permissions not granted!');
      console.log('📝 Please enable notifications in your device settings:');
      console.log('   iOS: Settings > SnapNow > Notifications');
      console.log('   Android: Settings > Apps > SnapNow > Notifications');
    } else {
      console.log('✅ Notification permissions granted!');
    }
    
    return;
  } catch (error) {
    console.error('❌ Error checking notification permissions:', error);
  }
}

/**
 * Request notification permissions from user
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    
    if (existingStatus === 'granted') {
      console.log('✅ Notification permissions already granted');
      return true;
    }
    
    const { status } = await Notifications.requestPermissionsAsync();
    
    if (status === 'granted') {
      console.log('✅ Notification permissions granted!');
      return true;
    } else {
      console.log('❌ Notification permissions denied');
      return false;
    }
  } catch (error) {
    console.error('❌ Error requesting notification permissions:', error);
    return false;
  }
}
