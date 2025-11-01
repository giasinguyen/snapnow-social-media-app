import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    Modal,
    PanResponder,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getFollowers, getFollowing, unfollowUser } from '../../../services/follow';
import { UserService } from '../../../services/user';
import { User } from '../../../types';

export default function UserFollowScreen() {
  const { type, userId } = useLocalSearchParams<{ type: 'followers' | 'following'; userId?: string }>();
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(type || 'followers');
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [filteredFollowers, setFilteredFollowers] = useState<User[]>([]);
  const [filteredFollowing, setFilteredFollowing] = useState<User[]>([]);
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const { width: screenWidth } = Dimensions.get('window');
  const router = useRouter();

  // Pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (Math.abs(gestureState.dx) > 50) {
          if (gestureState.dx > 0) {
            // Swipe right - go to followers
            if (activeTab === 'following') {
              handleTabChange('followers');
            }
          } else {
            // Swipe left - go to following
            if (activeTab === 'followers') {
              handleTabChange('following');
            }
          }
        }
      },
    })
  ).current;

  useEffect(() => {
    if (type) {
      setActiveTab(type);
    }
  }, [type]);

  useEffect(() => {
    // Close dropdown when tab changes
    setShowDropdown(null);
  }, [activeTab]);

  useEffect(() => {
    loadUserData();
  }, [userId, type]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Use provided userId or get current user
      let userIdToUse = userId;
      if (!userIdToUse) {
        const { AuthService } = await import('../../../services/authService');
        const currentUser = await AuthService.getCurrentUserProfile();
        userIdToUse = currentUser?.id || '';
      }
      setTargetUserId(userIdToUse);
      
      if (!userIdToUse) {
        console.log('❌ No user ID available');
        setLoading(false);
        return;
      }

      // Load target user information if it's not the current user
      if (userId) {
        try {
          const user = await UserService.getUserProfile(userIdToUse);
          setTargetUser(user);
        } catch (error) {
          console.error('Error loading target user:', error);
        }
      }

      // Load both followers and following
      const [followerIds, followingIds] = await Promise.all([
        getFollowers(userIdToUse),
        getFollowing(userIdToUse)
      ]);

      // Get user details for followers
      const followerUsers = await Promise.all(
        followerIds.map(async (followerId) => {
          try {
            const user = await UserService.getUserProfile(followerId);
            return user ? {
              id: user.id || followerId,
              username: user.username || 'Unknown',
              displayName: user.displayName || user.username || 'Unknown User',
              profileImage: user.profileImage,
            } : null;
          } catch (error) {
            console.error('Error fetching follower user:', error);
            return null;
          }
        })
      );

      // Get user details for following
      const followingUsers = await Promise.all(
        followingIds.map(async (followingId) => {
          try {
            const user = await UserService.getUserProfile(followingId);
            return user ? {
              id: user.id || followingId,
              username: user.username || 'Unknown',
              displayName: user.displayName || user.username || 'Unknown User',
              profileImage: user.profileImage,
            } : null;
          } catch (error) {
            console.error('Error fetching following user:', error);
            return null;
          }
        })
      );

      setFollowers(followerUsers.filter(user => user !== null) as User[]);
      setFollowing(followingUsers.filter(user => user !== null) as User[]);
      setFilteredFollowers(followerUsers.filter(user => user !== null) as User[]);
      setFilteredFollowing(followingUsers.filter(user => user !== null) as User[]);
      
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const lowerQuery = query.toLowerCase();
    
    const filteredFollowersResult = followers.filter(user => 
      user.username.toLowerCase().includes(lowerQuery) ||
      user.displayName?.toLowerCase().includes(lowerQuery)
    );
    
    const filteredFollowingResult = following.filter(user => 
      user.username.toLowerCase().includes(lowerQuery) ||
      user.displayName?.toLowerCase().includes(lowerQuery)
    );
    
    setFilteredFollowers(filteredFollowersResult);
    setFilteredFollowing(filteredFollowingResult);
  };

  const handleUserPress = (userId: string) => {
    router.push(`/user/${userId}` as any);
  };

  const handleRemoveFollower = async (userId: string, username: string) => {
    Alert.alert(
      'Remove Follower',
      `Remove ${username} from your followers?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Implement remove follower logic in backend
              // For now, just remove from local state
              console.log('Remove follower:', userId);
              const updatedFollowers = followers.filter(user => user.id !== userId);
              const updatedFilteredFollowers = filteredFollowers.filter(user => user.id !== userId);
              setFollowers(updatedFollowers);
              setFilteredFollowers(updatedFilteredFollowers);
            } catch (error) {
              console.error('Error removing follower:', error);
              Alert.alert('Error', 'Failed to remove follower');
            }
          }
        }
      ]
    );
  };

  const handleUnfollow = async (userId: string, username: string) => {
    Alert.alert(
      'Unfollow',
      `Unfollow ${username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Unfollow', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Get current user
              const { AuthService } = await import('../../../services/authService');
              const currentUser = await AuthService.getCurrentUserProfile();
              if (!currentUser?.id) return;

              // Unfollow the user
              await unfollowUser(currentUser.id, userId);
              
              // Remove from local state
              const updatedFollowing = following.filter(user => user.id !== userId);
              const updatedFilteredFollowing = filteredFollowing.filter(user => user.id !== userId);
              setFollowing(updatedFollowing);
              setFilteredFollowing(updatedFilteredFollowing);
              setShowDropdown(null);
            } catch (error) {
              console.error('Error unfollowing user:', error);
              Alert.alert('Error', 'Failed to unfollow user');
            }
          }
        }
      ]
    );
  };

  const handleMute = async (userId: string, username: string) => {
    Alert.alert(
      'Mute',
      `Mute ${username}? You won't see their posts in your feed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Mute', 
          onPress: async () => {
            try {
              // TODO: Implement mute logic in backend
              console.log('Mute user:', userId);
              setShowDropdown(null);
              // For now, just show a success message
              Alert.alert('Muted', `You have muted ${username}`);
            } catch (error) {
              console.error('Error muting user:', error);
              Alert.alert('Error', 'Failed to mute user');
            }
          }
        }
      ]
    );
  };

  const handleSwipeToChangeTab = (direction: 'left' | 'right') => {
    if (direction === 'left' && activeTab === 'followers') {
      setActiveTab('following');
    } else if (direction === 'right' && activeTab === 'following') {
      setActiveTab('followers');
    }
  };

  const handleTabChange = (newTab: 'followers' | 'following') => {
    setActiveTab(newTab);
    
    // Update the URL to reflect the current tab
    const newPath = `/user/follow/${newTab}${userId ? `?userId=${userId}` : ''}`;
    router.replace(newPath as any);
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <View style={styles.userItem}>
      <TouchableOpacity 
        style={styles.userTouchable} 
        onPress={() => handleUserPress(item.id)}
      >
        {item.profileImage ? (
          <Image source={{ uri: item.profileImage }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>
              {item.displayName?.charAt(0).toUpperCase() || item.username?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
        )}
        <View style={styles.userInfo}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.displayName}>{item.displayName || item.username}</Text>
        </View>
      </TouchableOpacity>
      
      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Message</Text>
        </TouchableOpacity>
        
        {activeTab === 'followers' ? (
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => handleRemoveFollower(item.id, item.username)}
          >
            <Ionicons name="close" size={20} color="#8E8E8E" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.moreButton}
            onPress={() => setShowDropdown(showDropdown === item.id ? null : item.id)}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#8E8E8E" />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Dropdown Menu for Following Tab */}
      {activeTab === 'following' && showDropdown === item.id && (
        <View style={styles.dropdown}>
          <TouchableOpacity 
            style={styles.dropdownItem}
            onPress={() => handleUnfollow(item.id, item.username)}
          >
            <Text style={styles.dropdownTextRed}>Unfollow</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.dropdownItem}
            onPress={() => handleMute(item.id, item.username)}
          >
            <Text style={styles.dropdownText}>Mute</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons 
        name={activeTab === 'followers' ? 'people-outline' : 'person-add-outline'} 
        size={64} 
        color="#DBDBDB" 
      />
      <Text style={styles.emptyTitle}>
        {activeTab === 'followers' ? 'No Followers Yet' : 'Not Following Anyone'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'followers' 
          ? 'When people follow this account, they\'ll appear here.'
          : 'When this account follows people, they\'ll appear here.'
        }
      </Text>
    </View>
  );

  const currentList = activeTab === 'followers' ? filteredFollowers : filteredFollowing;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {targetUser ? targetUser.username : 'Your Profile'}
        </Text>
        
        <View style={styles.headerSpacer} />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'followers' && styles.activeTab
          ]}
          onPress={() => handleTabChange('followers')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'followers' && styles.activeTabText
          ]}>
            {followers.length} followers
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'following' && styles.activeTab
          ]}
          onPress={() => handleTabChange('following')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'following' && styles.activeTabText
          ]}>
            {following.length} following
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={16} color="#8E8E8E" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#8E8E8E"
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
      </View>

      {/* Content */}
      <View style={styles.contentContainer} {...panResponder.panHandlers}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0095F6" />
          </View>
        ) : (
          <FlatList
            data={currentList}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={currentList.length === 0 ? styles.emptyContainer : styles.listContainer}
            ListEmptyComponent={renderEmptyState}
          />
        )}
      </View>
      
      {/* Modal backdrop to close dropdown */}
      {showDropdown && (
        <Modal
          transparent={true}
          visible={true}
          onRequestClose={() => setShowDropdown(null)}
        >
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1}
            onPress={() => setShowDropdown(null)}
          />
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  headerSpacer: {
    width: 32,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#DBDBDB',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#000000',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#8E8E8E',
  },
  activeTabText: {
    color: '#000000',
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#000000',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  listContainer: {
    backgroundColor: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  userTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E8E',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  displayName: {
    fontSize: 14,
    color: '#8E8E8E',
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#EFEFEF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  deleteButton: {
    padding: 8,
  },
  moreButton: {
    padding: 8,
  },
  dropdown: {
    position: 'absolute',
    right: 16,
    top: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
    minWidth: 120,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownText: {
    fontSize: 14,
    color: '#000000',
  },
  dropdownTextRed: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E8E',
    textAlign: 'center',
    lineHeight: 20,
  },
});