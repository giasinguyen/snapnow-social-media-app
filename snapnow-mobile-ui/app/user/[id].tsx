import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Modal,
    RefreshControl,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatFollowers } from '../../services/mockData';
import { fetchUserPosts } from '../../services/posts';
import { UserService } from '../../services/user';
import { Post, User } from '../../types';

const { width } = Dimensions.get('window');
const POST_SIZE = (width - 2) / 3; // 2px total gap, 1px between each

type TabType = 'grid' | 'snaps' | 'albums' | 'tagged';

const ACHIEVEMENTS = [
  { id: '1', icon: 'camera', label: '100 Snaps', color: '#0095F6' },
  { id: '2', icon: 'flash', label: 'Daily Snapper', color: '#FF6B6B' },
  { id: '3', icon: 'trophy', label: 'Top Creator', color: '#FFD93D' },
];

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('grid');
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const router = useRouter();

  const loadUserProfile = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const userData = await UserService.getUserProfile(id);
      setUser(userData);
      
      // Load user's posts
      if (userData?.id) {
        setLoadingPosts(true);
        const posts = await fetchUserPosts(userData.id);
        setUserPosts(posts);
        setLoadingPosts(false);
      }
      
      // TODO: Check if current user is following this user
      setIsFollowing(false);
    } catch (err) {
      console.error('Failed to load user profile', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserProfile();
  }, [id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserProfile();
    setRefreshing(false);
  };

  const handleFollow = () => {
    // TODO: Implement follow/unfollow functionality
    setIsFollowing(!isFollowing);
  };

  const handleMessage = () => {
    // TODO: Implement messaging functionality
    console.log('Open message screen');
  };

  const handleOptionsMenu = () => {
    setShowOptionsMenu(true);
  };

  const handleBlock = () => {
    setShowOptionsMenu(false);
    Alert.alert(
      'Block User',
      `Are you sure you want to block @${user?.username}? They won't be able to find your profile, posts or story on SnapNow. SnapNow won't let them know you blocked them.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Block', 
          style: 'destructive',
          onPress: () => {
            // TODO: Implement block functionality
            console.log('Block user:', user?.id);
            Alert.alert('User Blocked', `You have blocked @${user?.username}`);
          }
        }
      ]
    );
  };

  const handleReport = () => {
    setShowOptionsMenu(false);
    Alert.alert(
      'Report User',
      'Why are you reporting this account?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Spam', onPress: () => submitReport('spam') },
        { text: 'Inappropriate Content', onPress: () => submitReport('inappropriate') },
        { text: 'Harassment', onPress: () => submitReport('harassment') },
        { text: 'Other', onPress: () => submitReport('other') }
      ]
    );
  };

  const submitReport = (reason: string) => {
    // TODO: Implement report functionality
    console.log('Report user:', user?.id, 'Reason:', reason);
    Alert.alert('Report Submitted', 'Thank you for your report. We\'ll review this account and take appropriate action.');
  };

  const handleCopyProfileUrl = async () => {
    setShowOptionsMenu(false);
    const profileUrl = `https://snapnow.app/user/${user?.id}`;
    
    try {
      await Clipboard.setStringAsync(profileUrl);
      Alert.alert('Copied to clipboard', 'Profile URL has been copied to your clipboard.');
    } catch (error) {
      console.error('Error copying profile URL:', error);
      Alert.alert('Error', 'Failed to copy profile URL to clipboard.');
    }
  };

  const handleShare = () => {
    setShowOptionsMenu(false);
    const shareContent = {
      title: `Check out @${user?.username} on SnapNow`,
      message: `Check out @${user?.username}'s profile on SnapNow: https://snapnow.app/user/${user?.id}`,
      url: `https://snapnow.app/user/${user?.id}`,
    };

    Share.share(shareContent)
      .then((result) => {
        if (result.action === Share.sharedAction) {
          console.log('Profile shared successfully');
        }
      })
      .catch((error) => {
        console.error('Error sharing profile:', error);
      });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#262626" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0095F6" />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#262626" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.center}>
          <Ionicons name="person-circle-outline" size={80} color="#DBDBDB" />
          <Text style={styles.placeholderText}>User not found</Text>
          <Text style={styles.subText}>This user may no longer exist.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#262626" />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {(user as any)?.isPrivate ? (
            <Ionicons name="lock-closed-outline" size={16} color="#8E8E8E" style={{ marginRight: 6 }} />
          ) : null}
          <Text style={styles.headerTitle}>{user.username}</Text>
        </View>
        <TouchableOpacity style={styles.moreButton} onPress={handleOptionsMenu}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#262626" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Header Section */}
        <View style={styles.profileHeader}>
          {/* Large Centered Avatar */}
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#0095F6', '#E91E63', '#9C27B0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarGradient}
            >
              <View style={styles.avatarInner}>
                <Image
                  source={
                    user.profileImage 
                      ? { uri: user.profileImage } 
                      : { uri: 'https://i.pravatar.cc/150?img=1' }
                  }
                  style={styles.avatar}
                />
              </View>
            </LinearGradient>
          </View>

          {/* Name and Bio */}
          <View style={styles.nameSection}>
            <Text style={styles.displayName}>{user.displayName || user.username}</Text>
            {user.bio && <Text style={styles.bio}>{user.bio}</Text>}
            <Text style={styles.bioLink}>snapnow.app/{user.username}</Text>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statNumber}>{userPosts.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Snaps</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statNumber}>{formatFollowers(user.followersCount ?? 1234)}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statNumber}>{user.followingCount ?? 567}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
          </View>

          {/* Achievement Badges */}
          <View style={styles.achievementsSection}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <View style={styles.achievementsList}>
              {ACHIEVEMENTS.map((achievement) => (
                <View key={achievement.id} style={styles.achievementBadge}>
                  <View style={[styles.achievementIcon, { backgroundColor: achievement.color }]}>
                    <Ionicons name={achievement.icon as any} size={16} color="#fff" />
                  </View>
                  <Text style={styles.achievementLabel}>{achievement.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Action Buttons - Follow and Message */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.primaryButton, isFollowing && styles.followingButton]}
              onPress={handleFollow}
            >
              <Text style={[styles.primaryButtonText, isFollowing && styles.followingButtonText]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleMessage}>
              <Text style={styles.secondaryButtonText}>Message</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={20} color="#262626" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'grid' && styles.activeTab]}
            onPress={() => setActiveTab('grid')}
          >
            <Ionicons
              name="grid"
              size={22}
              color={activeTab === 'grid' ? '#262626' : '#8E8E8E'}
            />
            <Text style={[styles.tabText, activeTab === 'grid' && styles.activeTabText]}>
              Grid
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'snaps' && styles.activeTab]}
            onPress={() => setActiveTab('snaps')}
          >
            <Ionicons
              name="flash"
              size={22}
              color={activeTab === 'snaps' ? '#262626' : '#8E8E8E'}
            />
            <Text style={[styles.tabText, activeTab === 'snaps' && styles.activeTabText]}>
              Snaps
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'albums' && styles.activeTab]}
            onPress={() => setActiveTab('albums')}
          >
            <Ionicons
              name="albums"
              size={22}
              color={activeTab === 'albums' ? '#262626' : '#8E8E8E'}
            />
            <Text style={[styles.tabText, activeTab === 'albums' && styles.activeTabText]}>
              Albums
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'tagged' && styles.activeTab]}
            onPress={() => setActiveTab('tagged')}
          >
            <Ionicons
              name="person-outline"
              size={22}
              color={activeTab === 'tagged' ? '#262626' : '#8E8E8E'}
            />
            <Text style={[styles.tabText, activeTab === 'tagged' && styles.activeTabText]}>
              Tagged
            </Text>
          </TouchableOpacity>
        </View>

        {/* Grid Tab */}
        {activeTab === 'grid' && (
          <View style={styles.postsGrid}>
            {loadingPosts ? (
              <View style={styles.center}>
                <ActivityIndicator size="large" color="#0095F6" />
              </View>
            ) : userPosts.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="camera-outline" size={64} color="#DBDBDB" />
                </View>
                <Text style={styles.emptyTitle}>No posts yet</Text>
                <Text style={styles.emptySubtitle}>
                  When {user.displayName || user.username} shares photos, they'll appear here.
                </Text>
              </View>
            ) : (
              userPosts.map((post) => (
                <TouchableOpacity
                  key={post.id}
                  style={styles.gridItem}
                  activeOpacity={0.9}
                  onPress={() => router.push(`/post/${post.id}` as any)}
                >
                  <Image source={{ uri: post.imageUrl }} style={styles.gridImage} />
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Other tabs - Empty states */}
        {activeTab !== 'grid' && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons 
                name={
                  activeTab === 'snaps' ? 'flash-outline' :
                  activeTab === 'albums' ? 'albums-outline' : 'person-circle-outline'
                } 
                size={64} 
                color="#DBDBDB" 
              />
            </View>
            <Text style={styles.emptyTitle}>
              {activeTab === 'snaps' ? 'No snaps yet' :
               activeTab === 'albums' ? 'No albums yet' : 'No tagged photos'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'snaps' ? 'Quick snaps will appear here.' :
               activeTab === 'albums' ? 'Photo albums will appear here.' :
               'Photos and videos of this user will appear here.'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Options Menu Modal */}
      <Modal
        visible={showOptionsMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOptionsMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptionsMenu(false)}
        >
          <View style={styles.optionsMenu}>
            <TouchableOpacity style={styles.optionItem} onPress={handleCopyProfileUrl}>
              <Ionicons name="link-outline" size={20} color="#262626" />
              <Text style={styles.optionText}>Copy profile URL</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.optionItem} onPress={handleShare}>
              <Ionicons name="share-outline" size={20} color="#262626" />
              <Text style={styles.optionText}>Share this profile</Text>
            </TouchableOpacity>
            
            <View style={styles.optionDivider} />
            
            <TouchableOpacity style={styles.optionItem} onPress={handleBlock}>
              <Ionicons name="ban-outline" size={20} color="#E53E3E" />
              <Text style={[styles.optionText, styles.dangerText]}>Block</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.optionItem} onPress={handleReport}>
              <Ionicons name="flag-outline" size={20} color="#E53E3E" />
              <Text style={[styles.optionText, styles.dangerText]}>Report</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#262626',
    marginTop: 16,
  },
  subText: {
    fontSize: 14,
    color: '#8E8E8E',
    marginTop: 8,
    textAlign: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#DBDBDB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#262626',
    flex: 1,
    textAlign: 'center',
  },
  moreButton: {
    padding: 4,
  },

  // Profile Header
  profileHeader: {
    backgroundColor: '#fff',
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },

  // Avatar
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  avatarGradient: {
    width: 126,
    height: 126,
    borderRadius: 63,
    padding: 3,
  },
  avatarInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    padding: 3,
  },
  avatar: {
    width: 114,
    height: 114,
    borderRadius: 57,
  },

  // Name Section
  nameSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  displayName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#262626',
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    color: '#262626',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 4,
  },
  bioLink: {
    fontSize: 13,
    color: '#0095F6',
    marginTop: 4,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    marginBottom: 16,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#DBDBDB',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#262626',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E8E',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#EFEFEF',
  },

  // Achievements
  achievementsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E8E',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  achievementsList: {
    flexDirection: 'row',
    gap: 12,
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  achievementIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#262626',
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#0095F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  followingButton: {
    backgroundColor: '#EFEFEF',
  },
  followingButtonText: {
    color: '#262626',
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#EFEFEF',
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
  },
  iconButton: {
    width: 44,
    paddingVertical: 10,
    backgroundColor: '#EFEFEF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#DBDBDB',
    marginTop: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#262626',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E8E',
  },
  activeTabText: {
    color: '#262626',
  },

  // Grid
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#fff',
  },
  gridItem: {
    width: POST_SIZE,
    height: POST_SIZE,
    borderWidth: 0.5,
    borderColor: '#FAFAFA',
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
    backgroundColor: '#fff',
  },
  emptyIconContainer: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#262626',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E8E',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Options Menu Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsMenu: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 40,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  optionText: {
    fontSize: 16,
    color: '#262626',
    marginLeft: 12,
    fontWeight: '400',
  },
  dangerText: {
    color: '#E53E3E',
  },
  optionDivider: {
    height: 1,
    backgroundColor: '#EFEFEF',
    marginVertical: 4,
  },
});