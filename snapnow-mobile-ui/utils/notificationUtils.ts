import { Notification } from '../types';

export interface GroupedNotifications {
  today: Notification[];
  thisWeek: Notification[];
  thisMonth: Notification[];
  older: Notification[];
}

export function groupNotificationsByTime(notifications: Notification[]): GroupedNotifications {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const grouped: GroupedNotifications = {
    today: [],
    thisWeek: [],
    thisMonth: [],
    older: [],
  };

  notifications.forEach((notification) => {
    const notifDate = new Date(notification.createdAt);

    if (notifDate >= today) {
      grouped.today.push(notification);
    } else if (notifDate >= weekAgo) {
      grouped.thisWeek.push(notification);
    } else if (notifDate >= monthAgo) {
      grouped.thisMonth.push(notification);
    } else {
      grouped.older.push(notification);
    }
  });

  return grouped;
}

export function getNotificationTitle(type: 'like' | 'comment' | 'follow'): string {
  switch (type) {
    case 'like':
      return 'Liked your post';
    case 'comment':
      return 'Commented on your post';
    case 'follow':
      return 'Started following you';
    default:
      return '';
  }
}
