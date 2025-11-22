import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PostCard from '../../../components/PostCard';
import { auth } from '../../../config/firebase';
import { useTheme } from '../../../contexts/ThemeContext';
import { getSavedPosts } from '../../../services/posts';
import { Post } from '../../../types';

export default function SavedScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookmarkedMap, setBookmarkedMap] = useState<{[postId: string]: boolean}>({});

  const loadSavedPosts = async () => {
    if (!auth.currentUser) return;
    try {
      setLoading(true);
      const savedPosts = await getSavedPosts(auth.currentUser.uid);
      setPosts(savedPosts);
    } catch (error) {
      console.error('Error loading saved posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSavedPosts();
    setRefreshing(false);
  };

  useEffect(() => {
    loadSavedPosts();
  }, []);

  useEffect(() => {
    async function fetchBookmarks() {
      if (!auth.currentUser) return;
      const map: {[postId: string]: boolean} = {};
      for (const post of posts) {
        map[post.id] = true; // Ở trang Saved, tất cả đều đã bookmark
      }
      setBookmarkedMap(map);
    }
    fetchBookmarks();
  }, [posts]);

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard post={item} bookmarked={bookmarkedMap[item.id]} onDelete={() => loadSavedPosts()} />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { backgroundColor: colors.backgroundWhite, borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Saved Posts</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No saved posts</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Posts you save will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item, index) => item.id + '_' + index}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          contentContainerStyle={styles.content}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  content: {
    paddingBottom: 32,
  },
});