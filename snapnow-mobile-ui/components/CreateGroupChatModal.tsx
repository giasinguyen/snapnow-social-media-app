import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query, where, limit, getDoc, doc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { createGroupChat } from '../services/groupChats';
import { getFollowing } from '../services/follow';

interface User {
  id: string;
  username: string;
  displayName: string;
  profileImage?: string;
}

interface CreateGroupChatModalProps {
  visible: boolean;
  onClose: () => void;
  onGroupCreated: (groupId: string) => void;
  initialSelectedUserIds?: string[];
}

export default function CreateGroupChatModal({
  visible,
  onClose,
  onGroupCreated,
  initialSelectedUserIds,
}: CreateGroupChatModalProps) {
  const [step, setStep] = useState<'members' | 'details'>('members');
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [followingUsers, setFollowingUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const currentUser = auth.currentUser;

  // Load following users when modal opens
  useEffect(() => {
    const loadFollowingUsers = async () => {
      if (!visible || !currentUser?.uid) return;

      try {
        setLoading(true);
        const followingIds = await getFollowing(currentUser.uid);
        
        // Fetch user details for each following ID
        const userPromises = followingIds.map(async (userId) => {
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            return {
              id: userDoc.id,
              ...userDoc.data(),
            } as User;
          }
          return null;
        });

        const usersData = await Promise.all(userPromises);
        const validUsers = usersData.filter((u): u is User => u !== null);
        setFollowingUsers(validUsers);
        setUsers(validUsers); // Show following users by default
        // If caller provided initial selected IDs (e.g. preselect a user from Conversation Details), pre-select them
        if (initialSelectedUserIds && initialSelectedUserIds.length > 0) {
          // Find users from following list first
          const selectedFromFollowing = validUsers.filter(u => initialSelectedUserIds.includes(u.id));
          const missingIds = initialSelectedUserIds.filter(id => !selectedFromFollowing.some(u => u.id === id));
          const missingPromises = missingIds.map(async (id) => {
            try {
              const userDoc = await getDoc(doc(db, 'users', id));
              if (userDoc.exists()) {
                return { id: userDoc.id, ...userDoc.data() } as User;
              }
            } catch (err) {
              // ignore
            }
            return null;
          });

          const missingUsers = (await Promise.all(missingPromises)).filter((u): u is User => !!u);
          setSelectedUsers([...selectedFromFollowing, ...missingUsers]);
        }
      } catch (error) {
        console.error('Error loading following users:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFollowingUsers();
  }, [visible, currentUser?.uid]);

  // Search users
  const searchUsers = useCallback(async (searchText: string) => {
    if (!searchText.trim() || searchText.length < 2) {
      // Show following users when search is empty
      setUsers(followingUsers);
      return;
    }

    try {
      setLoading(true);
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('username', '>=', searchText.toLowerCase()),
        where('username', '<=', searchText.toLowerCase() + '\uf8ff'),
        limit(20)
      );

      const snapshot = await getDocs(q);
      const foundUsers = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((user: any) => user.id !== currentUser?.uid) as User[];

      // Combine search results with following users (prioritize following)
      const followingIds = new Set(followingUsers.map(u => u.id));
      const searchUserIds = new Set(foundUsers.map(u => u.id));
      
      // Add following users that match search but weren't in results
      const matchingFollowing = followingUsers.filter(u => 
        u.username?.toLowerCase().includes(searchText.toLowerCase()) ||
        u.displayName?.toLowerCase().includes(searchText.toLowerCase())
      );
      
      // Combine: following users first, then other search results
      const combinedUsers = [
        ...matchingFollowing,
        ...foundUsers.filter(u => !followingIds.has(u.id))
      ];

      setUsers(combinedUsers);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid, followingUsers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, searchUsers]);

  const toggleUserSelection = (user: User) => {
    if (selectedUsers.find((u) => u.id === user.id)) {
      setSelectedUsers(selectedUsers.filter((u) => u.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleNext = () => {
    if (selectedUsers.length === 0) {
      Alert.alert('Error', 'Please select at least one member');
      return;
    }
    setStep('details');
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    if (selectedUsers.length === 0) {
      Alert.alert('Error', 'Please select at least one member');
      return;
    }

    try {
      setCreating(true);

      const group = await createGroupChat({
        creatorId: currentUser!.uid,
        creatorName: currentUser!.displayName || currentUser!.email || 'User',
        creatorPhoto: currentUser!.photoURL || '',
        creatorUsername: currentUser!.email?.split('@')[0] || 'user',
        groupName: groupName.trim(),
        participantIds: selectedUsers.map((u) => u.id),
      });

      onGroupCreated(group.id);
      handleClose();
      Alert.alert('Success', 'Group created successfully');
    } catch (error: any) {
      console.error('Error creating group:', error);
      Alert.alert('Error', error.message || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setStep('members');
    setGroupName('');
    setSearchQuery('');
    setUsers([]);
    setSelectedUsers([]);
    onClose();
  };

  const renderMemberStep = () => (
    <>
      {/* Selected Members */}
      {selectedUsers.length > 0 && (
        <View style={styles.selectedContainer}>
          <Text style={styles.selectedLabel}>
            Selected ({selectedUsers.length})
          </Text>
          <FlatList
            horizontal
            data={selectedUsers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.selectedChip}>
                <Image
                  source={{
                    uri: item.profileImage || 'https://via.placeholder.com/32',
                  }}
                  style={styles.selectedAvatar}
                />
                <Text style={styles.selectedName} numberOfLines={1}>
                  {item.displayName}
                </Text>
                <TouchableOpacity
                  onPress={() => toggleUserSelection(item)}
                  style={styles.removeButton}
                >
                  <Ionicons name="close-circle" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          />
        </View>
      )}

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9ca3af" />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search users by username..."
          placeholderTextColor="#9ca3af"
          style={styles.searchInput}
        />
      </View>

      {/* User List */}
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isSelected = !!selectedUsers.find((u) => u.id === item.id);
          const isFollowing = followingUsers.some((u) => u.id === item.id);
          return (
            <TouchableOpacity
              onPress={() => toggleUserSelection(item)}
              style={styles.userItem}
            >
              <Image
                source={{
                  uri: item.profileImage || 'https://via.placeholder.com/48',
                }}
                style={styles.userAvatar}
              />
              <View style={styles.userInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.userName}>{item.displayName}</Text>
                  {isFollowing && (
                    <View style={styles.followingBadge}>
                      <Text style={styles.followingBadgeText}>Following</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.userUsername}>@{item.username}</Text>
              </View>
              <View
                style={[
                  styles.checkbox,
                  isSelected && styles.checkboxSelected,
                ]}
              >
                {isSelected && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            {loading ? (
              <ActivityIndicator size="large" color="#3b82f6" />
            ) : (
              <>
                <Ionicons name="people-outline" size={64} color="#d1d5db" />
                <Text style={styles.emptyText}>
                  {searchQuery.length < 2
                    ? followingUsers.length > 0 
                      ? 'People you follow will appear here. Search to find more users.'
                      : 'Type at least 2 characters to search'
                    : 'No users found'}
                </Text>
              </>
            )}
          </View>
        }
      />
    </>
  );

  const renderDetailsStep = () => (
    <>
      <View style={styles.detailsContainer}>
        <Text style={styles.label}>Group Name</Text>
        <TextInput
          value={groupName}
          onChangeText={setGroupName}
          placeholder="Enter group name..."
          placeholderTextColor="#9ca3af"
          style={styles.input}
          maxLength={50}
          autoFocus
        />
        <Text style={styles.charCount}>{groupName.length}/50</Text>

        <Text style={styles.label}>Members ({selectedUsers.length})</Text>
        <FlatList
          data={selectedUsers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.memberItem}>
              <Image
                source={{
                  uri: item.profileImage || 'https://via.placeholder.com/40',
                }}
                style={styles.memberAvatar}
              />
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{item.displayName}</Text>
                <Text style={styles.memberUsername}>@{item.username}</Text>
              </View>
            </View>
          )}
          style={{ maxHeight: 200 }}
        />
      </View>
    </>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
            <Text style={styles.title}>
              {step === 'members' ? 'Add Members' : 'Group Details'}
            </Text>
            {step === 'members' ? (
              <TouchableOpacity
                onPress={handleNext}
                disabled={selectedUsers.length === 0}
              >
                <Text
                  style={[
                    styles.nextButton,
                    selectedUsers.length === 0 && styles.nextButtonDisabled,
                  ]}
                >
                  Next
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleCreateGroup} disabled={creating}>
                {creating ? (
                  <ActivityIndicator size="small" color="#3b82f6" />
                ) : (
                  <Text style={styles.createButton}>Create</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Content */}
          {step === 'members' ? renderMemberStep() : renderDetailsStep()}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingTop: 50,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  nextButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  nextButtonDisabled: {
    color: '#9ca3af',
  },
  createButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  selectedContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  selectedLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  selectedAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 6,
  },
  selectedName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    maxWidth: 100,
  },
  removeButton: {
    marginLeft: 6,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    margin: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  followingBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  followingBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3b82f6',
  },
  userUsername: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
    textAlign: 'center',
  },
  detailsContainer: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  charCount: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 4,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  memberUsername: {
    fontSize: 12,
    color: '#6b7280',
  },
});
