import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { COLORS, RADIUS, SIZES, SPACING, TYPOGRAPHY } from '../../src/constants/theme';

export interface Story {
  id: string;
  username: string;
  avatar: string;
  isYourStory?: boolean;
  hasNewStory?: boolean;
}

interface StoriesProps {
  stories: Story[];
  onStoryPress?: (storyId: string) => void;
  onCreateStory?: () => void;
  onDismiss?: () => void;
}

const Stories: React.FC<StoriesProps> = React.memo(({
  stories,
  onStoryPress,
  onCreateStory,
  onDismiss,
}) => {
  const router = useRouter();

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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Stories</Text>
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={SIZES.icon.sm} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {groupedStories.map((story) => (
          <TouchableOpacity
            key={story.id}
            style={styles.storyItem}
            onPress={() => story.isYourStory ? onCreateStory?.() : router.push(`/story/${story.id}` as any)}
            activeOpacity={0.7}
          >
            {story.isYourStory ? (
              <View style={styles.createStoryContainer}>
                <View style={styles.createStoryBg}>
                  <Ionicons name="add" size={28} color={COLORS.textWhite} />
                </View>
                <Text style={styles.storyUsername}>Create</Text>
              </View>
            ) : (
              <>
                <LinearGradient
                  colors={[COLORS.gradientPurple, COLORS.gradientPurpleAlt, COLORS.gradientBlue]}
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
    backgroundColor: COLORS.blue,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  storyGradient: {
    width: SIZES.avatar.xl,
    height: SIZES.avatar.xl,
    borderRadius: RADIUS.circle,
    padding: 2.5,
    marginBottom: SPACING.xs,
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
    color: COLORS.textPrimary,
    textAlign: 'center',
    maxWidth: 68,
  },
});
