import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getFollowing } from '../../services/follow';
import { UserService } from '../../services/user';
import { User } from '../../types';

export default function FollowingScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const [following, setFollowing] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔍 FollowingScreen mounted with userId:', userId);
    loadFollowing();
  }, [userId]);

  const loadFollowing = async () => {
    if (!userId) {
      console.log('❌ No userId provided');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('📋 Loading following for user:', userId);
      console.log('📋 userId type:', typeof userId);
      console.log('📋 userId length:', userId.length);
      
      // Get following IDs
      const followingIds = await getFollowing(userId);
      console.log('📋 Following IDs:', followingIds);
      console.log('📋 Number of following found:', followingIds.length);
      
      // Get user details for each following
      const followingUsers = await Promise.all(
        followingIds.map(async (followingId) => {
          try {
            return await UserService.getUserProfile(followingId);
          } catch (error) {
            console.error('Failed to load following user:', followingId, error);
            return null;
          }
        })
      );
      
      // Filter out null values
      const validFollowing = followingUsers.filter((user): user is User => user !== null);
      console.log('✅ Loaded following:', validFollowing.length);
      setFollowing(validFollowing);
    } catch (error) {
      console.error('Failed to load following:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderFollowing = ({ item }: { item: User }) => {
    // Get initials for placeholder
    const initials = item.displayName 
      ? item.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      : item.username.slice(0, 2).toUpperCase();
    
    const hasValidImage = item.profileImage && item.profileImage.trim() !== '';
    
    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => router.push(`/user/${item.id}`)}
      >
        {hasValidImage ? (
          <Image
            source={{ uri: item.profileImage }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        )}
        <View style={styles.userInfo}>
          <Text style={styles.username}>{item.username}</Text>
          {item.displayName && (
            <Text style={styles.displayName}>{item.displayName}</Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#8E8E8E" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#262626" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Following</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0095F6" />
        </View>
      ) : following.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="people-outline" size={80} color="#DBDBDB" />
          <Text style={styles.emptyTitle}>Not following anyone</Text>
          <Text style={styles.emptySubtitle}>When this account follows people, they'll appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={following}
          renderItem={renderFollowing}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#262626',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#262626',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E8E',
    textAlign: 'center',
    marginTop: 8,
  },
  list: {
    padding: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#DBDBDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
  },
  displayName: {
    fontSize: 14,
    color: '#8E8E8E',
    marginTop: 2,
  },
});
