import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { router } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import CreateGroupChatModal from '../../components/CreateGroupChatModal';
import { auth, db } from '../../config/firebase';
import {
  archiveConversation,
  Conversation,
  getNickname,
  getOtherParticipant,
  subscribeToConversations,
  unarchiveConversation,
} from '../../services/conversations';

export default function MessagesScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [userInfoMap, setUserInfoMap] = useState<Map<string, { displayName: string; username: string; photoURL: string }>>(new Map());
  const userSubscriptions = useRef<Map<string, () => void>>(new Map());

  const currentUserId = auth.currentUser?.uid || '';

  // Filter conversations based on search and archive status
  const filteredConversations = useMemo(() => {
    let filtered = conversations;
    
    // Filter by archive status
    if (showArchived) {
      filtered = filtered.filter((conv) => conv.archivedBy?.includes(currentUserId));
    } else {
      filtered = filtered.filter((conv) => !conv.archivedBy?.includes(currentUserId));
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((conv) => {
        // For group chat, search by group name
        if (conv.isGroupChat) {
          return (
            conv.groupName?.toLowerCase().includes(query) ||
            conv.lastMessage?.text?.toLowerCase().includes(query)
          );
        }
        
        // For 1-1 chat, search by other user's name
        const otherUser = getOtherParticipant(conv, currentUserId);
        if (!otherUser) return false;
        
        return (
          otherUser.displayName?.toLowerCase().includes(query) ||
          otherUser.username?.toLowerCase().includes(query) ||
          conv.lastMessage?.text?.toLowerCase().includes(query)
        );
      });
    }
    
    return filtered;
  }, [conversations, searchQuery, currentUserId, showArchived]);

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

  // Subscribe to real-time user profile updates for all conversation participants
  useEffect(() => {
    if (conversations.length === 0) return;

    // Get unique user IDs from all conversations (excluding current user)
    const userIds = new Set<string>();
    conversations.forEach(conv => {
      if (conv.isGroupChat) {
        // For group chats, we don't need individual user updates as we show group info
        return;
      }
      // For 1-1 chats, get the other participant
      const otherUser = getOtherParticipant(conv, currentUserId);
      if (otherUser) {
        userIds.add(otherUser.id);
      }
    });

    // Subscribe to new users only
    userIds.forEach(userId => {
      // Skip if already subscribed
      if (userSubscriptions.current.has(userId)) return;
      
      const userDocRef = doc(db, 'users', userId);
      const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setUserInfoMap(prev => {
            const newMap = new Map(prev);
            newMap.set(userId, {
              displayName: userData.displayName || 'Unknown User',
              username: userData.username || 'unknown',
              photoURL: userData.profileImage || userData.photoURL || 'https://via.placeholder.com/50',
            });
            return newMap;
          });
        }
      }, (error) => {
        console.error('Error subscribing to conversation user profile:', userId, error);
      });
      
      userSubscriptions.current.set(userId, unsubscribe);
    });

    // Cleanup on unmount
    return () => {
      userSubscriptions.current.forEach(unsub => unsub());
      userSubscriptions.current.clear();
    };
  }, [conversations, currentUserId]);

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
    if (conversation.isGroupChat) {
      // Group chat - only pass conversationId
      router.push({
        pathname: '/messages/[conversationId]' as any,
        params: {
          conversationId: conversation.id,
        },
      });
    } else {
      // 1-1 chat - pass other user info
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
    }
  };

  const handleArchiveConversation = async (conversationId: string) => {
    try {
      await archiveConversation(conversationId, currentUserId);
      Alert.alert('Success', 'Conversation archived');
    } catch (error: any) {
      console.error('Error archiving conversation:', error);
      Alert.alert('Error', error.message || 'Failed to archive conversation');
    }
  };

  const handleUnarchiveConversation = async (conversationId: string) => {
    try {
      await unarchiveConversation(conversationId, currentUserId);
      Alert.alert('Success', 'Conversation unarchived');
    } catch (error: any) {
      console.error('Error unarchiving conversation:', error);
      Alert.alert('Error', error.message || 'Failed to unarchive conversation');
    }
  };

  const showConversationOptions = (conversation: Conversation) => {
    const isArchived = conversation.archivedBy?.includes(currentUserId);
    const otherUser = getOtherParticipant(conversation, currentUserId);
    
    Alert.alert(
      otherUser?.displayName || 'Options',
      'Choose an action',
      [
        {
          text: isArchived ? 'Unarchive' : 'Archive',
          onPress: () => {
            if (isArchived) {
              handleUnarchiveConversation(conversation.id);
            } else {
              handleArchiveConversation(conversation.id);
            }
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    const unreadCount = item.unreadCount[currentUserId] || 0;
    const isUnread = unreadCount > 0;
    
    // Get display name and avatar based on chat type
    let displayName = 'Unknown';
    let avatarUri = 'https://via.placeholder.com/50';
    
    if (item.isGroupChat) {
      // Group chat: use group name and photo
      displayName = item.groupName || 'Group Chat';
      avatarUri = item.groupPhoto || 'https://via.placeholder.com/50?text=Group';
    } else {
      // 1-1 chat: use other participant's info with real-time updates
      const otherUser = getOtherParticipant(item, currentUserId);
      if (!otherUser) return null;
      
      // Check for nickname first, then use real-time info, otherwise use stored data
      const savedNickname = getNickname(item, currentUserId, otherUser.id);
      const realtimeInfo = userInfoMap.get(otherUser.id);
      displayName = savedNickname || realtimeInfo?.displayName || otherUser.displayName || otherUser.username || 'Unknown User';
      avatarUri = realtimeInfo?.photoURL || otherUser.photoURL || 'https://via.placeholder.com/50';
    }
    
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
        onLongPress={() => showConversationOptions(item)}
        style={styles.conversationItem}
        activeOpacity={0.7}
      >
        {/* Avatar with online indicator */}
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: avatarUri }}
            style={styles.avatar}
          />
          {item.isGroupChat && (
            <View style={styles.groupBadge}>
              <Ionicons name="people" size={12} color="#fff" />
            </View>
          )}
        </View>

        {/* Message Info */}
        <View style={styles.messageInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.username, isUnread && styles.usernameUnread]} numberOfLines={1}>
              {displayName}
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
          <ActivityIndicator size="large" color="#fc8727ff" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Archive Toggle */}
      <View style={styles.header}>
        {/* Archive Toggle */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            onPress={() => setShowArchived(false)}
            style={[styles.tab, !showArchived && styles.activeTab]}
          >
            <Text style={[styles.tabText, !showArchived && styles.activeTabText]}>
              Messages
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowArchived(true)}
            style={[styles.tab, showArchived && styles.activeTab]}
          >
            <Text style={[styles.tabText, showArchived && styles.activeTabText]}>
              Archived
            </Text>
          </TouchableOpacity>
        </View>

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

      {/* AI Chat Option - Always at top */}
      {!showArchived && (
        <TouchableOpacity
          onPress={() => router.push('/messages/ai-chat')}
          style={[styles.conversationItem, styles.aiChatItem]}
          activeOpacity={0.7}
        >
          <View style={styles.avatarContainer}>
            <View style={styles.aiAvatar}>
              <Ionicons name="sparkles" size={24} color="#fff" />
            </View>
          </View>
          <View style={styles.messageInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.username, styles.aiChatUsername]}>
                SnapNow AI
              </Text>
              <View style={styles.aiBadge}>
                <Text style={styles.aiBadgeText}>AI</Text>
              </View>
            </View>
            <Text style={styles.lastMessage} numberOfLines={1}>
              Hỏi tôi bất cứ điều gì về chụp ảnh, caption, ý tưởng... ✨
            </Text>
          </View>
        </TouchableOpacity>
      )}

      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversationItem}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#fc8727ff"
          />
        }
        contentContainerStyle={filteredConversations.length === 0 ? styles.emptyListContent : undefined}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button - Create Group */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowCreateGroup(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="people" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Create Group Modal */}
      <CreateGroupChatModal
        visible={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onGroupCreated={(groupId) => {
          console.log('Group created:', groupId);
          // Automatically navigate to the new group
          router.push({
            pathname: '/messages/[conversationId]' as any,
            params: {
              conversationId: groupId,
            },
          });
        }}
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
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#ffffff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#000000',
    fontWeight: '600',
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
  groupBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3b82f6',
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
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
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  // AI Chat Styles
  aiChatItem: {
    backgroundColor: '#f8fafc',
    borderBottomColor: '#e2e8f0',
    borderBottomWidth: 2,
  },
  aiAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fc8727ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiChatUsername: {
    fontWeight: '700',
    color: '#1e293b',
  },
  aiBadge: {
    backgroundColor: '#fc8727ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  aiBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});
