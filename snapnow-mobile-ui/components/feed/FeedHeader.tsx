import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, SIZES } from '../../src/constants/theme';

interface FeedHeaderProps {
  onNotificationsPress?: () => void;
  onMessagesPress?: () => void;
}

const FeedHeader: React.FC<FeedHeaderProps> = React.memo(({
  onNotificationsPress,
  onMessagesPress,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.logoContainer}>
        <Text style={styles.logoText}>SnapNow</Text>
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onNotificationsPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="heart-outline" size={SIZES.icon.lg} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onMessagesPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chatbubble-outline" size={SIZES.icon.md} color={COLORS.textPrimary} />
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
  },
});
