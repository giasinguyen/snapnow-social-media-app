import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth } from '../../config/firebase';
import { useTheme } from '../../contexts/ThemeContext';
import { subscribeToUnreadCount } from '../../services/conversations';
import { COLORS, SIZES, SPACING, TYPOGRAPHY } from '../../src/constants/theme';

interface FeedHeaderProps {
  onNotificationsPress?: () => void;
  onMessagesPress?: () => void;
}

const FeedHeader: React.FC<FeedHeaderProps> = React.memo(({
  onNotificationsPress,
  onMessagesPress,
}) => {
  const { colors } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);
  const currentUserId = auth.currentUser?.uid;

  // Subscribe to unread count
  useEffect(() => {
    if (!currentUserId) return;

    const unsubscribe = subscribeToUnreadCount(
      currentUserId,
      (count) => setUnreadCount(count)
    );

    return () => unsubscribe();
  }, [currentUserId]);

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundWhite, borderBottomColor: colors.border }]}>
      <TouchableOpacity style={styles.logoContainer}>
        <Text style={[styles.logoText, { color: colors.textPrimary }]}>SnapNow</Text>
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onNotificationsPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="heart-outline" size={SIZES.icon.lg} color={colors.textPrimary} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onMessagesPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View>
            <Ionicons name="chatbubble-outline" size={SIZES.icon.md} color={colors.textPrimary} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
});

FeedHeader.displayName = 'FeedHeader';

export default FeedHeader;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.backgroundWhite,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: TYPOGRAPHY.fontSize.display,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  actionButton: {
    padding: SPACING.xs,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
