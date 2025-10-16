import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { 
  ActivityIndicator, 
  Image, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  ScrollView,
  Dimensions,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthService, UserProfile } from '../../services/authService';
import { MOCK_POSTS, formatFollowers } from '../../services/mockData';

const { width } = Dimensions.get('window');
const POST_SIZE = (width - 2) / 3; // 2px total gap, 1px between each

type TabType = 'grid' | 'snaps' | 'albums' | 'tagged';

const ACHIEVEMENTS = [
  { id: '1', icon: 'camera', label: '100 Snaps', color: '#0095F6' },
  { id: '2', icon: 'flash', label: 'Daily Snapper', color: '#FF6B6B' },
  { id: '3', icon: 'trophy', label: 'Top Creator', color: '#FFD93D' },
];

const MOCK_ALBUMS = [
  { id: '1', title: 'Summer 2024', cover: 'https://picsum.photos/400/400?random=1', count: 24 },
  { id: '2', title: 'Travel', cover: 'https://picsum.photos/400/400?random=2', count: 48 },
  { id: '3', title: 'Food', cover: 'https://picsum.photos/400/400?random=3', count: 36 },
  { id: '4', title: 'Friends', cover: 'https://picsum.photos/400/400?random=4', count: 52 },
];

const MOCK_SNAPS = [
  { id: '1', imageUrl: 'https://picsum.photos/400/400?random=11', time: '2h ago' },
  { id: '2', imageUrl: 'https://picsum.photos/400/400?random=12', time: '5h ago' },
  { id: '3', imageUrl: 'https://picsum.photos/400/400?random=13', time: '8h ago' },
  { id: '4', imageUrl: 'https://picsum.photos/400/400?random=14', time: '12h ago' },
  { id: '5', imageUrl: 'https://picsum.photos/400/400?random=15', time: '1d ago' },
  { id: '6', imageUrl: 'https://picsum.photos/400/400?random=16', time: '2d ago' },
];

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('grid');
  const router = useRouter();

  const loadProfile = async () => {
    try {
      const p = await AuthService.getCurrentUserProfile();
      setProfile(p);
    } catch (err) {
      console.error('Failed to load profile', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  const handleSettings = () => {
    router.push('/(tabs)/settings');
  };

  const handleSnapNow = () => {
    console.log('Open camera for quick snap');
    // TODO: Implement camera
  };

  const handleShare = () => {
    console.log('Share profile');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0095F6" />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Ionicons name="person-circle-outline" size={80} color="#DBDBDB" />
          <Text style={styles.placeholderText}>No profile found</Text>
          <Text style={styles.subText}>Please login or register to see your profile.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Minimalist Threads-style Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="lock-closed-outline" size={18} color="#8E8E8E" />
          <Text style={styles.headerUsername}>{profile.username}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton} onPress={handleSnapNow}>
            <Ionicons name="camera-outline" size={24} color="#262626" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleSettings}>
            <Ionicons name="menu-outline" size={24} color="#262626" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Header Section */}
        <View style={styles.profileHeader}>
          {/* Large Centered Avatar with Camera Overlay - SnapNow Focus */}
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
                    profile.profileImage 
                      ? { uri: profile.profileImage } 
                      : { uri: 'https://i.pravatar.cc/150?img=1' }
                  }
                  style={styles.avatar}
                />
              </View>
            </LinearGradient>
            {/* Camera Icon Overlay - SnapNow Feature */}
            <TouchableOpacity style={styles.cameraOverlay} onPress={handleSnapNow}>
              <Ionicons name="camera" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Name and Bio */}
          <View style={styles.nameSection}>
            <Text style={styles.displayName}>{profile.displayName || profile.username}</Text>
            {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
            <Text style={styles.bioLink}>snapnow.app/{profile.username}</Text>
          </View>

          {/* Horizontal Stats - Threads Style */}
          <View style={styles.statsRow}>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statNumber}>{profile.postsCount ?? MOCK_POSTS.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statNumber}>{MOCK_SNAPS.length}</Text>
              <Text style={styles.statLabel}>Snaps</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statNumber}>{formatFollowers(profile.followersCount ?? 1234)}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statNumber}>{profile.followingCount ?? 567}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
          </View>

          {/* Achievement Badges - SnapNow Unique Feature */}
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

          {/* Action Buttons - Clean Threads Style */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push({ pathname: '/(tabs)/edit-profile' })}
            >
              <Text style={styles.primaryButtonText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleShare}>
              <Text style={styles.secondaryButtonText}>Share Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={handleSnapNow}>
              <Ionicons name="camera" size={20} color="#262626" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs - Border Bottom Style (Threads) */}
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

        {/* Grid Tab - Instagram Style */}
        {activeTab === 'grid' && (
          <View style={styles.postsGrid}>
            {MOCK_POSTS.slice(0, 12).map((post, index) => (
              <TouchableOpacity
                key={post.id}
                style={styles.gridItem}
                activeOpacity={0.9}
              >
                <Image source={{ uri: post.imageUrl }} style={styles.gridImage} />
                {index % 4 === 0 && (
                  <View style={styles.multipleIndicator}>
                    <Ionicons name="copy-outline" size={14} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Snaps Tab - SnapNow Unique Feature */}
        {activeTab === 'snaps' && (
          <View style={styles.snapsContainer}>
            <View style={styles.snapsHeader}>
              <Text style={styles.snapsTitle}>Quick Snaps</Text>
              <Text style={styles.snapsSubtitle}>Your spontaneous moments</Text>
            </View>
            <View style={styles.snapsGrid}>
              {/* Add Snap Button */}
              <TouchableOpacity style={styles.addSnapButton} onPress={handleSnapNow}>
                <View style={styles.addSnapIconContainer}>
                  <Ionicons name="camera" size={32} color="#0095F6" />
                </View>
                <Text style={styles.addSnapText}>Snap Now</Text>
              </TouchableOpacity>

              {/* Existing Snaps */}
              {MOCK_SNAPS.map((snap) => (
                <TouchableOpacity
                  key={snap.id}
                  style={styles.snapItem}
                  activeOpacity={0.9}
                >
                  <Image source={{ uri: snap.imageUrl }} style={styles.snapImage} />
                  <View style={styles.snapOverlay}>
                    <Text style={styles.snapTime}>{snap.time}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Albums Tab - SnapNow Feature */}
        {activeTab === 'albums' && (
          <View style={styles.albumsContainer}>
            <View style={styles.albumsHeader}>
              <Text style={styles.albumsTitle}>Photo Albums</Text>
              <TouchableOpacity>
                <Ionicons name="add-circle-outline" size={28} color="#0095F6" />
              </TouchableOpacity>
            </View>
            <View style={styles.albumsGrid}>
              {MOCK_ALBUMS.map((album) => (
                <TouchableOpacity
                  key={album.id}
                  style={styles.albumItem}
                  activeOpacity={0.9}
                >
                  <Image source={{ uri: album.cover }} style={styles.albumCover} />
                  <View style={styles.albumInfo}>
                    <Text style={styles.albumTitle}>{album.title}</Text>
                    <Text style={styles.albumCount}>{album.count} photos</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Tagged Tab */}
        {activeTab === 'tagged' && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="person-circle-outline" size={64} color="#DBDBDB" />
            </View>
            <Text style={styles.emptyTitle}>Photos and videos of you</Text>
            <Text style={styles.emptySubtitle}>
              When people tag you in photos and videos, they&apos;ll appear here.
            </Text>
          </View>
        )}

        {/* Floating Snap Button - Always Visible */}
        {activeTab !== 'snaps' && (
          <TouchableOpacity style={styles.floatingSnapButton} onPress={handleSnapNow}>
            <LinearGradient
              colors={['#0095F6', '#E91E63']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.floatingSnapGradient}
            >
              <Ionicons name="camera" size={28} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </ScrollView>
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

  // Header - Minimalist Threads Style
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerUsername: {
    fontSize: 18,
    fontWeight: '700',
    color: '#262626',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerButton: {
    padding: 4,
  },

  // Profile Header
  profileHeader: {
    backgroundColor: '#fff',
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },

  // Avatar - Large Centered (SnapNow Style)
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
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0095F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
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

  // Stats Row - Horizontal (Threads Style)
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

  // Achievements - SnapNow Unique
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

  // Action Buttons - Clean Threads Style
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#262626',
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
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

  // Tabs - Border Bottom (Threads Style)
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

  // Grid Tab - Instagram Style
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
  multipleIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Snaps Tab - SnapNow Unique
  snapsContainer: {
    backgroundColor: '#fff',
    paddingTop: 20,
    paddingHorizontal: 16,
    minHeight: 400,
  },
  snapsHeader: {
    marginBottom: 20,
  },
  snapsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#262626',
    marginBottom: 4,
  },
  snapsSubtitle: {
    fontSize: 14,
    color: '#8E8E8E',
  },
  snapsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  addSnapButton: {
    width: (width - 56) / 3,
    height: (width - 56) / 3,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0095F6',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
  },
  addSnapIconContainer: {
    marginBottom: 8,
  },
  addSnapText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0095F6',
  },
  snapItem: {
    width: (width - 56) / 3,
    height: (width - 56) / 3,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  snapImage: {
    width: '100%',
    height: '100%',
  },
  snapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  snapTime: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },

  // Albums Tab - SnapNow Feature
  albumsContainer: {
    backgroundColor: '#fff',
    paddingTop: 20,
    paddingHorizontal: 16,
    minHeight: 400,
  },
  albumsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  albumsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#262626',
  },
  albumsGrid: {
    gap: 16,
  },
  albumItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    overflow: 'hidden',
  },
  albumCover: {
    width: 100,
    height: 100,
  },
  albumInfo: {
    flex: 1,
    paddingHorizontal: 16,
  },
  albumTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#262626',
    marginBottom: 4,
  },
  albumCount: {
    fontSize: 13,
    color: '#8E8E8E',
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

  // Floating Snap Button - SnapNow Feature
  floatingSnapButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  floatingSnapGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
