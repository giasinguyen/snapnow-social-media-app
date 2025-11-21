import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { auth, db } from '../../config/firebase';
import { useTheme } from '../../contexts/ThemeContext';
import { getFollowedUsersStories, hasViewedStory, type Story as StoryType } from '../../services/stories';
import { COLORS, RADIUS, SIZES, SPACING, TYPOGRAPHY } from '../../src/constants/theme';

export interface Story {
  id: string;
  username: string;
  avatar: string;
  isYourStory?: boolean;
  isViewed?: boolean;
}

interface StoriesProps {
  stories?: Story[];
  onDismiss?: () => void;
}

const Stories: React.FC<StoriesProps> = React.memo(({
  stories: propStories,
  onDismiss,
}) => {
  const { colors } = useTheme();
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>(propStories || []);
  const [refreshing, setRefreshing] = useState(false);
  const currentUserId = auth.currentUser?.uid;
  const [userAvatar, setUserAvatar] = useState<string>('');
  const [userRealTimeInfo, setUserRealTimeInfo] = useState<Map<string, { username: string; avatar: string }>>(new Map());
  const userSubscriptions = useRef<Map<string, () => void>>(new Map());

  // Load user profile data
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!currentUserId) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUserId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserAvatar(userData?.profileImage || auth.currentUser?.photoURL || '');
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    };
    loadUserProfile();
  }, [currentUserId]);

  // Load stories function
  const loadStories = useCallback(async () => {
    if (!currentUserId) return;

    try {
      const followedStories = await getFollowedUsersStories(currentUserId);

      // Group by user and check if viewed
      const userStoriesMap = new Map<string, { story: StoryType; isViewed: boolean; storyTime: number }>();
      
      followedStories.forEach((story) => {
        const isViewed = hasViewedStory(story, currentUserId);
        const existing = userStoriesMap.get(story.userId);
        const storyTime = story.createdAt instanceof Date ? story.createdAt.getTime() : new Date(story.createdAt).getTime();
        
        if (!existing) {
          userStoriesMap.set(story.userId, { story, isViewed, storyTime });
        } else if (!existing.isViewed && !isViewed) {
          // Both unviewed: keep the NEWER one (latest on left for unviewed)
          if (storyTime > existing.storyTime) {
            userStoriesMap.set(story.userId, { story, isViewed, storyTime });
          }
        } else if (!isViewed && existing.isViewed) {
          // Prioritize unviewed stories
          userStoriesMap.set(story.userId, { story, isViewed, storyTime });
        } else if (isViewed && existing.isViewed) {
          // Both viewed: keep the OLDER one (earliest on left for viewed)
          if (storyTime < existing.storyTime) {
            userStoriesMap.set(story.userId, { story, isViewed, storyTime });
          }
        }
      });

      // Convert to Story format
      const formattedStories: Story[] = Array.from(userStoriesMap.values()).map(
        ({ story, isViewed, storyTime }) => ({
          id: story.id,
          username: story.username,
          avatar: story.userProfileImage,
          isViewed,
          isYourStory: story.userId === currentUserId,
          createdAt: storyTime,
        } as Story & { createdAt: number })
      );

      // Sort: own stories first, then unviewed stories (newest first), then viewed stories (oldest first)
      formattedStories.sort((a: any, b: any) => {
        // Your own stories: always oldest first (chronological order)
        if (a.isYourStory && b.isYourStory) {
          return a.createdAt - b.createdAt;
        }
        
        if (a.isYourStory && !b.isYourStory) return -1;
        if (!a.isYourStory && b.isYourStory) return 1;
        
        // Separate unviewed and viewed for others' stories
        if (!a.isViewed && b.isViewed) return -1; // Unviewed comes first
        if (a.isViewed && !b.isViewed) return 1;
        
        // Both unviewed: newest first (descending)
        if (!a.isViewed && !b.isViewed) {
          return b.createdAt - a.createdAt;
        }
        
        // Both viewed: oldest first (ascending)
        if (a.isViewed && b.isViewed) {
          return a.createdAt - b.createdAt;
        }
        
        return 0;
      });

      // Always show "Create Story" button
      formattedStories.unshift({
        id: 'create',
        username: 'Create story',
        avatar: userAvatar,
        isYourStory: true,
        isViewed: false,
      });

      console.log('📱 Stories loaded:', formattedStories.length, formattedStories);
      setStories(formattedStories);
    } catch (error) {
      console.error('Error loading stories:', error);
    }
  }, [currentUserId, userAvatar]);

  // Load stories on mount and when user changes
  useEffect(() => {
    loadStories();
  }, [loadStories]);

  // Subscribe to real-time profile updates for all users in stories
  useEffect(() => {
    if (stories.length === 0) return;

    // Get unique user IDs from stories (exclude create button)
    const userIds = new Set<string>();
    stories.forEach(story => {
      if (story.id !== 'create' && !story.isYourStory) {
        // Extract userId from story - we need to get it from the original story data
        // For now, we'll use username as a proxy, but we should store userId
        userIds.add(story.username);
      }
    });

    // Subscribe to each user's profile
    userIds.forEach(username => {
      // Skip if already subscribed
      if (userSubscriptions.current.has(username)) return;

      // We need to search for user by username to get their ID
      // This is not ideal - we should store userId in Story interface
      const searchAndSubscribe = async () => {
        try {
          const { UserService } = await import('../../services/user');
          const user = await UserService.getUserByUsername(username);
          if (!user) return;

          const userDocRef = doc(db, 'users', user.id);
          const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
              const userData = docSnap.data();
              setUserRealTimeInfo(prev => {
                const newMap = new Map(prev);
                newMap.set(username, {
                  username: userData.username || username,
                  avatar: userData.profileImage || userData.photoURL || '',
                });
                return newMap;
              });
            }
          });

          userSubscriptions.current.set(username, unsubscribe);
        } catch (error) {
          console.error('Error subscribing to user profile:', username, error);
        }
      };

      searchAndSubscribe();
    });

    // Cleanup subscriptions when component unmounts or stories change
    return () => {
      userSubscriptions.current.forEach(unsub => unsub());
      userSubscriptions.current.clear();
    };
  }, [stories]);

  // Subscribe to current user's profile for real-time avatar updates
  useEffect(() => {
    if (!currentUserId) return;

    const userDocRef = doc(db, 'users', currentUserId);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        const newAvatar = userData.profileImage || userData.photoURL || '';
        setUserAvatar(newAvatar);
        
        // Update the create story avatar immediately
        setStories(prev => prev.map(story => 
          story.id === 'create' ? { ...story, avatar: newAvatar } : story
        ));
      }
    });

    return () => unsubscribe();
  }, [currentUserId]);

  // Refresh stories
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStories();
    setRefreshing(false);
  }, [loadStories]);

  // Poll for new stories every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadStories();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [loadStories]);

  // Group stories by userId to show only one circle per user
  const groupedStories = React.useMemo(() => {
    const seen = new Set<string>();
    return stories.filter(story => {
      if (story.isYourStory) return true; // Always show "Create" story
      const key = `${story.username}-${story.avatar}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [stories]);

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundWhite, borderBottomColor: colors.backgroundGray }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Stories</Text>
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={SIZES.icon.sm} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {groupedStories.length === 0 ? (
          // Show "Create Story" button if no stories
          <TouchableOpacity
            style={styles.storyItem}
            onPress={() => router.push('/story/create' as any)}
            activeOpacity={0.7}
          >
            <View style={styles.createStoryContainer}>
              <View style={styles.createStoryBg}>
                <Ionicons name="add" size={28} color={"#fc8727ff"} />
              </View>
              <Text style={[styles.storyUsername, { color: colors.textPrimary }]}>Create</Text>
            </View>
          </TouchableOpacity>
        ) : (
          groupedStories.map((story) => {
          // Show "Create" button only if it's the create placeholder
          const isCreateButton = story.id === 'create';
          const hasUserAvatar = isCreateButton && story.avatar;
          
          // Get real-time user info if available
          const realtimeInfo = userRealTimeInfo.get(story.username);
          const displayUsername = realtimeInfo?.username || story.username;
          const displayAvatar = realtimeInfo?.avatar || story.avatar;
          
          return (
            <TouchableOpacity
              key={story.id}
              style={styles.storyItem}
              onPress={() => isCreateButton ? router.push('/story/create' as any) : router.push(`/story/${story.id}` as any)}
              activeOpacity={0.7}
            >
              {isCreateButton ? (
                <View style={styles.createStoryContainer}>
                  {hasUserAvatar ? (
                    // Show user avatar with + icon overlay
                    <View style={styles.yourStoryContainer}>
                      <Image
                        source={{ uri: displayAvatar }}
                        style={styles.yourStoryAvatar}
                      />
                      <View style={styles.plusIconOverlay}>
                        <Ionicons name="add" size={20} color={"#FFFFFF"} />
                      </View>
                    </View>
                  ) : (
                    // Show blue circle with + icon
                    <View style={styles.createStoryBg}>
                      <Ionicons name="add" size={28} color={"#fc8727ff"} />
                    </View>
                  )}
                  <Text style={[styles.storyUsername, { color: colors.textPrimary }]}>{story.username}</Text>
                </View>
              ) : (
                <>
                  {story.isViewed ? (
                    // Viewed story - gray border
                    <View style={styles.viewedStoryBorder}>
                      <View style={styles.storyAvatarContainer}>
                        <Image
                          source={{ uri: displayAvatar }}
                          style={styles.storyAvatar}
                        />
                      </View>
                    </View>
                  ) : (
                    // Unviewed story - gradient border
                    <LinearGradient
                      colors={['#fc8727ff', '#fc8727ff', '#fc8727ff']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.storyGradient}
                    >
                      <View style={styles.storyAvatarContainer}>
                        <Image
                          source={{ uri: displayAvatar }}
                          style={styles.storyAvatar}
                        />
                      </View>
                    </LinearGradient>
                  )}
                  <Text style={[styles.storyUsername, { color: colors.textPrimary }]} numberOfLines={1}>
                    {displayUsername}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          );
        })
        )}
      </ScrollView>
    </View>
  );
});

Stories.displayName = 'Stories';

export default Stories;

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.backgroundWhite,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.borderLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.md,
  },
  storyItem: {
    alignItems: 'center',
    width: 68,
  },
  createStoryContainer: {
    alignItems: 'center',
  },
  createStoryBg: {
    width: SIZES.avatar.xl,
    height: SIZES.avatar.xl,
    borderRadius: RADIUS.circle,
    backgroundColor: "#ee6e05ff",
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  yourStoryContainer: {
    width: SIZES.avatar.xl,
    height: SIZES.avatar.xl,
    borderRadius: RADIUS.circle,
    marginBottom: SPACING.xs,
    position: 'relative',
  },
  yourStoryAvatar: {
    width: SIZES.avatar.xl,
    height: SIZES.avatar.xl,
    borderRadius: RADIUS.circle,
  },
  plusIconOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#f17006ff",
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.backgroundWhite,
  },
  storyGradient: {
    width: SIZES.avatar.xl,
    height: SIZES.avatar.xl,
    borderRadius: RADIUS.circle,
    padding: 2.5,
    marginBottom: SPACING.xs,
  },
  viewedStoryBorder: {
    width: SIZES.avatar.xl,
    height: SIZES.avatar.xl,
    borderRadius: RADIUS.circle,
    padding: 2.5,
    marginBottom: SPACING.xs,
    borderWidth: 2,
    borderColor: '#DBDBDB',
  },
  storyAvatarContainer: {
    width: '100%',
    height: '100%',
    borderRadius: RADIUS.circle,
    backgroundColor: COLORS.backgroundWhite,
    padding: 2,
  },
  storyAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: RADIUS.circle,
  },
  storyUsername: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    textAlign: 'center',
    maxWidth: 68,
  },
});
