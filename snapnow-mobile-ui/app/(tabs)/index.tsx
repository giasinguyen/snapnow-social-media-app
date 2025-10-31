import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  View,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import PostCard from '../../components/PostCard';
import { 
  FeedHeader, 
  FeedTabs, 
  Stories, 
  SuggestionsCard, 
  FeedEmpty, 
  FeedFooter,
  type FeedTab,
  type Story,
  type SuggestedUser 
} from '../../components/feed';

import { Post } from '../../types';
import { 
  MOCK_STORIES, 
  SUGGESTED_USERS,
} from '../../services/mockData';
import { fetchPosts } from '../../services/posts';
import { COLORS, SPACING } from '../../src/constants/theme';

export default function HomeScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<FeedTab>('for-you');
  const [showStories, setShowStories] = useState(true);

  const loadPosts = useCallback(async () => {
    try {
      console.log('📥 Loading posts from Firestore...');
      const realPosts = await fetchPosts();
      console.log(`✅ Loaded ${realPosts.length} posts`);
      setPosts(realPosts);
    } catch (err) {
      console.error('❌ Failed to fetch posts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  }, [loadPosts]);

  const handleFollow = useCallback((userId: string) => {
    console.log('Following user:', userId);
  }, []);

  const handleLike = useCallback((postId: string, liked: boolean) => {
    console.log('Like toggled:', postId, liked);
  }, []);

  const handleComment = useCallback((postId: string) => {
    console.log('Open comments for post:', postId);
  }, []);

  const handleShare = useCallback((postId: string) => {
    console.log('Share post:', postId);
  }, []);

  const handlePostPress = useCallback((postId: string) => {
    router.push(`/post/${postId}` as any);
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

  // Memoize stories and suggestions data
  const stories: Story[] = useMemo(() => MOCK_STORIES, []);
  const suggestedUsers: SuggestedUser[] = useMemo(() => 
    SUGGESTED_USERS.slice(0, 3).map(user => ({
      id: user.id,
      displayName: user.displayName,
      username: user.username,
      avatar: user.avatar,
      reason: 'Suggested for you'
    })),
    []
  );

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