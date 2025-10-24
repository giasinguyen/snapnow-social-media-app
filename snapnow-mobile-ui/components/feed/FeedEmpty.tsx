import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../src/constants/theme';

interface FeedEmptyProps {
  onDiscoverPress?: () => void;
}

const FeedEmpty: React.FC<FeedEmptyProps> = React.memo(({ onDiscoverPress }) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="newspaper-outline" size={64} color={COLORS.border} />
      </View>
      <Text style={styles.title}>No Posts Yet</Text>
      <Text style={styles.subtitle}>
        Start following people to see their posts in your feed
      </Text>
      {onDiscoverPress && (
        <TouchableOpacity style={styles.button} onPress={onDiscoverPress} activeOpacity={0.7}>
          <Text style={styles.buttonText}>Discover People</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

FeedEmpty.displayName = 'FeedEmpty';

export default FeedEmpty;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
    backgroundColor: COLORS.backgroundWhite,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.lineHeight.base,
  },
  button: {
    marginTop: SPACING.xxl,
    paddingHorizontal: SPACING.xxxl,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.textPrimary,
    borderRadius: RADIUS.round,
  },
  buttonText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textWhite,
  },
});
