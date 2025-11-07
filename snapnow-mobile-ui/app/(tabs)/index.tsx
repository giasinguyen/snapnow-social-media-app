import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import PostCard from '../../components/PostCard';
import {
  FeedEmpty,
  FeedFooter,
  FeedHeader,
  FeedTabs,
  Stories,
  SuggestionsCard,
  type FeedTab,
  type Story,
  type SuggestedUser
} from '../../components/feed';

import {
  MOCK_STORIES,
} from '../../services/mockData';
import { fetchFeedPosts, fetchPosts } from '../../services/posts';
import { Post } from '../../types';
// import { getRecommendedPosts } from '../../services/recommendation';
import { AuthService } from '../../services/authService';
import { COLORS, SPACING } from '../../src/constants/theme';

export default function HomeScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<FeedTab>('for-you');
  const [showStories, setShowStories] = useState(true);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);

  const loadForYou = useCallback(async () => {
    try {
      setLoading(true);
      // Skip backend recommendations (not available), use global posts
      // try {
      //   const recommended = await getRecommendedPosts();
      //   if (recommended && recommended.length > 0) {
      //     setPosts(recommended);
      //     return;
      //   }
      // } catch (recErr) {
      //   console.warn('Recommendation fetch failed, falling back to global posts', recErr);
      // }

      const realPosts = await fetchPosts();
      setPosts(realPosts);
    } catch (err) {
      console.error('❌ Failed to fetch For You posts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFollowing = useCallback(async () => {
    try {
      setLoading(true);
      const current = await AuthService.getCurrentUserProfile();
      if (!current?.id) {
        setPosts([]);
        return;
      }
      const feed = await fetchFeedPosts(current.id);
      setPosts(feed);
    } catch (err) {
      console.error('❌ Failed to fetch Following posts:', err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'for-you') {
      loadForYou();
    } else {
      loadFollowing();
    }
  }, [activeTab, loadForYou, loadFollowing]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (activeTab === 'for-you') {
      await loadForYou();
    } else {
      await loadFollowing();
    }
    setRefreshing(false);
  }, [activeTab, loadForYou, loadFollowing]);

  // Load suggested users
  const loadSuggestedUsers = useCallback(async () => {
    try {
      console.log('🔄 Loading suggested users...');
      const currentUser = await AuthService.getCurrentUserProfile();
      if (!currentUser) {
        console.log('❌ No current user for suggestions');
        return;
      }

      console.log('👤 Getting suggestions for:', currentUser.id);
      const { UserService } = await import('../../services/user');
      const users = await UserService.getSuggestedUsers(currentUser.id, 3);
      
      console.log('📋 Found suggested users:', users.length);
      
      setSuggestedUsers(
        users.map(user => ({
          id: user.id,
          displayName: user.displayName || user.username,
          username: user.username,
          avatar: user.profileImage || '',
          reason: 'Suggested for you'
        }))
      );
      
      console.log('✅ Suggested users loaded successfully');
    } catch (error) {
      console.error('❌ Error loading suggested users:', error);
    }
  }, []);

  const handleFollow = useCallback(async (userId: string) => {
    try {
      console.log('🔄 Starting follow for user:', userId);
      
      const currentUser = await AuthService.getCurrentUserProfile();
      if (!currentUser) {
        console.log('❌ No current user found');
        return;
      }
      
      console.log('👤 Current user:', currentUser.id, currentUser.username);

      const { followUser } = await import('../../services/follow');
      console.log('📡 Calling followUser service...');
      
      await followUser(
        currentUser.id,
        userId,
        currentUser.username || '',
        currentUser.profileImage
      );

      console.log('✅ Follow successful! Reloading suggestions...');
      
      // Reload suggested users to remove the followed user
      await loadSuggestedUsers();
      console.log('✅ Followed user:', userId);
    } catch (error) {
      console.error('❌ Error following user:', error);
    }
  }, [loadSuggestedUsers]);

  const handleLike = useCallback((postId: string, liked: boolean) => {
    console.log('Like toggled:', postId, liked);
  }, []);

  const handleComment = useCallback((postId: string) => {
    console.log('Open comments for post:', postId);
  }, []);

  const handleShare = useCallback((postId: string) => {
    console.log('Share post:', postId);
  }, []);

  const handlePostPress = useCallback((postId: string, imageIndex?: number) => {
    if (imageIndex !== undefined) {
      router.push(`/post/${postId}?imageIndex=${imageIndex}` as any);
    } else {
      router.push(`/post/${postId}` as any);
    }
  }, []);

  const handleDelete = useCallback((postId: string) => {
    // Remove the deleted post from the local state to update UI immediately
    setPosts(currentPosts => currentPosts.filter(post => post.id !== postId));
  }, []);

  const handleNotifications = useCallback(() => {
    router.push('/(tabs)/activity');
  }, []);

  const handleMessages = useCallback(() => {
    console.log('Open messages');
  }, []);

  const handleDiscoverPeople = useCallback(() => {
    router.push('/(tabs)/search');
  }, []);

  const handleDismissStories = useCallback(() => {
    setShowStories(false);
  }, []);

  const handleTabChange = useCallback((tab: FeedTab) => {
    setActiveTab(tab);
  }, []);

  useEffect(() => {
    loadSuggestedUsers();
  }, [loadSuggestedUsers]);

  // Memoize stories data
  const stories: Story[] = useMemo(() => MOCK_STORIES, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <FeedHeader 
        onNotificationsPress={handleNotifications}
        onMessagesPress={handleMessages}
      />

      {/* Feed Tabs */}
      <FeedTabs activeTab={activeTab} onTabChange={handleTabChange} />
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={COLORS.textPrimary}
          />
        }
      >
        {/* Stories Section */}
        {showStories && (
          <Stories 
            stories={stories}
            onDismiss={handleDismissStories}
          />
        )}

        {/* Posts Section */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.textPrimary} />
          </View>
        ) : posts.length === 0 ? (
          <FeedEmpty onDiscoverPress={handleDiscoverPeople} />
        ) : (
          <>
            {posts.map((post, index) => (
              <React.Fragment key={post.id}>
                <PostCard 
                  post={post}
                  onLike={handleLike}
                  onComment={handleComment}
                  onShare={handleShare}
                  onPress={handlePostPress}
                  onDelete={handleDelete}
                />
                
                {/* Suggestions Card after 2nd post */}
                {index === 1 && (
                  <SuggestionsCard
                    users={suggestedUsers}
                    onFollowPress={handleFollow}
                  />
                )}

                {/* Divider between posts */}
                {index < posts.length - 1 && (
                  <View style={styles.postDivider} />
                )}
              </React.Fragment>
            ))}
            
            {/* Footer */}
            <FeedFooter onRefresh={onRefresh} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  postDivider: {
    height: SPACING.sm,
    backgroundColor: COLORS.backgroundGray,
  },
});