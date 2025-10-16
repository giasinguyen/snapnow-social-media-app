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
const POST_SIZE = (width - 4) / 3;

type TabType = 'grid' | 'reels' | 'tagged';

// Mock highlights data
const HIGHLIGHTS = [
  { id: '1', title: 'Travel', cover: 'https://picsum.photos/200/200?random=1' },
  { id: '2', title: 'Food', cover: 'https://picsum.photos/200/200?random=2' },
  { id: '3', title: 'Friends', cover: 'https://picsum.photos/200/200?random=3' },
  { id: '4', title: 'Work', cover: 'https://picsum.photos/200/200?random=4' },
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

  const handleArchive = () => {
    console.log('Open archive');
  };

  const handleActivity = () => {
    console.log('Open activity');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#262626" />
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="lock-closed-outline" size={20} color="#262626" />
        </TouchableOpacity>
        <Text style={styles.headerUsername}>{profile.username}</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.headerButton} onPress={handleArchive}>
            <Ionicons name="archive-outline" size={24} color="#262626" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleSettings}>
            <Ionicons name="menu-outline" size={28} color="#262626" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Info Section */}
        <View style={styles.profileSection}>
          {/* Avatar with gradient border (Custom 30%) */}
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
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
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statNumber}>{profile.postsCount ?? MOCK_POSTS.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statNumber}>{formatFollowers(profile.followersCount ?? 1234)}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statNumber}>{profile.followingCount ?? 567}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bio Section */}
        <View style={styles.bioSection}>
          <Text style={styles.displayName}>{profile.displayName || profile.username}</Text>
          {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
          <Text style={styles.bioLink}>🔗 snapnow.app/{profile.username}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push({ pathname: '/(tabs)/edit-profile' })}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton}>
            <Text style={styles.shareButtonText}>Share Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addFriendButton} onPress={handleActivity}>
            <Ionicons name="person-add-outline" size={18} color="#262626" />
          </TouchableOpacity>
        </View>

        {/* Highlights Section */}
        <View style={styles.highlightsSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {/* Add New Highlight */}
            <TouchableOpacity style={styles.highlightItem}>
              <View style={styles.highlightAddBorder}>
                <Ionicons name="add" size={32} color="#8E8E8E" />
              </View>
              <Text style={styles.highlightTitle}>New</Text>
            </TouchableOpacity>

            {/* Highlights */}
            {HIGHLIGHTS.map((highlight) => (
              <TouchableOpacity key={highlight.id} style={styles.highlightItem}>
                <View style={styles.highlightBorder}>
                  <Image source={{ uri: highlight.cover }} style={styles.highlightImage} />
                </View>
                <Text style={styles.highlightTitle}>{highlight.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'grid' && styles.activeTab]}
            onPress={() => setActiveTab('grid')}
          >
            <Ionicons
              name="grid"
              size={24}
              color={activeTab === 'grid' ? '#262626' : '#8E8E8E'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reels' && styles.activeTab]}
            onPress={() => setActiveTab('reels')}
          >
            <Ionicons
              name="play-circle"
              size={24}
              color={activeTab === 'reels' ? '#262626' : '#8E8E8E'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'tagged' && styles.activeTab]}
            onPress={() => setActiveTab('tagged')}
          >
            <Ionicons
              name="person-outline"
              size={24}
              color={activeTab === 'tagged' ? '#262626' : '#8E8E8E'}
            />
          </TouchableOpacity>
        </View>

        {/* Posts Grid */}
        {activeTab === 'grid' && (
          <View style={styles.postsGrid}>
            {MOCK_POSTS.slice(0, 9).map((post, index) => (
              <TouchableOpacity
                key={post.id}
                style={styles.gridItem}
                activeOpacity={0.8}
              >
                <Image source={{ uri: post.imageUrl }} style={styles.gridImage} />
                {/* Multiple photos indicator */}
                {index % 3 === 0 && (
                  <View style={styles.multipleIndicator}>
                    <Ionicons name="copy-outline" size={16} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Reels Tab */}
        {activeTab === 'reels' && (
          <View style={styles.emptyState}>
            <Ionicons name="play-circle-outline" size={64} color="#DBDBDB" />
            <Text style={styles.emptyTitle}>No Reels Yet</Text>
            <Text style={styles.emptySubtitle}>Share your first reel</Text>
          </View>
        )}

        {/* Tagged Tab */}
        {activeTab === 'tagged' && (
          <View style={styles.emptyState}>
            <Ionicons name="person-circle-outline" size={64} color="#DBDBDB" />
            <Text style={styles.emptyTitle}>Photos and videos of you</Text>
            <Text style={styles.emptySubtitle}>
              When people tag you in photos and videos, they&apos;ll appear here.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  headerUsername: {
    fontSize: 18,
    fontWeight: '600',
    color: '#262626',
    flex: 1,
    textAlign: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  headerButton: {
    padding: 4,
  },
  // Profile Section
  profileSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 24,
  },
  avatarGradient: {
    width: 88,
    height: 88,
    borderRadius: 44,
    padding: 3,
  },
  avatarInner: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#fff',
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
  },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#262626',
  },
  statLabel: {
    fontSize: 13,
    color: '#262626',
    marginTop: 2,
  },
  // Bio Section
  bioSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  displayName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
  },
  bio: {
    fontSize: 14,
    color: '#262626',
    marginTop: 4,
    lineHeight: 18,
  },
  bioLink: {
    fontSize: 14,
    color: '#00376B',
    marginTop: 4,
  },
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#EFEFEF',
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#EFEFEF',
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
  },
  addFriendButton: {
    backgroundColor: '#EFEFEF',
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Highlights Section
  highlightsSection: {
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  highlightItem: {
    alignItems: 'center',
    marginLeft: 16,
    width: 64,
  },
  highlightAddBorder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#DBDBDB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  highlightBorder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#DBDBDB',
    padding: 2,
  },
  highlightImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  highlightTitle: {
    fontSize: 12,
    color: '#262626',
    marginTop: 4,
  },
  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#262626',
  },
  // Posts Grid
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    width: POST_SIZE,
    height: POST_SIZE,
    margin: 1,
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
  },
  // Empty States
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#262626',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E8E',
    marginTop: 8,
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#262626',
    marginTop: 16,
  },
  subText: {
    fontSize: 14,
    color: '#8E8E8E',
    textAlign: 'center',
    marginTop: 8,
  },
});