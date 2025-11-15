import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../../config/firebase';
import {
    acceptFollowRequest,
    getPendingFollowRequests,
    rejectFollowRequest,
    type FollowRequest,
} from '../../services/followRequests';

export default function FollowRequestsScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState<FollowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const pendingRequests = await getPendingFollowRequests(userId);
      setRequests(pendingRequests);
    } catch (error) {
      console.error('Error loading follow requests:', error);
      Alert.alert('Error', 'Failed to load follow requests');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const handleAccept = async (request: FollowRequest) => {
    try {
      setProcessingIds(prev => new Set(prev).add(request.id));
      
      await acceptFollowRequest(
        request.id,
        request.fromUserId,
        request.toUserId,
        request.fromUsername,
        request.fromProfileImage
      );

      // Remove from local state
      setRequests(prev => prev.filter(r => r.id !== request.id));
    } catch (error) {
      console.error('Error accepting follow request:', error);
      Alert.alert('Error', 'Failed to accept follow request');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(request.id);
        return next;
      });
    }
  };

  const handleReject = async (request: FollowRequest) => {
    try {
      setProcessingIds(prev => new Set(prev).add(request.id));
      
      await rejectFollowRequest(request.id);

      // Remove from local state
      setRequests(prev => prev.filter(r => r.id !== request.id));
    } catch (error) {
      console.error('Error rejecting follow request:', error);
      Alert.alert('Error', 'Failed to reject follow request');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(request.id);
        return next;
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#262626" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Follow Requests</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0095F6" />
        </View>
      ) : requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="#DBDBDB" />
          <Text style={styles.emptyTitle}>No Follow Requests</Text>
          <Text style={styles.emptySubtitle}>
            When someone requests to follow you, you'll see them here.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {requests.map((request) => (
            <View key={request.id} style={styles.requestItem}>
              <TouchableOpacity
                style={styles.userInfo}
                onPress={() => router.push(`/user/${request.fromUserId}`)}
              >
                <Image
                  source={{
                    uri: request.fromProfileImage || 'https://via.placeholder.com/50',
                  }}
                  style={styles.avatar}
                />
                <View style={styles.userDetails}>
                  <Text style={styles.username}>{request.fromUsername}</Text>
                  <Text style={styles.timestamp}>
                    {getTimeAgo(request.createdAt)}
                  </Text>
                </View>
              </TouchableOpacity>

              {processingIds.has(request.id) ? (
                <ActivityIndicator size="small" color="#0095F6" />
              ) : (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => handleAccept(request)}
                  >
                    <Text style={styles.acceptButtonText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => handleReject(request)}
                  >
                    <Text style={styles.rejectButtonText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return `${Math.floor(diffInSeconds / 604800)}w ago`;
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
    borderBottomWidth: 0.5,
    borderBottomColor: '#DBDBDB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#262626',
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
    color: '#262626',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E8E',
    textAlign: 'center',
    marginTop: 8,
  },
  scrollView: {
    flex: 1,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EFEFEF',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
  },
  timestamp: {
    fontSize: 12,
    color: '#8E8E8E',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#0095F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: '#EFEFEF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  rejectButtonText: {
    color: '#262626',
    fontSize: 14,
    fontWeight: '600',
  },
});
