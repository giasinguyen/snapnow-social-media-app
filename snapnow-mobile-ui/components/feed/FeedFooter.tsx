import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../src/constants/theme';

interface FeedFooterProps {
  onRefresh?: () => void;
}

const FeedFooter: React.FC<FeedFooterProps> = React.memo(({ onRefresh }) => {
  return (
    <View style={styles.container}>
      <Ionicons name="checkmark-circle-outline" size={48} color={COLORS.blue} />
      <Text style={styles.title}>You&apos;re all caught up</Text>
      <Text style={styles.subtitle}>
        You&apos;ve seen all new posts from the past 3 days
      </Text>
      {onRefresh && (
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh-outline" size={20} color={COLORS.blue} />
          <Text style={styles.refreshButtonText}>Refresh feed</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

FeedFooter.displayName = 'FeedFooter';

export default FeedFooter;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: SPACING.huge,
    paddingHorizontal: 40,
    backgroundColor: COLORS.backgroundWhite,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.lineHeight.tight,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: COLORS.blue,
    borderRadius: RADIUS.round,
  },
  refreshButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.blue,
  },
});
