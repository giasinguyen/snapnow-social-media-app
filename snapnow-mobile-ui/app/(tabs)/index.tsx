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
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogoHeader } from '../../components/LogoHeader';
import PostCard from '../../components/PostCard';
import SuggestionCard from '../../components/SuggestionCard';
import { Post } from '../../types';
import { 
  MOCK_POSTS, 
  MOCK_STORIES, 
  SUGGESTED_USERS,
  simulateDelay 
} from '../../services/mockData';

export default function HomeScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPosts = useCallback(async () => {
    try {
      // Simulate network delay
      await simulateDelay(1000);
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
    // TODO: Implement like functionality with backend
  }, []);

  const handleComment = useCallback((postId: string) => {
    console.log('Open comments for post:', postId);
    // TODO: Navigate to comments screen
  }, []);

  const handleShare = useCallback((postId: string) => {
    console.log('Share post:', postId);
    // TODO: Implement share functionality
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <LogoHeader />
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stories Section */}
        <View style={styles.storiesContainer}>
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
                <View style={[
                  styles.storyBorder,
                  story.isYourStory && styles.yourStoryBorder
                ]}>
                  <Image 
                    source={{ uri: story.avatar }}
                    style={styles.storyAvatar}
                  />
                  {story.isYourStory && (
                    <View style={styles.addStoryButton}>
                      <Ionicons name="add" size={16} color="#fff" />
                    </View>
                  )}
                </View>
                <Text style={styles.storyUsername} numberOfLines={1}>
                  {story.isYourStory ? 'Your story' : story.username}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Posts Section */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#262626" />
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={64} color="#DBDBDB" />
            <Text style={styles.emptyTitle}>No Posts Yet</Text>
            <Text style={styles.emptySubtitle}>
              Follow people to see their posts in your feed
            </Text>
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
                
                {/* Suggestions For You after 3rd post */}
                {index === 2 && (
                  <View style={styles.suggestionsContainer}>
                    <View style={styles.suggestionsHeader}>
                      <Text style={styles.suggestionsTitle}>Suggestions For You</Text>
                      <TouchableOpacity>
                        <Text style={styles.seeAllText}>See All</Text>
                      </TouchableOpacity>
                    </View>
                    
                    {SUGGESTED_USERS.slice(0, 3).map((user) => (
                      <SuggestionCard 
                        key={user.id}
                        user={user}
                        onFollow={handleFollow}
                      />
                    ))}
                  </View>
                )}
              </React.Fragment>
            ))}
            
            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>You&apos;re all caught up!</Text>
              <Text style={styles.footerSubtext}>
                You&apos;ve seen all new posts from the past 3 days
              </Text>
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
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  storiesContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#DBDBDB',
    backgroundColor: '#fff',
  },
  storiesContent: {
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  storyItem: {
    alignItems: 'center',
    marginHorizontal: 6,
    width: 72,
  },
  storyBorder: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 2,
    borderWidth: 2,
    borderColor: '#E91E63',
    justifyContent: 'center',
    alignItems: 'center',
  },
  yourStoryBorder: {
    borderColor: '#DBDBDB',
  },
  storyAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#fff',
  },
  addStoryButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0095F6',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  storyUsername: {
    fontSize: 12,
    color: '#262626',
    marginTop: 4,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
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
  suggestionsContainer: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    marginVertical: 8,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  suggestionsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#262626',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0095F6',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 40,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#8E8E8E',
    textAlign: 'center',
  },
});