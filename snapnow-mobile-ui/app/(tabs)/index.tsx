import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState, useCallback } from 'react';
import { 
  Image, 
  ScrollView, 
  Text, 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import PostCard from '../../components/PostCard';
import { Post } from '../../types';
import { 
  MOCK_POSTS, 
  MOCK_STORIES, 
  SUGGESTED_USERS,
  simulateDelay 
} from '../../services/mockData';

// Tab type for feed filter
type FeedTab = 'for-you' | 'following';

export default function HomeScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<FeedTab>('for-you');
  const [showStories, setShowStories] = useState(true);

  const loadPosts = useCallback(async () => {
    try {
      await simulateDelay(800);
      setPosts(MOCK_POSTS);
    } catch (err) {
      console.error('Failed to fetch posts', err);
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

  const handleFollow = (userId: string) => {
    console.log('Following user:', userId);
  };

  const handleLike = useCallback((postId: string, liked: boolean) => {
    console.log('Like toggled:', postId, liked);
  }, []);

  const handleComment = useCallback((postId: string) => {
    console.log('Open comments for post:', postId);
  }, []);

  const handleShare = useCallback((postId: string) => {
    console.log('Share post:', postId);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Custom Header - Threads Style */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.logoContainer}>
          <Text style={styles.logoText}>SnapNow</Text>
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="heart-outline" size={26} color="#262626" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="chatbubble-outline" size={24} color="#262626" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Feed Tabs - Threads Style */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'for-you' && styles.activeTab]}
          onPress={() => setActiveTab('for-you')}
        >
          <Text style={[styles.tabText, activeTab === 'for-you' && styles.activeTabText]}>
            For You
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'following' && styles.activeTab]}
          onPress={() => setActiveTab('following')}
        >
          <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>
            Following
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#262626"
          />
        }
      >
        {/* Stories Section - Compact Threads Style */}
        {showStories && (
          <View style={styles.storiesWrapper}>
            <View style={styles.storiesHeader}>
              <Text style={styles.storiesTitle}>Stories</Text>
              <TouchableOpacity onPress={() => setShowStories(false)}>
                <Ionicons name="close" size={20} color="#8E8E8E" />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.storiesContent}
            >
              {MOCK_STORIES.map((story) => (
                <TouchableOpacity 
                  key={story.id} 
                  style={styles.storyItem}
                  activeOpacity={0.7}
                >
                  {story.isYourStory ? (
                    <View style={styles.createStoryContainer}>
                      <View style={styles.createStoryBg}>
                        <Ionicons name="add" size={28} color="#fff" />
                      </View>
                      <Text style={styles.storyUsername}>Create</Text>
                    </View>
                  ) : (
                    <>
                      <LinearGradient
                        colors={['#E91E63', '#9C27B0', '#2196F3']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.storyGradient}
                      >
                        <View style={styles.storyAvatarContainer}>
                          <Image 
                            source={{ uri: story.avatar }}
                            style={styles.storyAvatar}
                          />
                        </View>
                      </LinearGradient>
                      <Text style={styles.storyUsername} numberOfLines={1}>
                        {story.username}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Posts Section */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#262626" />
            <Text style={styles.loadingText}>Loading feed...</Text>
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="newspaper-outline" size={64} color="#DBDBDB" />
            </View>
            <Text style={styles.emptyTitle}>No Posts Yet</Text>
            <Text style={styles.emptySubtitle}>
              Start following people to see their posts in your feed
            </Text>
            <TouchableOpacity style={styles.discoverButton}>
              <Text style={styles.discoverButtonText}>Discover People</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {posts.map((post, index) => (
              <React.Fragment key={post.id}>
                <PostCard 
                  post={post}
                  onLike={handleLike}
                  onComment={handleComment}
                  onShare={handleShare}
                />
                
                {/* Suggestions Card - Threads Style after 2nd post */}
                {index === 1 && (
                  <View style={styles.suggestionsCard}>
                    <View style={styles.suggestionsHeader}>
                      <View>
                        <Text style={styles.suggestionsTitle}>
                          Suggested for you
                        </Text>
                        <Text style={styles.suggestionsSubtitle}>
                          Based on who you follow
                        </Text>
                      </View>
                      <TouchableOpacity>
                        <Text style={styles.seeAllText}>See all</Text>
                      </TouchableOpacity>
                    </View>
                    
                    {SUGGESTED_USERS.slice(0, 3).map((user, idx) => (
                      <View key={user.id} style={styles.suggestionItem}>
                        <View style={styles.suggestionLeft}>
                          <Image 
                            source={{ uri: user.avatar }}
                            style={styles.suggestionAvatar}
                          />
                          <View style={styles.suggestionInfo}>
                            <Text style={styles.suggestionName}>
                              {user.displayName}
                            </Text>
                            <Text style={styles.suggestionUsername}>
                              @{user.username}
                            </Text>
                            <Text style={styles.suggestionMutual}>
                              Suggested for you
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity 
                          style={styles.followButton}
                          onPress={() => handleFollow(user.id)}
                        >
                          <Text style={styles.followButtonText}>Follow</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {/* Divider between posts */}
                {index < posts.length - 1 && (
                  <View style={styles.postDivider} />
                )}
              </React.Fragment>
            ))}
            
            {/* Footer */}
            <View style={styles.footer}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#0095F6" />
              <Text style={styles.footerTitle}>You&apos;re all caught up</Text>
              <Text style={styles.footerSubtext}>
                You&apos;ve seen all new posts from the past 3 days
              </Text>
              <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
                <Ionicons name="refresh-outline" size={20} color="#0095F6" />
                <Text style={styles.refreshButtonText}>Refresh feed</Text>
              </TouchableOpacity>
            </View>
          </>
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
  // Header Styles - Threads inspired
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
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#262626',
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerButton: {
    padding: 4,
  },
  // Tabs - Threads Style
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#DBDBDB',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#262626',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8E8E8E',
  },
  activeTabText: {
    color: '#262626',
  },
  scrollView: {
    flex: 1,
  },
  // Stories - Compact Threads Style
  storiesWrapper: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    marginBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EFEFEF',
  },
  storiesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  storiesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#262626',
  },
  storiesContent: {
    paddingHorizontal: 12,
    gap: 12,
  },
  storyItem: {
    alignItems: 'center',
    width: 68,
  },
  createStoryContainer: {
    alignItems: 'center',
  },
  createStoryBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0095F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  storyGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 2.5,
    marginBottom: 4,
  },
  storyAvatarContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    backgroundColor: '#fff',
    padding: 2,
  },
  storyAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
  },
  storyUsername: {
    fontSize: 11,
    color: '#262626',
    textAlign: 'center',
    maxWidth: 68,
  },
  // Loading & Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#8E8E8E',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 12,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#262626',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E8E',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  discoverButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: '#262626',
    borderRadius: 24,
  },
  discoverButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  // Suggestions Card - Threads Style
  suggestionsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#EFEFEF',
  },
  suggestionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#262626',
  },
  suggestionsSubtitle: {
    fontSize: 12,
    color: '#8E8E8E',
    marginTop: 2,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0095F6',
  },
  suggestionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#EFEFEF',
  },
  suggestionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  suggestionAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
  },
  suggestionUsername: {
    fontSize: 13,
    color: '#8E8E8E',
    marginTop: 2,
  },
  suggestionReason: {
    fontSize: 12,
    color: '#8E8E8E',
    marginTop: 2,
  },
  suggestionMutual: {
    fontSize: 12,
    color: '#8E8E8E',
    marginTop: 2,
  },
  followButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#262626',
    borderRadius: 20,
  },
  followButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  // Post Divider
  postDivider: {
    height: 8,
    backgroundColor: '#F8F8F8',
  },
  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 40,
    backgroundColor: '#fff',
  },
  footerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#262626',
    marginTop: 16,
    marginBottom: 8,
  },
  footerSubtext: {
    fontSize: 13,
    color: '#8E8E8E',
    textAlign: 'center',
    lineHeight: 18,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: '#0095F6',
    borderRadius: 24,
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0095F6',
  },
});
