import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../../src/constants/theme';
import { AuthService } from '../../../services/authService';

interface ArchivedStory {
  id: string;
  imageUrl: string;
  username: string;
  createdAt: any;
  caption?: string;
}

const ArchiveScreen = () => {
  const router = useRouter();
  const [stories, setStories] = useState<ArchivedStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    loadArchivedStories();
  }, []);

  const loadArchivedStories = async () => {
    try {
      setLoading(true);
      const currentUser = await AuthService.getCurrentUserProfile();
      if (!currentUser) {
        Alert.alert('Error', 'Please log in');
        return;
      }

      setCurrentUserId(currentUser.id);

      // Import Firebase functions
      const { db } = await import('../../../config/firebase');
      const { collection, query, where, getDocs } = await import('firebase/firestore');

      const q = query(
        collection(db, 'savedStories'),
        where('userId', '==', currentUser.id)
      );

      const querySnapshot = await getDocs(q);
      const archivedStories: ArchivedStory[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        archivedStories.push({
          id: doc.id,
          imageUrl: data.imageUrl || '',
          username: data.username || 'Anonymous',
          createdAt: data.createdAt,
          caption: data.caption,
        });
      });

      // Sort by newest first
      archivedStories.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });

      setStories(archivedStories);
    } catch (error) {
      console.error('Error loading archived stories:', error);
      Alert.alert('Error', 'Failed to load archived stories');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveArchive = useCallback(
    async (storyId: string) => {
      Alert.alert('Remove from Archive', 'Remove this story from archive?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const { db } = await import('../../../config/firebase');
              const { doc, deleteDoc } = await import('firebase/firestore');

              await deleteDoc(doc(db, 'savedStories', storyId));

              setStories((prev) => prev.filter((s) => s.id !== storyId));
              Alert.alert('Success', 'Removed from archive');
            } catch (error) {
              console.error('Error removing from archive:', error);
              Alert.alert('Error', 'Failed to remove from archive');
            }
          },
        },
      ]);
    },
    []
  );

  const renderStoryCard = ({ item }: { item: ArchivedStory }) => (
    <View style={styles.storyCard}>
      <Image source={{ uri: item.imageUrl }} style={styles.storyImage} />

      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveArchive(item.id)}
      >
        <Ionicons name="close-circle" size={28} color={COLORS.white} />
      </TouchableOpacity>

      <View style={styles.storyInfo}>
        <Text style={styles.username} numberOfLines={1}>
          {item.username}
        </Text>
        {item.caption && (
          <Text style={styles.caption} numberOfLines={2}>
            {item.caption}
          </Text>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="image-outline" size={64} color={COLORS.textSecondary} />
      <Text style={styles.emptyTitle}>No Archived Stories</Text>
      <Text style={styles.emptyText}>
        Stories you save will appear here
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Archived Stories</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.blue} />
        </View>
      ) : stories.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={stories}
          renderItem={renderStoryCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundWhite,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.borderLight,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  storyCard: {
    flex: 1,
    aspectRatio: 0.75,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.backgroundGray,
    position: 'relative',
  },
  storyImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 50,
    padding: SPACING.xs,
  },
  storyInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: SPACING.sm,
  },
  username: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  caption: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.white,
    lineHeight: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
});

export default ArchiveScreen;
