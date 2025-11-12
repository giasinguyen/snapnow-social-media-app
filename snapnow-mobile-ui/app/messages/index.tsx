import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../../config/firebase';
import { subscribeToConversations, Conversation, getOtherParticipant } from '../../services/conversations';
import { formatDistanceToNow } from 'date-fns';

export default function MessagesScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const currentUserId = auth.currentUser?.uid || '';

  // Filter conversations based on search
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    
    const query = searchQuery.toLowerCase();
    return conversations.filter((conv) => {
      const otherUser = getOtherParticipant(conv, currentUserId);
      if (!otherUser) return false;
      
      return (
        otherUser.displayName?.toLowerCase().includes(query) ||
        otherUser.username?.toLowerCase().includes(query) ||
        conv.lastMessage?.text?.toLowerCase().includes(query)
      );
    });
  }, [conversations, searchQuery, currentUserId]);

  useEffect(() => {
    if (!currentUserId) {
      setLoading(false);
      setError('No user logged in');
      return;
    }

    console.log('📱 Messages: Setting up subscription for user:', currentUserId);

    // Subscribe to realtime conversations
    // Note: Notification handling is done globally in app/_layout.tsx
    const unsubscribe = subscribeToConversations(
      currentUserId,
      (updatedConversations) => {
        console.log('✅ Messages: Received', updatedConversations.length, 'conversations');
        
        setConversations(updatedConversations);
        setLoading(false);
        setRefreshing(false);
        setError(null);
      },
      (error) => {
        console.error('❌ Messages: Error loading conversations:', error);
        setError(error.message);
        setLoading(false);
        setRefreshing(false);
      }
    );

    return () => {
      console.log('🔄 Messages: Cleaning up subscription');
      unsubscribe();
    };
  }, [currentUserId]); // Only depend on currentUserId!

  const handleRefresh = () => {
    console.log('🔄 Messages: Manual refresh triggered');
    setRefreshing(true);
    setError(null);
    
    // Real-time listener will automatically trigger update
    // But we also set a timeout as fallback to stop spinning
    setTimeout(() => {
      if (refreshing) {
        console.log('⏱️ Messages: Refresh timeout - stopping spinner');
        setRefreshing(false);
      }
    }, 3000); // 3 second timeout
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
      } catch {
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

  const renderEmptyState = () => {
    if (error) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={80} color="#ef4444" />
          <Text style={styles.emptyTitle}>Error Loading Messages</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
          <TouchableOpacity
            onPress={handleRefresh}
            style={{
              marginTop: 16,
              paddingHorizontal: 24,
              paddingVertical: 12,
              backgroundColor: '#3b82f6',
              borderRadius: 8,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons name="chatbubbles-outline" size={80} color="#d1d5db" />
        <Text style={styles.emptyTitle}>No Messages Yet</Text>
        <Text style={styles.emptySubtitle}>
          Start a conversation by visiting someone&apos;s profile
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar (no title - tab shows "Messages") */}
      <View style={styles.header}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search messages..."
            placeholderTextColor="#9ca3af"
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filteredConversations}
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
        contentContainerStyle={filteredConversations.length === 0 ? styles.emptyListContent : undefined}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    paddingVertical: 4,
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
