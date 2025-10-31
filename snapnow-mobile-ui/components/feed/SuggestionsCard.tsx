import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  RADIUS,
  SIZES,
} from "../../src/constants/theme";

export interface SuggestedUser {
  id: string;
  displayName: string;
  username: string;
  avatar: string;
  reason?: string;
}

interface SuggestionsCardProps {
  users: SuggestedUser[];
  onFollowPress: (userId: string) => void;
  onSeeAllPress?: () => void;
  title?: string;
  subtitle?: string;
}

const SuggestionsCard: React.FC<SuggestionsCardProps> = React.memo(
  ({
    users,
    onFollowPress,
    onSeeAllPress,
    title = "Suggested for you",
    subtitle = "Based on who you follow",
  }) => {
    console.log('🎴 SuggestionsCard rendering with users:', users.length);
    
    if (users.length === 0) {
      console.log('⚠️ No users to suggest, hiding card');
      return null;
    }

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          {onSeeAllPress && (
            <TouchableOpacity onPress={onSeeAllPress}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          )}
        </View>

        {users.map((user, index) => (
          <View
            key={user.id}
            style={[styles.userItem, index === 0 && styles.firstUserItem]}
          >
            <View style={styles.userLeft}>
              {user.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: '#E1E8ED', justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ fontSize: 24, color: '#657786', fontWeight: '600' }}>
                    {user.displayName?.charAt(0).toUpperCase() || user.username?.charAt(0).toUpperCase() || '?'}
                  </Text>
                </View>
              )}
              <View style={styles.userInfo}>
                <Text style={styles.displayName}>{user.displayName}</Text>
                <Text style={styles.username}>@{user.username}</Text>
                {user.reason && (
                  <Text style={styles.reason}>{user.reason}</Text>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={styles.followButton}
              onPress={() => {
                console.log('🔘 Follow button pressed for:', user.id, user.username);
                onFollowPress(user.id);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.followButtonText}>Follow</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  }
);

SuggestionsCard.displayName = "SuggestionsCard";

export default SuggestionsCard;

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.backgroundWhite,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 0.5,
    borderColor: COLORS.borderLight,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  seeAllText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.blue,
  },
  userItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.md,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.borderLight,
  },
  firstUserItem: {
    borderTopWidth: 0,
  },
  userLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: SIZES.avatar.lg,
    height: SIZES.avatar.lg,
    borderRadius: RADIUS.circle,
    marginRight: SPACING.md,
  },
  userInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  username: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  reason: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  followButton: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.textPrimary,
    borderRadius: RADIUS.round,
  },
  followButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textWhite,
  },
});
