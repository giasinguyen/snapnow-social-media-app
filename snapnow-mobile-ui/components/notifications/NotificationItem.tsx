import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Notification } from '../../types';

interface NotificationItemProps {
  notification: Notification;
  onPress?: () => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onPress }) => {
  const router = useRouter();

  const getIcon = () => {
    switch (notification.type) {
      case 'like':
        return <Ionicons name="heart" size={20} color="#ed4956" />;
      case 'comment':
        return <Ionicons name="chatbubble" size={20} color="#0095f6" />;
      case 'follow':
        return <Ionicons name="person-add" size={20} color="#0095f6" />;
      default:
        return null;
    }
  };

  const handlePress = () => {
    onPress?.();
    
    if (notification.type === 'follow') {
      router.push(`/user/${notification.fromUserId}`);
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
      style={[styles.container, !notification.isRead && styles.unread]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.leftContent}>
        {renderAvatar()}
        <View style={styles.textContainer}>
          <Text style={styles.message} numberOfLines={3}>
            <Text style={styles.username}>{notification.fromUsername}</Text>
            <Text style={styles.messageText}> {notification.message.replace(notification.fromUsername, '')}</Text>
          </Text>
          <Text style={styles.time}>{formatTime(notification.createdAt)}</Text>
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
    backgroundColor: '#FFFFFF',
  },
  unread: {
    backgroundColor: '#F0F8FF',
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
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    backgroundColor: '#DBDBDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  iconBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
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
    fontSize: 14,
    lineHeight: 18,
    color: '#262626',
  },
  username: {
    fontWeight: '600',
    color: '#262626',
  },
  messageText: {
    fontWeight: '400',
    color: '#262626',
  },
  time: {
    fontSize: 12,
    color: '#8E8E8E',
    marginTop: 4,
  },
  postImage: {
    width: 44,
    height: 44,
    borderRadius: 4,
  },
});
