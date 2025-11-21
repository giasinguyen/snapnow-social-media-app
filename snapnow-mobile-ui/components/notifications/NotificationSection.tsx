import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Notification } from '../../types';
import { NotificationItem } from './NotificationItem';

interface NotificationSectionProps {
  title: string;
  notifications: Notification[];
  onNotificationPress?: (notification: Notification) => void;
}

export const NotificationSection: React.FC<NotificationSectionProps> = ({
  title,
  notifications,
  onNotificationPress,
}) => {
  const { colors } = useTheme();
  if (notifications.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onPress={() => onNotificationPress?.(notification)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
