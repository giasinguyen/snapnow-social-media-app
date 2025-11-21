import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Notification } from '../../types';

interface NotificationItemProps {
  notification: Notification;
  onPress?: () => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onPress }) => {
  const { colors } = useTheme();
  const router = useRouter();

  const getIcon = () => {
    switch (notification.type) {
      case 'like':
        return <Ionicons name="heart" size={17} color="#ed4956" />;
      case 'comment':
        return <Ionicons name="chatbubble" size={17} color="#0095f6" />;
      case 'comment_reply':
        return <Ionicons name="arrow-undo" size={17} color="#0095f6" />;
      case 'comment_like':
        return <Ionicons name="heart" size={17} color="#ed4956" />;
      case 'story_reaction':
        return <Ionicons name="happy-outline" size={18} color="#f8780fff" />;
      case 'follow':
        return <Ionicons name="person-add" size={17} color="#0095f6" />;
      case 'mention':
        return <Ionicons name="at" size={17} color="#8e44ad" />;
      case 'follow_request':
        return <Ionicons name="person-add" size={17} color="#f68300ff" />;
      case 'follow_request_accepted':
        return <Ionicons name="checkmark-circle" size={17} color="#34c759" />;
      default:
        return null;
    }
  };

  const handlePress = () => {
    onPress?.();
    
    if (notification.type === 'follow') {
      router.push(`/user/${notification.fromUserId}`);
    } else if (notification.type === 'follow_request') {
      router.push('/user/follow-requests' as any);
    } else if (notification.type === 'follow_request_accepted') {
      router.push(`/user/${notification.fromUserId}`);
    } else if (notification.type === 'story_reaction' && notification.storyId) {
      router.push(`/story/${notification.storyId}` as any);
    } else if (notification.type === 'mention' && notification.postId) {
      router.push(`/post/${notification.postId}` as any);
    } else if (notification.postId) {
      router.push(`/post/${notification.postId}` as any);
    }
  };

  const formatTime = (date: Date) => {
    try {
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return '';
    }
  };

  // Avatar với initials fallback
  const renderAvatar = () => {
    const hasValidImage = notification.fromUserProfileImage && notification.fromUserProfileImage.trim() !== '';
    const initials = notification.fromUsername.slice(0, 2).toUpperCase();

    return (
      <View style={styles.avatarWrapper}>
        {hasValidImage ? (
          <Image
            source={{ uri: notification.fromUserProfileImage }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        )}
        <View style={styles.iconBadge}>{getIcon()}</View>
      </View>
    );
  };

  // Post image preview (nếu có)
  const renderPostImage = () => {
    if (!notification.postImageUrl) return null;

    return (
      <Image
        source={{ uri: notification.postImageUrl }}
        style={styles.postImage}
      />
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: colors.backgroundWhite },
        !notification.isRead && { backgroundColor: colors.backgroundGray }
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.leftContent}>
        {renderAvatar()}
        <View style={styles.textContainer}>
          <Text style={[styles.message, { color: colors.textPrimary }]} numberOfLines={2}>
            <Text style={[styles.username, { color: colors.textPrimary }]}>{notification.fromUsername}</Text>
            <Text style={[styles.messageText, { color: colors.textSecondary }]}> {notification.message}</Text>
          </Text>
          <Text style={[styles.time, { color: colors.textSecondary }]}>{formatTime(notification.createdAt)}</Text>
        </View>
      </View>
      {renderPostImage()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  unread: {
    // Removed - using dynamic colors
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    backgroundColor: '#DBDBDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  iconBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  textContainer: {
    flex: 1,
  },
  message: {
    fontSize: 13,
    lineHeight: 17,
  },
  username: {
    fontWeight: '600',
  },
  messageText: {
    fontWeight: '400',
  },
  time: {
    fontSize: 11,
    marginTop: 3,
  },
  postImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
  },
});
