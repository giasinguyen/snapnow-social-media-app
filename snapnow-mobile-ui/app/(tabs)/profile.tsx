import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AddPhotosToAlbumModal from '../../components/AddPhotosToAlbumModal';
import CreateAlbumModal from '../../components/CreateAlbumModal';
import ShareProfileModal from '../../components/ShareProfileModal';
import { CLOUDINARY_FOLDERS } from '../../config/cloudinary';
import { db } from '../../config/firebase';
import { Album, createAlbum, fetchUserAlbums } from '../../services/albums';
import { AuthService, UserProfile } from '../../services/authService';
import { uploadToCloudinary } from '../../services/cloudinary';
import { formatFollowers } from '../../services/mockData';
import { fetchUserPosts } from '../../services/posts';
import { cleanupExpiredSnaps, createSnap, fetchUserSnaps, Snap } from '../../services/snaps';
import { getUserStories, Story } from '../../services/stories';
import { fetchTaggedPosts } from '../../services/tagged';
import { Post } from '../../types';

const { width } = Dimensions.get('window');
const POST_SIZE = (width - 2) / 3; // 2px total gap, 1px between each

type TabType = 'grid' | 'snaps' | 'albums' | 'tagged';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('grid');
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [snaps, setSnaps] = useState<Snap[]>([]);
  const [loadingSnaps, setLoadingSnaps] = useState(false);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loadingAlbums, setLoadingAlbums] = useState(false);
  const [taggedPosts, setTaggedPosts] = useState<Post[]>([]);
  const [loadingTagged, setLoadingTagged] = useState(false);
  const [showCreateAlbumModal, setShowCreateAlbumModal] = useState(false);
  const [showAddPhotosModal, setShowAddPhotosModal] = useState(false);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [userStories, setUserStories] = useState<Story[]>([]);
  const [showAvatarViewer, setShowAvatarViewer] = useState(false);
  const router = useRouter();

  const loadProfile = async () => {
    try {
      setLoading(true);
      
      // Load own profile
      const currentUser = await AuthService.getCurrentUserProfile();
      setProfile(currentUser);
      
      // Load user's posts
      if (currentUser?.id) {
        setLoadingPosts(true);
        const posts = await fetchUserPosts(currentUser.id);
        setUserPosts(posts);
        setLoadingPosts(false);

        // Load snaps
        setLoadingSnaps(true);
        await cleanupExpiredSnaps(currentUser.id); // Clean up expired snaps first
        const userSnaps = await fetchUserSnaps(currentUser.id);
        setSnaps(userSnaps);
        setLoadingSnaps(false);

        // Load albums
        setLoadingAlbums(true);
        const userAlbums = await fetchUserAlbums(currentUser.id);
        setAlbums(userAlbums);
        setLoadingAlbums(false);

        // Load tagged posts
        setLoadingTagged(true);
        const tagged = await fetchTaggedPosts(currentUser.username);
        setTaggedPosts(tagged);
        setLoadingTagged(false);
      }
    } catch (err) {
      console.error('Failed to load profile', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    loadUserStories();
  }, []);

  // Subscribe to real-time updates for follower/following counts
  useEffect(() => {
    if (!profile?.id) return;

    const userDocRef = doc(db, 'users', profile.id);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        setProfile(prev => prev ? {
          ...prev,
          followersCount: userData.followersCount || 0,
          followingCount: userData.followingCount || 0,
        } : null);
      }
    }, (error) => {
      console.error('Error subscribing to profile updates:', error);
    });

    return () => unsubscribe();
  }, [profile?.id]);

  const loadUserStories = async () => {
    try {
      const currentUser = await AuthService.getCurrentUserProfile();
      if (currentUser?.id) {
        const stories = await getUserStories(currentUser.id);
        console.log('📖 Loaded own stories:', stories.length, stories);
        setUserStories(stories);
      }
    } catch (error) {
      console.error('Error loading user stories:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    await loadUserStories();
    setRefreshing(false);
  };

  const handleSettings = () => {
    router.push('/(tabs)/settings');
  };

  const handleAvatarPress = () => {
    console.log('👆 Avatar pressed, stories count:', userStories.length);
    if (userStories.length > 0) {
      console.log('📱 Navigating to story:', userStories[0].id);
      router.push(`/story/${userStories[0].id}` as any);
    } else {
      console.log('⚠️ No stories to show');
    }
  };

  const handleAvatarLongPress = () => {
    // For own profile, long press goes directly to avatar viewer
    setShowAvatarViewer(true);
  };

  const handleSnapNow = async () => {
    if (!profile) return;

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        
        // Show loading
        Alert.alert('Uploading...', 'Creating your snap');

        // Upload to Cloudinary
        const uploadResult = await uploadToCloudinary(imageUri, {
          folder: CLOUDINARY_FOLDERS.snaps,
          tags: ['snap', profile.id],
        });

        // Create snap in Firestore
        await createSnap({
          userId: profile.id,
          userName: profile.displayName || profile.username,
          userPhoto: profile.profileImage || '',
          imageUrl: uploadResult.secure_url,
          expiresIn24h: true,
        });

        // Reload snaps
        const userSnaps = await fetchUserSnaps(profile.id);
        setSnaps(userSnaps);

        Alert.alert('Success', 'Snap created! It will disappear in 24 hours.');
        setActiveTab('snaps'); // Switch to snaps tab
      }
    } catch (error) {
      console.error('Error creating snap:', error);
      Alert.alert('Error', 'Failed to create snap. Please try again.');
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleCreateAlbum = async (title: string, description: string) => {
    if (!profile) return;

    try {
      // Create album in Firestore
      const newAlbum = await createAlbum({
        userId: profile.id,
        title,
        description,
      });

      // Reload albums
      const userAlbums = await fetchUserAlbums(profile.id);
      setAlbums(userAlbums);

      console.log('✅ Album created:', newAlbum.id);
    } catch (error) {
      console.error('❌ Error creating album:', error);
      throw error;
    }
  };

  const handlePhotosAdded = async () => {
    if (!profile?.id) return;
    
    try {
      setLoadingAlbums(true);
      const userAlbums = await fetchUserAlbums(profile.id);
      setAlbums(userAlbums);
    } catch (error) {
      console.error('Error reloading albums:', error);
    } finally {
      setLoadingAlbums(false);
    }
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
          { (profile as any)?.isPrivate ? (
            <Ionicons name="lock-closed-outline" size={18} color="#8E8E8E" />
          ) : null }
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
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={handleAvatarPress}
            onLongPress={handleAvatarLongPress}
            activeOpacity={0.9}
          >
            {userStories.length > 0 ? (
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
            ) : (
              <View style={styles.avatarNoStory}>
                <Image
                  source={
                    profile.profileImage 
                      ? { uri: profile.profileImage } 
                      : { uri: 'https://i.pravatar.cc/150?img=1' }
                  }
                  style={styles.avatar}
                />
              </View>
            )}
            {/* Camera Icon Overlay - SnapNow Feature */}
            <TouchableOpacity style={styles.cameraOverlay} onPress={handleSnapNow}>
              <Ionicons name="camera" size={20} color="#fff" />
            </TouchableOpacity>
          </TouchableOpacity>

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
              <Text style={styles.statNumber}>{userPosts.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => setActiveTab('snaps')}
            >
              <Text style={styles.statNumber}>{snaps.length}</Text>
              <Text style={styles.statLabel}>Snaps</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => {
                console.log('🔘 Followers button pressed on own profile, userId:', profile.id);
                router.push(`/user/follow/followers?userId=${profile.id}`);
              }}
            >
              <Text style={styles.statNumber}>{formatFollowers(profile.followersCount ?? 1234)}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => {
                console.log('🔘 Following button pressed on own profile, userId:', profile.id);
                router.push(`/user/follow/following?userId=${profile.id}`);
              }}
            >
              <Text style={styles.statNumber}>{profile.followingCount ?? 567}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
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
              Post
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
                  Share your first moment with the world
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

        {/* Snaps Tab - SnapNow Unique Feature */}
        {activeTab === 'snaps' && (
          <View style={styles.snapsContainer}>
            <View style={styles.snapsHeader}>
              <Text style={styles.snapsTitle}>Quick Snaps</Text>
              <Text style={styles.snapsSubtitle}>Disappear in 24 hours</Text>
            </View>
            {loadingSnaps ? (
              <View style={styles.center}>
                <ActivityIndicator size="large" color="#0095F6" />
              </View>
            ) : (
              <View style={styles.snapsGrid}>
                {/* Add Snap Button */}
                <TouchableOpacity style={styles.addSnapButton} onPress={handleSnapNow}>
                  <View style={styles.addSnapIconContainer}>
                    <Ionicons name="camera" size={32} color="#0095F6" />
                  </View>
                  <Text style={styles.addSnapText}>Snap Now</Text>
                </TouchableOpacity>

                {/* Display Snaps */}
                {snaps.map((snap) => {
                  const createdAt = snap.createdAt?.toDate ? snap.createdAt.toDate() : new Date();
                  const hoursAgo = Math.floor((new Date().getTime() - createdAt.getTime()) / (1000 * 60 * 60));
                  const timeLeft = 24 - hoursAgo;

                  return (
                    <TouchableOpacity
                      key={snap.id}
                      style={styles.snapItem}
                      onPress={() => {
                        // TODO: Open snap viewer
                        Alert.alert('Snap', `${timeLeft}h left`);
                      }}
                    >
                      <Image source={{ uri: snap.imageUrl }} style={styles.snapImage} />
                      <View style={styles.snapOverlay}>
                        <Text style={styles.snapTime}>{timeLeft}h left</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}

                {snaps.length === 0 && (
                  <View style={styles.emptySnapMessage}>
                    <Text style={styles.emptySubtitle}>No snaps yet. Create your first snap!</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Albums Tab - SnapNow Feature */}
        {activeTab === 'albums' && (
          <View style={styles.albumsContainer}>
            <View style={styles.albumsHeader}>
              <Text style={styles.albumsTitle}>Photo Albums</Text>
              <TouchableOpacity onPress={() => setShowCreateAlbumModal(true)}>
                <Ionicons name="add-circle-outline" size={28} color="#0095F6" />
              </TouchableOpacity>
            </View>
            {loadingAlbums ? (
              <View style={styles.center}>
                <ActivityIndicator size="large" color="#0095F6" />
              </View>
            ) : albums.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="albums-outline" size={64} color="#DBDBDB" />
                </View>
                <Text style={styles.emptyTitle}>No albums yet</Text>
                <Text style={styles.emptySubtitle}>
                  Create albums to organize your photos
                </Text>
              </View>
            ) : (
              <View style={styles.albumsGrid}>
                {albums.map((album) => (
                  <TouchableOpacity
                    key={album.id}
                    style={styles.albumItem}
                    onPress={() => {
                      setSelectedAlbumId(album.id);
                      setShowAddPhotosModal(true);
                    }}
                  >
                    {album.coverPhoto ? (
                      <Image source={{ uri: album.coverPhoto }} style={styles.albumCover} />
                    ) : (
                      <View style={[styles.albumCover, { backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' }]}>
                        <Ionicons name="albums" size={40} color="#DBDBDB" />
                      </View>
                    )}
                    <View style={styles.albumInfo}>
                      <Text style={styles.albumTitle}>{album.title}</Text>
                      <Text style={styles.albumCount}>{album.postsCount} photos</Text>
                      {album.description && (
                        <Text style={styles.albumDescription} numberOfLines={2}>
                          {album.description}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Tagged Tab */}
        {activeTab === 'tagged' && (
          <View style={styles.postsGrid}>
            {loadingTagged ? (
              <View style={styles.center}>
                <ActivityIndicator size="large" color="#0095F6" />
              </View>
            ) : taggedPosts.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="person-circle-outline" size={64} color="#DBDBDB" />
                </View>
                <Text style={styles.emptyTitle}>Photos and videos of you</Text>
                <Text style={styles.emptySubtitle}>
                  When people tag you in photos and videos, they'll appear here.
                </Text>
              </View>
            ) : (
              taggedPosts.map((post) => (
                <TouchableOpacity
                  key={post.id}
                  style={styles.gridItem}
                  activeOpacity={0.9}
                  onPress={() => router.push(`/post/${post.id}` as any)}
                >
                  <Image source={{ uri: post.imageUrl }} style={styles.gridImage} />
                  {/* Tagged indicator */}
                  <View style={styles.taggedIndicator}>
                    <Ionicons name="person" size={16} color="#fff" />
                  </View>
                </TouchableOpacity>
              ))
            )}
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

      {/* Share Profile Modal */}
      {profile && (
        <>
          <ShareProfileModal
            visible={showShareModal}
            onClose={() => setShowShareModal(false)}
            username={profile.username}
            displayName={profile.displayName || profile.username}
          />
          <CreateAlbumModal
            visible={showCreateAlbumModal}
            onClose={() => setShowCreateAlbumModal(false)}
            onCreateAlbum={handleCreateAlbum}
          />
          {selectedAlbumId && (
            <AddPhotosToAlbumModal
              visible={showAddPhotosModal}
              onClose={() => {
                setShowAddPhotosModal(false);
                setSelectedAlbumId(null);
              }}
              albumId={selectedAlbumId}
              userId={profile.id}
              onPhotosAdded={handlePhotosAdded}
            />
          )}
        </>
      )}

      {/* Avatar Viewer Modal */}
      <Modal
        visible={showAvatarViewer}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAvatarViewer(false)}
      >
        <BlurView intensity={100} style={styles.avatarViewerContainer}>
          <TouchableOpacity 
            style={styles.avatarViewerOverlay}
            activeOpacity={1}
            onPress={() => setShowAvatarViewer(false)}
          >
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowAvatarViewer(false)}>
              <Ionicons name="close" size={32} color="#000000ff" />
            </TouchableOpacity>
            
            <View style={styles.avatarViewerContent}>
              <Image
                source={
                  profile?.profileImage 
                    ? { uri: profile.profileImage } 
                    : { uri: 'https://i.pravatar.cc/150?img=1' }
                }
                style={styles.avatarViewerImage}
                resizeMode="cover"
              />
            </View>
          </TouchableOpacity>
        </BlurView>
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
  backButton: {
    padding: 8,
    marginRight: 8,
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
  avatarNoStory: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#DBDBDB',
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
  emptySnapMessage: {
    width: '100%',
    paddingVertical: 40,
    alignItems: 'center',
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
  albumDescription: {
    fontSize: 12,
    color: '#8E8E8E',
    marginTop: 4,
    lineHeight: 16,
  },

  // Tagged Posts
  taggedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
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

  // Avatar Viewer Modal
  avatarViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(173, 173, 173, 0.95)',
  },
  avatarViewerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  avatarViewerContent: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: (width * 0.8) / 2,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  avatarViewerImage: {
    width: '100%',
    height: '100%',
  },
});
