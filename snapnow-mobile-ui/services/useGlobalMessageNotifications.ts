import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { usePathname } from 'expo-router';
import { auth } from '../config/firebase';
import { subscribeToConversations, Conversation, getOtherParticipant } from './conversations';
import { showMessageNotification } from './pushNotifications';
import { showInAppNotification } from '../components/InAppNotification';

/**
 * Global notification monitor hook
 * Use this at the root level to monitor new messages across the entire app
 */
export function useGlobalMessageNotifications() {
  const previousConversationsRef = useRef<Conversation[]>([]);
  const currentUserId = auth.currentUser?.uid;
  const pathname = usePathname(); // Get current route

  useEffect(() => {
    if (!currentUserId) {
      console.log('⚠️ No user logged in, skipping message notifications');
      return;
    }

    console.log('🔔 Setting up global message notification monitor for user:', currentUserId);

    // Subscribe to all conversations for current user
    const unsubscribe = subscribeToConversations(
      currentUserId,
      (updatedConversations) => {
        console.log('📬 Global Monitor: Received', updatedConversations.length, 'conversations');

        const prevConversations = previousConversationsRef.current;
        const appStateValue = AppState.currentState;

        // Skip first load (no previous data to compare)
        if (prevConversations.length === 0) {
          console.log('📋 First load - initializing conversation list');
          previousConversationsRef.current = updatedConversations;
          return;
        }

        // Check for new messages
        let hasNewMessages = false;
        
        updatedConversations.forEach((conv) => {
          const prevConv = prevConversations.find((p) => p.id === conv.id);
          const unreadCount = conv.unreadCount[currentUserId] || 0;
          const prevUnreadCount = prevConv?.unreadCount[currentUserId] || 0;

          // New message received from another user
          if (unreadCount > prevUnreadCount && conv.lastMessage) {
            const otherUser = getOtherParticipant(conv, currentUserId);
            
            if (otherUser && conv.lastMessage.senderId !== currentUserId) {
              hasNewMessages = true;
              const senderName = otherUser.displayName || otherUser.username;
              const messageText = conv.lastMessage.text || 'Sent you an image';
              
              console.log('🔔 New message detected!');
              console.log('   From:', senderName);
              console.log('   Message:', messageText);
              console.log('   App State:', appStateValue);
              console.log('   Current Path:', pathname);

              // Don't show notification if user is already in Messages screens
              const isInMessagesScreen = pathname?.startsWith('/messages');
              
              if (isInMessagesScreen && appStateValue === 'active') {
                console.log('⏭️ User is already in Messages screen - skipping notification');
                return;
              }

              // Show notification based on app state
              if (appStateValue === 'active') {
                // App is in foreground - show in-app banner
                console.log('📱 Showing in-app notification');
                showInAppNotification({
                  title: senderName,
                  message: messageText,
                  conversationId: conv.id,
                });
              } else {
                // App is in background/inactive - show system notification
                console.log('🔔 Showing system notification');
                showMessageNotification(
                  senderName,
                  messageText,
                  conv.id
                ).catch(err => console.error('❌ Failed to show notification:', err));
              }
            }
          }
        });

        if (hasNewMessages) {
          console.log('✅ Notifications sent successfully');
        }

        // Update previous conversations
        previousConversationsRef.current = updatedConversations;
      },
      (error) => {
        console.error('❌ Global Monitor: Error loading conversations:', error);
      }
    );

    return () => {
      console.log('🔕 Cleaning up global message notification monitor');
      unsubscribe();
    };
  }, [currentUserId, pathname]);
}
