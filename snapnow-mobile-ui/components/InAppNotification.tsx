import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

interface NotificationData {
  title: string;
  message: string;
  conversationId?: string;
}

let showNotificationCallback: ((data: NotificationData) => void) | null = null;

export const InAppNotification = () => {
  const [visible, setVisible] = useState(false);
  const [notificationData, setNotificationData] = useState<NotificationData | null>(null);
  const [slideAnim] = useState(new Animated.Value(-100));

  const hideNotification = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      setNotificationData(null);
    });
  }, [slideAnim]);

  useEffect(() => {
    // Register callback to show notification
    showNotificationCallback = (data: NotificationData) => {
      setNotificationData(data);
      setVisible(true);

      // Slide in
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();

      // Auto hide after 4 seconds
      setTimeout(() => {
        hideNotification();
      }, 4000);
    };

    return () => {
      showNotificationCallback = null;
    };
  }, [hideNotification, slideAnim]);


  const handlePress = async () => {
    hideNotification();
    if (notificationData?.conversationId) {
      const conversationId = notificationData.conversationId;
      
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
  };

  if (!visible || !notificationData) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.notificationCard}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {notificationData.title}
          </Text>
          <Text style={styles.message} numberOfLines={2}>
            {notificationData.message}
          </Text>
        </View>

        <TouchableOpacity onPress={hideNotification} style={styles.closeButton}>
          <Ionicons name="close" size={20} color="#8E8E8E" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Export function to show notification from anywhere
export const showInAppNotification = (data: NotificationData) => {
  if (showNotificationCallback) {
    showNotificationCallback(data);
  }
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingHorizontal: 12,
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0095f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#262626',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    color: '#8E8E8E',
    lineHeight: 18,
  },
  closeButton: {
    padding: 4,
  },
});
