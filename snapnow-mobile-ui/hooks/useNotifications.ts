import { useEffect, useState } from 'react';
import { AuthService } from '../services/authService';
import {
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  subscribeToNotifications,
} from '../services/notifications';
import { Notification } from '../types';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const setupNotifications = async () => {
      try {
        setLoading(true);
        setError(null);

        const currentUser = AuthService.getCurrentUser();
        if (!currentUser) {
          setError('User not authenticated');
          setLoading(false);
          return;
        }

        console.log('📡 Setting up real-time notifications for user:', currentUser.uid);

        // Subscribe to real-time notifications
        unsubscribe = subscribeToNotifications(currentUser.uid, (notifs) => {
          console.log('✅ Received', notifs.length, 'notifications');
          setNotifications(notifs);
          setLoading(false);
        });

        // Get unread count
        const count = await getUnreadNotificationCount(currentUser.uid);
        setUnreadCount(count);
        console.log('📊 Unread notifications:', count);
      } catch (err) {
        console.error('❌ Error setting up notifications:', err);
        setError(err instanceof Error ? err.message : 'Failed to load notifications');
        setLoading(false);
      }
    };

    setupNotifications();

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        console.log('🔌 Unsubscribing from notifications');
        unsubscribe();
      }
    };
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      
      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      
      console.log('✅ Marked notification as read:', notificationId);
    } catch (err) {
      console.error('❌ Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const currentUser = AuthService.getCurrentUser();
      if (!currentUser) return;

      await markAllNotificationsAsRead(currentUser.uid);
      
      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      
      console.log('✅ Marked all notifications as read');
    } catch (err) {
      console.error('❌ Error marking all as read:', err);
    }
  };

  const refresh = async () => {
    try {
      const currentUser = AuthService.getCurrentUser();
      if (!currentUser) return;

      const count = await getUnreadNotificationCount(currentUser.uid);
      setUnreadCount(count);
      
      console.log('🔄 Refreshed unread count:', count);
    } catch (err) {
      console.error('❌ Error refreshing notifications:', err);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refresh,
  };
}
