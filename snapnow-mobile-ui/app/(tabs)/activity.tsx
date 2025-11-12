import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
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
import { useNotifications } from '../../hooks/useNotifications';
import { COLORS, SPACING, TYPOGRAPHY } from '../../src/constants/theme';
import { groupNotificationsByTime } from '../../utils/notificationUtils';

export default function ActivityScreen() {
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

  // Mark all as read when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (unreadCount > 0) {
        markAllAsRead();
      }
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
});
