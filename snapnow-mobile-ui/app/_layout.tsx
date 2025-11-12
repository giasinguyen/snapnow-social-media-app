import { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { createAdminAccount } from '../services/authService';
import { validateCloudinaryConfig } from '../services/cloudinaryValidator';
import { 
  registerForPushNotifications, 
  setupNotificationListeners,
} from '../services/pushNotifications';
import { InAppNotification } from '../components/InAppNotification';
import { useGlobalMessageNotifications } from '../services/useGlobalMessageNotifications';
import { doc, getDoc } from 'firebase/firestore';

import '../global.css';

export default function RootLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Global message notification monitor - works across entire app
  useGlobalMessageNotifications();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsLoading(false);

      // Register for push notifications when user logs in
      if (user) {
        registerForPushNotifications();
      }
    });

    // Initialize admin account
    createAdminAccount();

    // Validate Cloudinary configuration on startup
    validateCloudinaryConfig();

    // Setup notification listeners
    const cleanupListeners = setupNotificationListeners(
      // When notification received while app is open
      (notification) => {
        console.log('📬 Notification received in app:', notification);
      },
      // When user taps notification
      async (response) => {
        const data = response.notification.request.content.data;
        
        // Navigate to chat if it's a message notification
        if (data?.type === 'message' && data?.conversationId) {
          const conversationId = data.conversationId as string;
          
          try {
            // Fetch conversation details to get other user info
            const conversationRef = doc(db, 'conversations', conversationId);
            const conversationSnap = await getDoc(conversationRef);
            
            if (conversationSnap.exists()) {
              const conversation = conversationSnap.data();
              const currentUserId = auth.currentUser?.uid;
              
              // Get other participant
              const otherUserId = conversation.participants?.find(
                (id: string) => id !== currentUserId
              );
              
              if (otherUserId) {
                // Fetch other user's details
                const userRef = doc(db, 'users', otherUserId);
                const userSnap = await getDoc(userRef);
                
                if (userSnap.exists()) {
                  const userData = userSnap.data();
                  
                  // Navigate with full user details
                  router.push({
                    pathname: '/messages/[conversationId]' as any,
                    params: {
                      conversationId,
                      otherUserId,
                      otherUserName: userData.displayName || userData.username || 'User',
                      otherUserPhoto: userData.profileImage || userData.photoURL || '',
                      otherUserUsername: userData.username || '',
                    },
                  });
                  return;
                }
              }
            }
            
            // Fallback: Just navigate with conversationId
            router.push(`/messages/${conversationId}` as any);
          } catch (error) {
            console.error('❌ Error fetching conversation details:', error);
            // Fallback: Just navigate with conversationId
            router.push(`/messages/${conversationId}` as any);
          }
        }
      }
    );

    return () => {
      unsubscribe();
      cleanupListeners();
    };
  }, []);

  if (isLoading) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
          
          {/* In-app notification banner */}
          <InAppNotification />
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
