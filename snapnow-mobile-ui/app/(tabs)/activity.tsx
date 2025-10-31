import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Avatar from '../../components/ui/Avatar';
import { COLORS, SPACING, TYPOGRAPHY } from '../../src/constants/theme';


interface Notification {
  id: string;
  title: string;     
  time: string;      
  avatarUrls: string[];
  imageUrl?: string;
  hasImagePlaceholder?: boolean;
  isThreads?: boolean;
  type: 'recent' | 'older';
}

// ================== Mock data ==================
const mockNotifications: Notification[] = [
  { id: '1', title: 'baohannguyenxhelia, hafthi và 2 người khác đã đăng bài gần đây. 1 tuần', time: '1 tuần', avatarUrls: ['https://i.pravatar.cc/150?img=1'], type: 'recent' },
  { id: '2', title: 'estevaowilian_ vừa chia sẻ một bài viết. 1 tuần', time: '1 tuần', avatarUrls: ['https://i.pravatar.cc/150?img=4'], type: 'recent', imageUrl: 'https://picsum.photos/id/101/200/300' },
  { id: '3', title: 'reece vừa chia sẻ một bài viết. 1 tuần', time: '1 tuần', avatarUrls: ['https://i.pravatar.cc/150?img=5'], type: 'recent', imageUrl: 'https://picsum.photos/id/102/200/300' },
  { id: '4', title: 'natgeo11 đã chia sẻ một ảnh. 2 tuần', time: '2 tuần', avatarUrls: ['https://i.pravatar.cc/150?img=6'], imageUrl: 'https://picsum.photos/id/237/200/300', type: 'recent' },
  { id: '5', title: 'heartz4.xoxo đang mở thread mà bạn có thể sẽ thích. 3 tuần', time: '3 tuần', avatarUrls: ['https://i.pravatar.cc/150?img=7'], hasImagePlaceholder: true, type: 'recent' },
  { id: '6', title: 'banhmithemsaigon gần đây đã chia sẻ một thước phim mới. 4 tuần', time: '4 tuần', avatarUrls: ['https://i.pravatar.cc/150?img=8'], imageUrl: 'https://picsum.photos/id/10/200/300', type: 'recent' },
  { id: '7', title: 'kairoisclerocis_livingwithjoy và 9 người khác đang dùng ứng dụng Threads của Instagram. Xem họ đang b... thêm 4 tuần', time: '4 tuần', avatarUrls: ['https://i.pravatar.cc/150?img=9'], isThreads: true, type: 'older' },
  { id: '8', title: 'kairoisclerocis_livingwithjoy và 9 người khác đang dùng ứng dụng Threads của Instagram. Xem họ đang b... thêm 4 tuần', time: '4 tuần', avatarUrls: ['https://i.pravatar.cc/150?img=10'], isThreads: true, type: 'older' },
  { id: '9', title: 'chelseafc11 đã chia sẻ một ảnh. 5 tuần', time: '5 tuần', avatarUrls: ['https://i.pravatar.cc/150?img=11'], imageUrl: 'https://picsum.photos/id/20/200/300', type: 'older' },
  { id: '10', title: 'sontungmtp, chelseafc và những người khác đã chia sẻ một bài viết. 5 tuần', time: '5 tuần', avatarUrls: ['https://i.pravatar.cc/150?img=12'], imageUrl: 'https://picsum.photos/id/30/200/300', type: 'older' },
];

// ================== Item ==================
type NotificationItemProps = { item: Notification };

const NotificationItem: React.FC<NotificationItemProps> = ({ item }) => {
  const contentWithoutTime = item.title.replace(new RegExp(`\\s*${item.time}\\s*$`), '');

  // Regex bắt đầu cụm hành động; GIỮ space đầu cụm để không dính chữ
  const actionRegex =
    /( đã | vừa | đang | gần đây đã | và \d+ người khác(?: đang| đã)?| và những người khác đã| đã đăng một thread| đã chia sẻ| mở thread)/i;

  let boldText = contentWithoutTime.trim();
  let normalText = '';

  const m = contentWithoutTime.match(actionRegex);
  if (m && m.index !== undefined) {
    const idx = m.index;
    boldText = contentWithoutTime.slice(0, idx).trimEnd();     // tên/nhóm tên
    normalText = contentWithoutTime.slice(idx).replace(/\s+/g, ' '); // cụm hành động (đã có space đầu)
  }

  const renderAvatar = () => (
    <View style={styles.avatarWrapper}>
      <Avatar uri={item.avatarUrls[0]} size="small" showGradient={false} />
      {item.isThreads && (
        <View style={styles.threadsIconContainer}>
          <Ionicons name="logo-medium" size={12} color="#000" />
        </View>
      )}
    </View>
  );

  const renderImage = () => {
    if (item.imageUrl) return <Image source={{ uri: item.imageUrl }} style={styles.postImage} />;
    if (item.hasImagePlaceholder)
      return (
        <View style={[styles.postImage, styles.imagePlaceholder]}>
          <Text style={{ color: '#fff', fontSize: 10 }}>Ảnh</Text>
        </View>
      );
    return null;
  };

  return (
    <TouchableOpacity style={styles.itemContainer} activeOpacity={0.7}>
      <View style={styles.leftContent}>
        {renderAvatar()}
        <View style={styles.textContainer}>
          <Text style={styles.titleText}>
            <Text style={{ fontWeight: '700' }}>{boldText}</Text>
            {normalText ? <Text style={{ fontWeight: '400' }}> {normalText}</Text> : null}
            <Text style={styles.timeText}> · {item.time}</Text>
          </Text>
        </View>
      </View>
      {renderImage()}
    </TouchableOpacity>
  );
};

// ================== Section ==================
const NotificationsSection: React.FC<{ title: string; notifications: Notification[] }> = ({
  title,
  notifications,
}) => {
  if (!notifications.length) return null;
  return (
    <View>
      <Text style={styles.sectionTitle}>{title}</Text>
      {notifications.map((n) => (
        <NotificationItem key={n.id} item={n} />
      ))}
    </View>
  );
};

// ================== Screen ==================
const NotificationsScreen: React.FC = () => {
  const router = useRouter();
  const recent = mockNotifications.filter((n) => n.type === 'recent');
  const older = mockNotifications.filter((n) => n.type === 'older');

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <NotificationsSection title="30 ngày qua" notifications={recent} />
        <NotificationsSection title="Cũ hơn" notifications={older} />
      </ScrollView>
    </View>
  );
};

// ================== Styles ==================
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff', paddingTop: 50 },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.backgroundWhite,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { 
    fontSize: TYPOGRAPHY.fontSize.display, 
    fontWeight: '700', 
    color: '#262626',
    letterSpacing: -0.5,
  },
  contentContainer: { paddingBottom: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 15,
    marginTop: 20,
    marginBottom: 10,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  leftContent: { flexDirection: 'row', flex: 1, alignItems: 'center', marginRight: 10 },
  textContainer: { flex: 1 },
  titleText: { fontSize: 13, lineHeight: 18 },
  timeText: { color: '#8e8e8e', fontWeight: '400' },
  avatarWrapper: { marginRight: 10, position: 'relative' },
  threadsIconContainer: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postImage: { width: 44, height: 44, borderRadius: 4 },
  imagePlaceholder: { backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center' },
});

export default NotificationsScreen;
