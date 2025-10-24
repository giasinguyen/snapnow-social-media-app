import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'; // Đã loại bỏ SafeAreaView
import Avatar from '../../components/ui/Avatar';

// --- INTERFACES VÀ MOCK DATA (Giữ nguyên) ---

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

const mockNotifications: Notification[] = [
    {
        id: '1',
        title: 'baohannguyenxhelia, hafthi và 2 người khác đã đăng bài gần đây. 1 tuần',
        time: '1 tuần',
        avatarUrls: ['https://i.pravatar.cc/150?img=1'],
        type: 'recent',
    },
    {
        id: '2',
        title: 'estevaowilian_ vừa chia sẻ một bài viết. 1 tuần',
        time: '1 tuần',
        avatarUrls: ['https://i.pravatar.cc/150?img=4'],
        type: 'recent',
        imageUrl: 'https://picsum.photos/id/101/200/300',
    },
    {
        id: '3',
        title: 'reece vừa chia sẻ một bài viết. 1 tuần',
        time: '1 tuần',
        avatarUrls: ['https://i.pravatar.cc/150?img=5'],
        type: 'recent',
        imageUrl: 'https://picsum.photos/id/102/200/300',
    },
    {
        id: '4',
        title: 'natgeo11 đã chia sẻ một ảnh. 2 tuần',
        time: '2 tuần',
        avatarUrls: ['https://i.pravatar.cc/150?img=6'],
        imageUrl: 'https://picsum.photos/id/237/200/300',
        type: 'recent',
    },
    {
        id: '5',
        title: 'heartz4.xoxo đang mở thread mà bạn có thể sẽ thích. 3 tuần',
        time: '3 tuần',
        avatarUrls: ['https://i.pravatar.cc/150?img=7'],
        hasImagePlaceholder: true,
        type: 'recent',
    },
    {
        id: '6',
        title: 'banhmithemsaigon gần đây đã chia sẻ một thước phim mới. 4 tuần',
        time: '4 tuần',
        avatarUrls: ['https://i.pravatar.cc/150?img=8'],
        imageUrl: 'https://picsum.photos/id/10/200/300',
        type: 'recent',
    },
    {
        id: '7',
        title: 'kairoisclerocis_livingwithjoy và 9 người khác đang dùng ứng dụng Threads của Instagram. Xem họ đang b... thêm 4 tuần',
        time: '4 tuần',
        avatarUrls: ['https://i.pravatar.cc/150?img=9'],
        isThreads: true,
        type: 'older',
    },
    {
        id: '8',
        title: 'kairoisclerocis_livingwithjoy và 9 người khác đang dùng ứng dụng Threads của Instagram. Xem họ đang b... thêm 4 tuần',
        time: '4 tuần',
        avatarUrls: ['https://i.pravatar.cc/150?img=10'],
        isThreads: true,
        type: 'older',
    },
    {
        id: '9',
        title: 'chelseafc11 đã chia sẻ một ảnh. 5 tuần',
        time: '5 tuần',
        avatarUrls: ['https://i.pravatar.cc/150?img=11'],
        imageUrl: 'https://picsum.photos/id/20/200/300',
        type: 'older',
    },
    {
        id: '10',
        title: 'sontungmtp, chelseafc và những người khác đã chia sẻ một bài viết. 5 tuần',
        time: '5 tuần',
        avatarUrls: ['https://i.pravatar.cc/150?img=12'],
        imageUrl: 'https://picsum.photos/id/30/200/300',
        type: 'older',
    },
];


interface NotificationItemProps {
    item: Notification;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ item }) => {
    
    const contentWithoutTime = item.title.replace(item.time, '').trim();

    let boldText = contentWithoutTime;
    let normalText = '';

    const actionRegex = /( đã | vừa | đang | gần đây đã | và \d+ người khác đã | và những người khác đã | đã đăng một thread)/i;
    const match = contentWithoutTime.match(actionRegex);

    if (match && match.index !== undefined) {
        const matchIndex = match.index;
        boldText = contentWithoutTime.substring(0, matchIndex).trim();
        normalText = contentWithoutTime.substring(matchIndex).trim();
    } else {
        boldText = contentWithoutTime;
    }
    
    const isThreads = item.isThreads;

    const renderAvatar = () => {
        return (
            <View style={styles.avatarWrapper}>
                <Avatar 
                    uri={item.avatarUrls[0]} 
                    size="small"
                    showGradient={false} 
                />
                
                {isThreads && (
                    <View style={styles.threadsIconContainer}>
                        <Ionicons name="logo-medium" size={12} color="#000" /> 
                    </View>
                )}
            </View>
        );
    };

    const renderImage = () => {
        if (item.imageUrl) {
            return <Image source={{ uri: item.imageUrl }} style={styles.postImage} />;
        }
        if (item.hasImagePlaceholder) {
            return (
                <View style={[styles.postImage, styles.imagePlaceholder]}>
                    <Text style={{ color: '#fff', fontSize: 10 }}>Ảnh</Text>
                </View>
            );
        }
        return null;
    };

    return (
        <TouchableOpacity style={styles.itemContainer} activeOpacity={0.7}>
            <View style={styles.leftContent}>
                {renderAvatar()}
                <View style={styles.textContainer}>
                    <Text style={styles.titleText}>
                        <Text style={{ fontWeight: '700' }}>{boldText}</Text> 
                        <Text style={{ fontWeight: '400' }}>{normalText}</Text>
                        <Text style={styles.timeText}> {item.time}</Text> 
                    </Text>
                </View>
            </View>
            {renderImage()}
        </TouchableOpacity>
    );
};


interface NotificationsSectionProps {
    title: string;
    notifications: Notification[];
}

const NotificationsSection: React.FC<NotificationsSectionProps> = ({ title, notifications }) => {
    if (notifications.length === 0) {
        return null;
    }

    return (
        <View>
            <Text style={styles.sectionTitle}>{title}</Text>
            {notifications.map(item => (
                <NotificationItem key={item.id} item={item} />
            ))}
        </View>
    );
};

// --- COMPONENT: NotificationsScreen ---

const NotificationsScreen: React.FC = () => {
    const router = useRouter();

    const recentNotifications = mockNotifications.filter(n => n.type === 'recent');
    const olderNotifications = mockNotifications.filter(n => n.type === 'older');

    const handleBack = () => {
        router.back(); 
    };

    return (
        <View style={styles.screen}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Thông báo</Text>
            </View>

            {/* Content */}
            <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
                
                <NotificationsSection 
                    title="30 ngày qua" 
                    notifications={recentNotifications} 
                />
                
                <NotificationsSection 
                    title="Cũ hơn" 
                    notifications={olderNotifications} 
                />
            </ScrollView>
        </View>
    );
};


const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: 50, 
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 12, 
        borderBottomWidth: 0.5,
        borderBottomColor: '#eee',
    },
    backButton: {
        marginRight: 15,
        padding: 5,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    contentContainer: {
        paddingBottom: 20,
    },
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
    leftContent: {
        flexDirection: 'row',
        flex: 1,
        alignItems: 'center',
        marginRight: 10,
    },
    textContainer: {
        flex: 1,
    },
    titleText: {
        fontSize: 13,
        lineHeight: 18,
    },
    timeText: {
        color: '#8e8e8e',
        fontWeight: '400',
    },
    avatarWrapper: {
        marginRight: 10,
        position: 'relative',
    },
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
    postImage: {
        width: 44,
        height: 44,
        borderRadius: 4,
    },
    imagePlaceholder: {
        backgroundColor: '#ccc',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default NotificationsScreen;
