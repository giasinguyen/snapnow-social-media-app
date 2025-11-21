import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../../../config/firebase';
import { useTheme } from '../../../contexts/ThemeContext';
import { BlockedUser, getBlockedUsers, unblockUser } from '../../../services/blocking';

export default function BlockedAccountsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblocking, setUnblocking] = useState<string | null>(null);

  useEffect(() => {
    loadBlockedUsers();
  }, []);

  const loadBlockedUsers = async () => {
    if (!auth.currentUser) return;

    try {
      setLoading(true);
      const users = await getBlockedUsers(auth.currentUser.uid);
      setBlockedUsers(users);
    } catch (error) {
      console.error('Error loading blocked users:', error);
      Alert.alert('Error', 'Failed to load blocked accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = useCallback(async (blockedUserId: string, username: string) => {
    if (!auth.currentUser) return;

    Alert.alert(
      'Unblock User',
      `Unblock @${username}? They will be able to see your posts and follow you.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          style: 'destructive',
          onPress: async () => {
            try {
              setUnblocking(blockedUserId);
              await unblockUser(auth.currentUser!.uid, blockedUserId);
              setBlockedUsers((prev) =>
                prev.filter((user) => user.blockedUserId !== blockedUserId)
              );
            } catch (error) {
              console.error('Error unblocking user:', error);
              Alert.alert('Error', 'Failed to unblock user');
            } finally {
              setUnblocking(null);
            }
          },
        },
      ]
    );
  }, []);

  const renderBlockedUser = ({ item }: { item: BlockedUser }) => {
    const isUnblocking = unblocking === item.blockedUserId;

    return (
      <View style={styles.userItem}>
        <TouchableOpacity
          style={styles.userInfo}
          onPress={() => router.push(`/user/${item.blockedUserId}` as any)}
        >
          {item.blockedUserImage ? (
            <Image
              source={{ uri: item.blockedUserImage }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {item.blockedUsername.slice(0, 2).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.userDetails}>
            <Text style={styles.username}>{item.blockedUsername}</Text>
            <Text style={styles.blockedText}>Blocked</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.unblockButton}
          onPress={() => handleUnblock(item.blockedUserId, item.blockedUsername)}
          disabled={isUnblocking}
        >
          {isUnblocking ? (
            <ActivityIndicator size="small" color="#0095f6" />
          ) : (
            <Text style={styles.unblockButtonText}>Unblock</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { backgroundColor: colors.backgroundWhite, borderBottomColor: colors.borderLight }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Blocked Accounts</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.textPrimary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.backgroundWhite, borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Blocked Accounts</Text>
        <View style={styles.placeholder} />
      </View>

      {blockedUsers.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="ban-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Blocked Accounts</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            When you block someone, they won't be able to see your posts or contact you.
          </Text>
        </View>
      ) : (
        <FlatList
          data={blockedUsers}
          renderItem={renderBlockedUser}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
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
  placeholder: {
    width: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingVertical: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
    marginBottom: 2,
  },
  blockedText: {
    fontSize: 13,
    color: '#8E8E8E',
  },
  unblockButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBDBDB',
    minWidth: 80,
    alignItems: 'center',
  },
  unblockButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#262626',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E8E',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
