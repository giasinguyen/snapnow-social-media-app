import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../../../config/firebase';
import { useTheme } from '../../../contexts/ThemeContext';
import { Activity, getUserActivityHistory } from '../../../services/activityHistory';

export default function ActivityHistoryScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'likes' | 'comments' | 'posts'>('all');

  const loadActivities = async () => {
    try {
      if (!auth.currentUser) return;
      const data = await getUserActivityHistory(auth.currentUser.uid, filter === 'all' ? undefined : filter);
      setActivities(data);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [filter]);

  const onRefresh = () => {
    setRefreshing(true);
    loadActivities();
  };

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'like':
        return 'heart';
      case 'comment':
        return 'chatbubble';
      case 'post':
        return 'image';
      default:
        return 'ellipse';
    }
  };

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'like':
        return '#ED4956';
      case 'comment':
        return '#0095F6';
      case 'post':
        return '#8E05C2';
      default:
        return '#262626';
    }
  };

  const formatTime = (timestamp: any) => {
    try {
      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diff < 60) return 'Just now';
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
      
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const handleActivityPress = (activity: Activity) => {
    if (activity.postId) {
      router.push(`/post/${activity.postId}` as any);
    }
  };

  const renderActivity = ({ item }: { item: Activity }) => (
    <TouchableOpacity
      style={[styles.activityItem, { backgroundColor: colors.backgroundWhite }]}
      onPress={() => handleActivityPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: getActivityColor(item.type) + '15' }]}>
        <Ionicons
          name={getActivityIcon(item.type)}
          size={20}
          color={getActivityColor(item.type)}
        />
      </View>

      <View style={styles.activityContent}>
        <Text style={[styles.activityText, { color: colors.textPrimary }]} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={[styles.activityTime, { color: colors.textSecondary }]}>{formatTime(item.timestamp)}</Text>
      </View>

      {item.thumbnailUrl && (
        <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} />
      )}

      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
        onPress={() => setFilter('all')}
      >
        <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
          All
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.filterButton, filter === 'likes' && styles.filterButtonActive]}
        onPress={() => setFilter('likes')}
      >
        <Text style={[styles.filterText, filter === 'likes' && styles.filterTextActive]}>
          Likes
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.filterButton, filter === 'comments' && styles.filterButtonActive]}
        onPress={() => setFilter('comments')}
      >
        <Text style={[styles.filterText, filter === 'comments' && styles.filterTextActive]}>
          Comments
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.filterButton, filter === 'posts' && styles.filterButtonActive]}
        onPress={() => setFilter('posts')}
      >
        <Text style={[styles.filterText, filter === 'posts' && styles.filterTextActive]}>
          Posts
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="time-outline" size={64} color={colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Activity Yet</Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        Your activity history will appear here
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.backgroundWhite, borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Activity History</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.textPrimary} />
        </View>
      ) : (
        <FlatList
          data={activities}
          keyExtractor={(item) => item.id}
          renderItem={renderActivity}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={activities.length === 0 ? styles.emptyList : undefined}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#262626',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },
  filterButtonActive: {
    backgroundColor: '#262626',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E8E',
  },
  filterTextActive: {
    color: '#fff',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#262626',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#8E8E8E',
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 4,
    marginRight: 12,
    backgroundColor: '#FAFAFA',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#262626',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E8E',
    textAlign: 'center',
  },
});
