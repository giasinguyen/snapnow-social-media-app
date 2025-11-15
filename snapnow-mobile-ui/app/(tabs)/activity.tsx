import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyNotifications, NotificationSection } from '../../components/notifications';
import { auth } from '../../config/firebase';
import { useNotifications } from '../../hooks/useNotifications';
import { getPendingRequestsCount } from '../../services/followRequests';
import { COLORS, SPACING, TYPOGRAPHY } from '../../src/constants/theme';
import { groupNotificationsByTime } from '../../utils/notificationUtils';

export default function ActivityScreen() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refresh,
  } = useNotifications();

  const [refreshing, setRefreshing] = React.useState(false);
  const [requestsCount, setRequestsCount] = React.useState(0);

  // Mark all as read when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (unreadCount > 0) {
        markAllAsRead();
      }
      
      // Load follow requests count
      const loadRequestsCount = async () => {
        const userId = auth.currentUser?.uid;
        if (userId) {
          const count = await getPendingRequestsCount(userId);
          setRequestsCount(count);
        }
      };
      loadRequestsCount();
    }, [unreadCount, markAllAsRead])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleNotificationPress = useCallback(
    async (notification: any) => {
      if (!notification.isRead) {
        await markAsRead(notification.id);
      }
    },
    [markAsRead]
  );

  const handleMarkAllAsRead = useCallback(async () => {
    if (unreadCount > 0) {
      await markAllAsRead();
    }
  }, [unreadCount, markAllAsRead]);

  // Group notifications by time
  const groupedNotifications = groupNotificationsByTime(notifications);

  if (loading && notifications.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ed4956" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllAsRead}>
            <Text style={styles.markAllReadText}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {notifications.length === 0 ? (
        <EmptyNotifications />
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Follow Requests Section */}
          {requestsCount > 0 && (
            <TouchableOpacity
              style={styles.followRequestsBanner}
              onPress={() => router.push('/user/follow-requests')}
            >
              <View style={styles.followRequestsLeft}>
                <View style={styles.followRequestsIcon}>
                  <Ionicons name="person-add" size={20} color="#0095F6" />
                </View>
                <View>
                  <Text style={styles.followRequestsTitle}>Follow Requests</Text>
                  <Text style={styles.followRequestsSubtitle}>
                    {requestsCount} {requestsCount === 1 ? 'request' : 'requests'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8E8E8E" />
            </TouchableOpacity>
          )}

          <NotificationSection
            title="Today"
            notifications={groupedNotifications.today}
            onNotificationPress={handleNotificationPress}
          />
          <NotificationSection
            title="This Week"
            notifications={groupedNotifications.thisWeek}
            onNotificationPress={handleNotificationPress}
          />
          <NotificationSection
            title="This Month"
            notifications={groupedNotifications.thisMonth}
            onNotificationPress={handleNotificationPress}
          />
          <NotificationSection
            title="Older"
            notifications={groupedNotifications.older}
            onNotificationPress={handleNotificationPress}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.display,
    fontWeight: '700',
    color: '#262626',
    letterSpacing: -0.5,
  },
  markAllReadText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#8E8E8E',
    textAlign: 'center',
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  followRequestsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 0.5,
    borderBottomColor: '#EFEFEF',
  },
  followRequestsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  followRequestsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E7F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  followRequestsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#262626',
  },
  followRequestsSubtitle: {
    fontSize: 13,
    color: '#8E8E8E',
    marginTop: 2,
  },
});
