import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../../config/firebase';
import { subscribeToConversations, Conversation, getOtherParticipant } from '../../services/conversations';
import { formatDistanceToNow } from 'date-fns';

export default function MessagesScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const currentUserId = auth.currentUser?.uid || '';

  useEffect(() => {
    if (!currentUserId) return;

    // Subscribe to realtime conversations
    const unsubscribe = subscribeToConversations(
      currentUserId,
      (updatedConversations) => {
        setConversations(updatedConversations);
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.error('Error loading conversations:', error);
        setLoading(false);
        setRefreshing(false);
      }
    );

    return () => unsubscribe();
  }, [currentUserId]);

  const handleRefresh = () => {
    setRefreshing(true);
    // Realtime listener will automatically update
  };

  const handleConversationPress = (conversation: Conversation) => {
    const otherUser = getOtherParticipant(conversation, currentUserId);
    if (!otherUser) return;

    router.push({
      pathname: '/messages/[conversationId]' as any,
      params: {
        conversationId: conversation.id,
        otherUserId: otherUser.id,
        otherUserName: otherUser.displayName,
        otherUserPhoto: otherUser.photoURL,
        otherUserUsername: otherUser.username,
      },
    });
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    const otherUser = getOtherParticipant(item, currentUserId);
    if (!otherUser) return null;

    const unreadCount = item.unreadCount[currentUserId] || 0;
    const isUnread = unreadCount > 0;
    
    // Get last message text
    const lastMessageText = typeof item.lastMessage === 'string' 
      ? item.lastMessage 
      : item.lastMessage?.text || 'Sent an image';
    
    // Format timestamp
    let timeText = '';
    if (item.updatedAt) {
      try {
        const date = item.updatedAt.toDate ? item.updatedAt.toDate() : new Date();
        timeText = formatDistanceToNow(date, { addSuffix: false });
      } catch (error) {
        timeText = '';
      }
    }

    return (
      <TouchableOpacity
        onPress={() => handleConversationPress(item)}
        style={styles.conversationItem}
        activeOpacity={0.7}
      >
        {/* Avatar with online indicator */}
        <View style={styles.avatarContainer}>
          <Image
            source={{
              uri: otherUser.photoURL || 'https://via.placeholder.com/50',
            }}
            style={styles.avatar}
          />
          {/* Optional: Online indicator dot */}
          {/* <View style={styles.onlineIndicator} /> */}
        </View>

        {/* Message Info */}
        <View style={styles.messageInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.username, isUnread && styles.usernameUnread]} numberOfLines={1}>
              {otherUser.displayName || otherUser.username || 'Unknown User'}
            </Text>
            {timeText && (
              <Text style={styles.timestamp}>{timeText}</Text>
            )}
          </View>

          <View style={styles.messageRow}>
            <Text
              style={[styles.lastMessage, isUnread && styles.lastMessageUnread]}
              numberOfLines={2}
            >
              {lastMessageText || 'No messages yet'}
            </Text>
            {isUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={80} color="#d1d5db" />
      <Text style={styles.emptyTitle}>No Messages Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start a conversation by visiting someone&apos;s profile
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Messages</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity style={styles.newMessageButton}>
          <Ionicons name="create-outline" size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {/* Conversations List */}
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversationItem}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#3b82f6"
          />
        }
        contentContainerStyle={conversations.length === 0 ? styles.emptyListContent : undefined}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#ffffff',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerRight: {
    width: 40,
  },
  newMessageButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#ffffff',
  },
  avatarContainer: {
    marginRight: 14,
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e5e7eb',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  messageInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  username: {
    fontSize: 16,
    fontWeight: '400',
    color: '#1f2937',
    flex: 1,
    marginRight: 8,
  },
  usernameUnread: {
    fontWeight: '700',
    color: '#000000',
  },
  timestamp: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '400',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
    marginRight: 8,
    lineHeight: 20,
  },
  lastMessageUnread: {
    color: '#1f2937',
    fontWeight: '600',
  },
  unreadBadge: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  unreadCount: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyListContent: {
    flexGrow: 1,
  },
});
