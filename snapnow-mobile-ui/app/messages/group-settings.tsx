import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../config/firebase';
import { useTheme } from '../../contexts/ThemeContext';
import {
    approveJoinRequest,
    makeGroupAdmin,
    rejectJoinRequest,
    removeGroupAdmin,
    removeParticipantFromGroup,
    toggleGroupApprovalRequired
} from '../../services/groupChats';

interface JoinRequest {
  userId: string;
  displayName: string;
  photoURL: string;
  username: string;
  requestedAt: any;
}

interface ParticipantInfo {
  id: string;
  displayName: string;
  photoURL: string;
  username: string;
  isAdmin: boolean;
}

export default function GroupSettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { conversationId } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [requireApproval, setRequireApproval] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<JoinRequest[]>([]);
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const [admins, setAdmins] = useState<string[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedMember, setSelectedMember] = useState<ParticipantInfo | null>(null);
  const [showMemberOptionsModal, setShowMemberOptionsModal] = useState(false);

  useEffect(() => {
    if (!conversationId) return;

    const conversationRef = doc(db, 'conversations', conversationId as string);
    const unsubscribe = onSnapshot(conversationRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const currentUserId = auth.currentUser?.uid;

        // Check if current user is admin
        const adminsList = data.admins || [];
        setAdmins(adminsList);
        setIsAdmin(adminsList.includes(currentUserId));
        setIsCreator(data.createdBy === currentUserId);
        
        // Get approval setting
        setRequireApproval(data.requireApproval || false);
        
        // Get pending requests
        setPendingRequests(data.pendingRequests || []);
        
        // Fetch fresh user data for all participants
        const { UserService } = require('../../services/user');
        const participantsList: ParticipantInfo[] = [];
        
        for (const participantId of (data.participants || [])) {
          try {
            const userProfile = await UserService.getUserProfile(participantId);
            if (userProfile) {
              participantsList.push({
                id: participantId,
                displayName: userProfile.displayName || userProfile.username || 'Unknown',
                photoURL: userProfile.profileImage || userProfile.photoURL || '',
                username: userProfile.username || '',
                isAdmin: adminsList.includes(participantId),
              });
            }
          } catch (error) {
            console.error(`Error fetching user ${participantId}:`, error);
            // Fallback to cached data if fresh fetch fails
            const details = data.participantDetails?.[participantId];
            if (details) {
              participantsList.push({
                id: participantId,
                displayName: details.displayName || 'Unknown',
                photoURL: details.photoURL || '',
                username: details.username || '',
                isAdmin: adminsList.includes(participantId),
              });
            }
          }
        }
        
        setParticipants(participantsList);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [conversationId]);

  const handleToggleApproval = async (value: boolean) => {
    try {
      setRequireApproval(value);
      await toggleGroupApprovalRequired(
        conversationId as string,
        auth.currentUser?.uid!,
        value
      );
      showSuccess(
        value
          ? 'Join approval enabled. New members must be approved by admins.'
          : 'Join approval disabled. Anyone with the link can join.'
      );
    } catch (error: any) {
      console.error('Error toggling approval:', error);
      setRequireApproval(!value); // Revert on error
      alert(error.message || 'Failed to update setting');
    }
  };

  const handleApproveRequest = async (userId: string) => {
    try {
      await approveJoinRequest(
        conversationId as string,
        userId,
        auth.currentUser?.uid!
      );
      showSuccess('Join request approved');
    } catch (error: any) {
      console.error('Error approving request:', error);
      alert(error.message || 'Failed to approve request');
    }
  };

  const handleRejectRequest = async (userId: string) => {
    try {
      await rejectJoinRequest(
        conversationId as string,
        userId,
        auth.currentUser?.uid!
      );
      showSuccess('Join request rejected');
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      alert(error.message || 'Failed to reject request');
    }
  };

  const handleMemberPress = (member: ParticipantInfo) => {
    setSelectedMember(member);
    setShowMemberOptionsModal(true);
  };

  const handleMakeAdmin = async () => {
    if (!selectedMember) return;
    
    try {
      await makeGroupAdmin(
        conversationId as string,
        selectedMember.id,
        auth.currentUser?.uid!
      );
      setShowMemberOptionsModal(false);
      showSuccess(`${selectedMember.displayName} is now an admin`);
    } catch (error: any) {
      console.error('Error making admin:', error);
      alert(error.message || 'Failed to make admin');
    }
  };

  const handleRemoveAdmin = async () => {
    if (!selectedMember) return;
    
    try {
      await removeGroupAdmin(
        conversationId as string,
        selectedMember.id,
        auth.currentUser?.uid!
      );
      setShowMemberOptionsModal(false);
      showSuccess(`${selectedMember.displayName} is no longer an admin`);
    } catch (error: any) {
      console.error('Error removing admin:', error);
      alert(error.message || 'Failed to remove admin');
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedMember) return;
    
    try {
      await removeParticipantFromGroup(
        conversationId as string,
        selectedMember.id,
        auth.currentUser?.uid!
      );
      setShowMemberOptionsModal(false);
      showSuccess(`${selectedMember.displayName} was removed from the group`);
    } catch (error: any) {
      console.error('Error removing member:', error);
      alert(error.message || 'Failed to remove member');
    }
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessModal(true);
    setTimeout(() => setShowSuccessModal(false), 2500);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.blue} />
        </View>
      </SafeAreaView>
    );
  }

  if (!isAdmin) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.backgroundWhite, borderBottomColor: colors.borderLight }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Group Settings</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centerContainer}>
          <Ionicons name="lock-closed-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.noAccessText, { color: colors.textPrimary }]}>
            Only admins can access group settings
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content}>
        {/* Join Approval Setting */}
        <View style={[styles.section, { backgroundColor: colors.backgroundWhite }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Membership</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="checkmark-circle-outline" size={24} color={colors.textPrimary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
                  Require Admin Approval
                </Text>
                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                  New members added by non-admins must be approved
                </Text>
              </View>
            </View>
            <Switch
              value={requireApproval}
              onValueChange={handleToggleApproval}
              trackColor={{ false: colors.borderLight, true: '#fc872780' }}
              thumbColor={requireApproval ? '#fc8727ff' : colors.backgroundGray}
            />
          </View>
        </View>

        {/* Pending Join Requests */}
        {requireApproval && pendingRequests.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.backgroundWhite }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Pending Requests ({pendingRequests.length})
            </Text>
            
            {pendingRequests.map((request) => (
              <View key={request.userId} style={styles.requestItem}>
                <Image
                  source={{ uri: request.photoURL || 'https://via.placeholder.com/50' }}
                  style={styles.requestAvatar}
                />
                <View style={styles.requestInfo}>
                  <Text style={[styles.requestName, { color: colors.textPrimary }]}>
                    {request.displayName}
                  </Text>
                  <Text style={[styles.requestUsername, { color: colors.textSecondary }]}>
                    @{request.username}
                  </Text>
                </View>
                <View style={styles.requestActions}>
                  <TouchableOpacity
                    style={[styles.approveButton, { backgroundColor: '#fc8727ff' }]}
                    onPress={() => handleApproveRequest(request.userId)}
                  >
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.rejectButton, { backgroundColor: colors.backgroundGray }]}
                    onPress={() => handleRejectRequest(request.userId)}
                  >
                    <Ionicons name="close" size={20} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Member Management */}
        <View style={[styles.section, { backgroundColor: colors.backgroundWhite }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Manage Members ({participants.length})
          </Text>
          
          {participants.map((member) => {
            const isCurrentUser = member.id === auth.currentUser?.uid;
            return (
              <TouchableOpacity
                key={member.id}
                style={styles.memberItem}
                onPress={() => !isCurrentUser && handleMemberPress(member)}
                disabled={isCurrentUser}
              >
                <Image
                  source={{ uri: member.photoURL || 'https://via.placeholder.com/50' }}
                  style={styles.memberAvatar}
                />
                <View style={styles.memberInfo}>
                  <View style={styles.memberNameRow}>
                    <Text style={[styles.memberName, { color: colors.textPrimary }]}>
                      {member.displayName}{isCurrentUser ? ' (You)' : ''}
                    </Text>
                    {member.isAdmin && (
                      <View style={[styles.adminBadge, { backgroundColor: '#fc872710' }]}>
                        <Text style={styles.adminBadgeText}>Admin</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.memberUsername, { color: colors.textSecondary }]}>
                    @{member.username}
                  </Text>
                </View>
                {!isCurrentUser && (
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Member Options Modal */}
      <Modal
        visible={showMemberOptionsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMemberOptionsModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowMemberOptionsModal(false)}
        >
          <View style={[styles.optionsCard, { backgroundColor: colors.backgroundWhite }]}>
            <View style={styles.optionsHeader}>
              <Image
                source={{ uri: selectedMember?.photoURL || 'https://via.placeholder.com/50' }}
                style={styles.optionsAvatar}
              />
              <View style={styles.optionsHeaderText}>
                <Text style={[styles.optionsName, { color: colors.textPrimary }]}>
                  {selectedMember?.displayName}
                </Text>
                <Text style={[styles.optionsUsername, { color: colors.textSecondary }]}>
                  @{selectedMember?.username}
                </Text>
              </View>
            </View>

            {selectedMember && !selectedMember.isAdmin && (
              <TouchableOpacity
                style={styles.optionItem}
                onPress={handleMakeAdmin}
              >
                <Ionicons name="shield-checkmark-outline" size={24} color={colors.textPrimary} />
                <Text style={[styles.optionText, { color: colors.textPrimary }]}>
                  Make Admin
                </Text>
              </TouchableOpacity>
            )}

            {selectedMember && selectedMember.isAdmin && isCreator && (
              <TouchableOpacity
                style={styles.optionItem}
                onPress={handleRemoveAdmin}
              >
                <Ionicons name="shield-outline" size={24} color={colors.textPrimary} />
                <Text style={[styles.optionText, { color: colors.textPrimary }]}>
                  Remove Admin
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.optionItem}
              onPress={handleRemoveMember}
            >
              <Ionicons name="person-remove-outline" size={24} color="#ED4956" />
              <Text style={[styles.optionText, { color: '#ED4956' }]}>
                Remove from Group
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionItem, styles.cancelOption]}
              onPress={() => setShowMemberOptionsModal(false)}
            >
              <Text style={[styles.optionText, { color: colors.textPrimary, fontWeight: '600' }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Success Notification Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.successModalOverlay}>
          <View style={[styles.successCard, { backgroundColor: colors.backgroundWhite }]}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={48} color="#fc8727ff" />
            </View>
            <Text style={[styles.successText, { color: colors.textPrimary }]}>
              {successMessage}
            </Text>
          </View>
        </View>
      </Modal>
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
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  noAccessText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
  },
  requestAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  requestInfo: {
    flex: 1,
    marginLeft: 12,
  },
  requestName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  requestUsername: {
    fontSize: 13,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  approveButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    marginRight: 8,
  },
  memberUsername: {
    fontSize: 13,
  },
  adminBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fc8727ff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  optionsCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
  },
  optionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  optionsAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  optionsHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  optionsName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionsUsername: {
    fontSize: 14,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  optionText: {
    fontSize: 16,
    marginLeft: 12,
  },
  cancelOption: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
    justifyContent: 'center',
  },
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  successCard: {
    width: '100%',
    maxWidth: 300,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  successIconContainer: {
    marginBottom: 16,
  },
  successText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
});
