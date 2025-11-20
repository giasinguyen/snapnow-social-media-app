import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { auth } from '../../config/firebase';
import { Conversation, getConversation } from '../../services/conversations';
import { joinGroupViaLink } from '../../services/groupChats';
import { UserService } from '../../services/user';

export default function JoinGroupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id: conversationId } = params;

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [alreadyMember, setAlreadyMember] = useState(false);

  useEffect(() => {
    loadGroupInfo();
  }, [conversationId]);

  const loadGroupInfo = async () => {
    try {
      setLoading(true);
      const conv = await getConversation(conversationId as string);
      
      if (!conv) {
        setError('Group not found');
        return;
      }

      if (!conv.isGroupChat) {
        setError('This is not a group chat');
        return;
      }

      setConversation(conv);

      // Check if user is already a member
      const currentUserId = auth.currentUser?.uid;
      if (currentUserId && conv.participants?.includes(currentUserId)) {
        setAlreadyMember(true);
      }
    } catch (err: any) {
      console.error('Error loading group info:', err);
      setError(err.message || 'Failed to load group information');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    try {
      setJoining(true);
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        Alert.alert('Not Logged In', 'Please log in to join the group');
        router.push('/auth/login' as any);
        return;
      }

      // Get current user details
      const userProfile = await UserService.getUserProfile(currentUser.uid);
      
      if (!userProfile) {
        throw new Error('Could not load your profile');
      }
      
      await joinGroupViaLink(conversationId as string, currentUser.uid, {
        displayName: userProfile.displayName,
        photoURL: userProfile.profileImage || '',
        username: userProfile.username,
      });

      Alert.alert('Success', 'You joined the group!', [
        {
          text: 'OK',
          onPress: () => {
            router.push({
              pathname: '/messages/[conversationId]' as any,
              params: { conversationId },
            });
          },
        },
      ]);
    } catch (err: any) {
      console.error('Error joining group:', err);
      Alert.alert('Error', err.message || 'Failed to join group');
    } finally {
      setJoining(false);
    }
  };

  const handleOpenChat = () => {
    router.push({
      pathname: '/messages/[conversationId]' as any,
      params: { conversationId },
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text style={styles.errorTitle}>Oops!</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.content}>
        <Image
          source={{ uri: conversation?.groupPhoto || 'https://via.placeholder.com/120' }}
          style={styles.groupImage}
        />
        
        <Text style={styles.groupName}>{conversation?.groupName || 'Group Chat'}</Text>
        
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="people" size={20} color="#6b7280" />
            <Text style={styles.infoText}>
              {conversation?.participants?.length || 0} members
            </Text>
          </View>
        </View>

        {alreadyMember ? (
          <>
            <Text style={styles.alreadyMemberText}>You're already a member of this group</Text>
            <TouchableOpacity
              style={styles.joinButton}
              onPress={handleOpenChat}
            >
              <Text style={styles.joinButtonText}>Open Chat</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.inviteText}>You've been invited to join this group</Text>
            <TouchableOpacity
              style={styles.joinButton}
              onPress={handleJoinGroup}
              disabled={joining}
            >
              {joining ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.joinButtonText}>Join Group</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  groupImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 24,
    backgroundColor: '#f3f4f6',
  },
  groupName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  infoText: {
    fontSize: 16,
    color: '#6b7280',
  },
  inviteText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  alreadyMemberText: {
    fontSize: 16,
    color: '#3b82f6',
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: '500',
  },
  joinButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6b7280',
  },
  backButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: '#3b82f6',
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});
