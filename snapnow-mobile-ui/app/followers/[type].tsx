import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthService, UserProfile } from '../../services/authService';

interface User {
  id: string;
  username: string;
  displayName: string;
  profileImage?: string;
  isFollowing?: boolean;
  isFollowedBy?: boolean;
}

export default function FollowersFollowingScreen() {
  const { type } = useLocalSearchParams<{ type: 'followers' | 'following' }>();
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(type || 'followers');
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (type) {
      setActiveTab(type);
    }
  }, [type]);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const user = await AuthService.getCurrentUserProfile();
      setCurrentUser(user);
      
      // TODO: Load real followers and following data from Firestore
      // For now, we'll use empty arrays since we don't have followers/following implemented yet
      setFollowers([]);
      setFollowing([]);
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (type) {
      setActiveTab(type);
    }
  }, [type]);

  const handleFollow = (userId: string) => {
    if (activeTab === 'following') {
      setFollowing(prev => 
        prev.map(user => 
          user.id === userId 
            ? { ...user, isFollowing: !user.isFollowing }
            : user
        )
      );
    }
  };

  const handleMessage = (user: User) => {
    // TODO: Implement messaging functionality
    console.log('Open message with:', user.username);
  };

  const handleUserPress = (userId: string) => {
    router.push(`/user/${userId}` as any);
  };

  const currentData = activeTab === 'followers' ? followers : following;
  const followersCount = followers.length;
  const followingCount = following.length;

  const renderUserItem = ({ item }: { item: User }) => (
    <View style={styles.userItem}>
      <TouchableOpacity 
        style={styles.userInfo}
        onPress={() => handleUserPress(item.id)}
      >
        <Image
          source={item.profileImage ? { uri: item.profileImage } : require('../../assets/images/default-avatar.jpg')}
          style={styles.avatar}
        />
        <View style={styles.userDetails}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.displayName}>{item.displayName}</Text>
        </View>
      </TouchableOpacity>
      
      <View style={styles.actionButtons}>
        {activeTab === 'following' && !item.isFollowing ? (
          <TouchableOpacity 
            style={styles.followBackButton}
            onPress={() => handleFollow(item.id)}
          >
            <Text style={styles.followBackText}>Follow back</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.messageButton}
            onPress={() => handleMessage(item)}
          >
            <Text style={styles.messageText}>Message</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.closeButton}>
          <Ionicons name="close" size={20} color="#8E8E8E" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#262626" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{currentUser?.username || 'Profile'}</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0095F6" />
        </View>
      ) : (
        <>
          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'followers' && styles.activeTab]}
              onPress={() => setActiveTab('followers')}
            >
              <Text style={[styles.tabText, activeTab === 'followers' && styles.activeTabText]}>
                {followersCount} followers
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'following' && styles.activeTab]}
              onPress={() => setActiveTab('following')}
            >
              <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>
                {followingCount} following
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#8E8E8E" style={styles.searchIcon} />
              <Text style={styles.searchPlaceholder}>Search</Text>
            </View>
          </View>

          {/* Users List */}
          {currentData.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons 
                name={activeTab === 'followers' ? 'people-outline' : 'person-add-outline'} 
                size={64} 
                color="#DBDBDB" 
              />
              <Text style={styles.emptyTitle}>
                No {activeTab === 'followers' ? 'followers' : 'following'} yet
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'followers' 
                  ? 'When people follow you, they\'ll appear here.' 
                  : 'When you follow people, they\'ll appear here.'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={currentData}
              keyExtractor={(item) => item.id}
              renderItem={renderUserItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#DBDBDB',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#262626',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#DBDBDB',
    backgroundColor: '#fff',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#262626',
  },
  tabText: {
    fontSize: 16,
    color: '#8E8E8E',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#262626',
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F6F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchPlaceholder: {
    color: '#8E8E8E',
    fontSize: 16,
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  userInfo: {
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
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#262626',
    marginBottom: 2,
  },
  displayName: {
    fontSize: 14,
    color: '#8E8E8E',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageButton: {
    backgroundColor: '#262626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  messageText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  followBackButton: {
    backgroundColor: '#0095F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  followBackText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#262626',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E8E',
    textAlign: 'center',
    lineHeight: 20,
  },
});