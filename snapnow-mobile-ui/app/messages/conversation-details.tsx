import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { auth, db } from '../../config/firebase';
import { uploadToCloudinary } from '../../services/cloudinary';
import { Conversation, getConversation } from '../../services/conversations';
import { addParticipantToGroup, updateGroupDetails } from '../../services/groupChats';
import { UserService } from '../../services/user';
import { User } from '../../types';

export default function ConversationDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const {
    conversationId,
    otherUserId,
    otherUserName,
    otherUserPhoto,
    otherUserUsername,
  } = params;

  const [user, setUser] = useState<User | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isGroupChat, setIsGroupChat] = useState(false);
  const [participants, setParticipants] = useState<User[]>([]);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  const [nickname, setNickname] = useState<string>('');
  const [mediaImages, setMediaImages] = useState<string[]>([]);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showChangeGroupModal, setShowChangeGroupModal] = useState(false);
  const [showAddPeopleModal, setShowAddPeopleModal] = useState(false);
  const [showViewPeopleModal, setShowViewPeopleModal] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState('');
  const [groupPhotoUri, setGroupPhotoUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [showInviteLinkModal, setShowInviteLinkModal] = useState(false);
  const [otherUserRealtime, setOtherUserRealtime] = useState<{ displayName: string; photoURL: string; username: string } | null>(null);
  const [participantsInfo, setParticipantsInfo] = useState<Map<string, { displayName: string; username: string; photoURL: string }>>(new Map());
  const participantSubscriptions = React.useRef<Map<string, () => void>>(new Map());

  useEffect(() => {
    loadConversationData();
    loadUserDetails();
    loadMediaImages();
  }, [otherUserId, conversationId]);

  // Subscribe to real-time updates for other user's profile (1-on-1 chats only)
  useEffect(() => {
    if (!otherUserId || isGroupChat) return;

    const userDocRef = doc(db, 'users', otherUserId as string);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        setOtherUserRealtime({
          displayName: userData.displayName || 'Unknown User',
          photoURL: userData.profileImage || userData.photoURL || 'https://via.placeholder.com/100',
          username: userData.username || '',
        });
      }
    });

    return () => unsubscribe();
  }, [otherUserId, isGroupChat]);

  // Subscribe to real-time updates for group chat participants
  useEffect(() => {
    if (!isGroupChat || !conversation?.participants) return;

    // Subscribe to all participants including current user
    conversation.participants.forEach(participantId => {
      // Skip if already subscribed
      if (participantSubscriptions.current.has(participantId)) return;
      
      const userDocRef = doc(db, 'users', participantId);
      const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setParticipantsInfo(prev => {
            const newMap = new Map(prev);
            newMap.set(participantId, {
              displayName: userData.displayName || 'Unknown User',
              username: userData.username || 'unknown',
              photoURL: userData.profileImage || userData.photoURL || 'https://via.placeholder.com/48',
            });
            return newMap;
          });
        }
      }, (error) => {
        console.error('Error subscribing to participant profile:', participantId, error);
      });
      
      participantSubscriptions.current.set(participantId, unsubscribe);
    });

    return () => {
      participantSubscriptions.current.forEach(unsub => unsub());
      participantSubscriptions.current.clear();
    };
  }, [isGroupChat, conversation?.participants]);

  const loadConversationData = async () => {
    if (!conversationId) return;
    try {
      const conv = await getConversation(conversationId as string);
      setConversation(conv);
      setIsGroupChat(conv?.isGroupChat || false);
      
      // If group chat, load all participants
      if (conv?.isGroupChat && conv.participants) {
        const currentUserId = auth.currentUser?.uid;
        const participantUsers = await Promise.all(
          conv.participants
            .filter(id => id !== currentUserId)
            .map(id => UserService.getUserProfile(id))
        );
        setParticipants(participantUsers.filter(Boolean) as User[]);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const loadUserDetails = async () => {
    if (!otherUserId) return;
    try {
      const userData = await UserService.getUserProfile(otherUserId as string);
      setUser(userData);
    } catch (error) {
      console.error('Error loading user details:', error);
    }
  };

  const loadMediaImages = async () => {
    if (!conversationId) {
      console.log('No conversationId');
      return;
    }
    try {
      console.log('Loading media for conversation:', conversationId);
      const { getMessages } = require('../../services/messages');
      const { messages } = await getMessages(conversationId as string, 500);
      console.log('Total messages loaded:', messages.length);
      
      const images = messages
        .filter((msg: any) => {
          console.log('Message type:', msg.type, 'has imageUrl:', !!msg.imageUrl);
          return msg.type === 'image' && msg.imageUrl;
        })
        .map((msg: any) => msg.imageUrl);
      
      console.log('Found images:', images.length);
      console.log('Image URLs:', images);
      setMediaImages(images);
    } catch (error) {
      console.error('Error loading media:', error);
    }
  };

  const handleViewProfile = () => {
    router.push(`/user/${otherUserId}` as any);
  };

  const handleMuteConversation = () => {
    Alert.alert(
      'Mute Conversation',
      `Mute notifications for ${otherUserName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mute',
          onPress: () => {
            Alert.alert('Success', 'Conversation muted');
          },
        },
      ]
    );
  };

  const handleViewMedia = () => {
    console.log('📸 Opening media modal, reloading images...');
    loadMediaImages(); // Reload images when opening modal
    setShowMediaModal(true);
  };

  const handleOptions = () => {
    setShowOptionsModal(true);
  };

  const handleBlockUser = async () => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${otherUserName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              const { blockUser } = require('../../services/blocking');
              const { auth } = require('../../config/firebase');
              await blockUser(auth.currentUser?.uid, otherUserId as string);
              Alert.alert('Success', 'User blocked');
              setShowOptionsModal(false);
              router.back();
            } catch (error) {
              console.error('Error blocking user:', error);
              Alert.alert('Error', 'Failed to block user');
            }
          },
        },
      ]
    );
  };

  const handleDeleteChat = async () => {
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to delete this conversation? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { deleteConversation } = require('../../services/conversations');
              await deleteConversation(conversationId as string);
              Alert.alert('Success', 'Conversation deleted');
              setShowOptionsModal(false);
              router.back();
              router.back(); // Go back twice to return to messages list
            } catch (error) {
              console.error('Error deleting conversation:', error);
              Alert.alert('Error', 'Failed to delete conversation');
            }
          },
        },
      ]
    );
  };

  const handleShowConversationId = () => {
    Alert.alert('Conversation ID', conversationId as string, [
      {
        text: 'Copy',
        onPress: () => {
          // In a real app, you'd use Clipboard API
          Alert.alert('Copied', 'Conversation ID copied to clipboard');
        },
      },
      { text: 'OK' },
    ]);
  };

  const handleChangeTheme = () => {
    Alert.alert('Change Theme', 'Choose a chat background theme', [
      { text: 'Default', onPress: () => {} },
      { text: 'Gradient Purple', onPress: () => {} },
      { text: 'Gradient Blue', onPress: () => {} },
      { text: 'Dark', onPress: () => {} },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleChangeNickname = () => {
    setNicknameInput('');
    setShowNicknameModal(true);
  };

  const saveNickname = () => {
    if (nicknameInput.trim()) {
      setNickname(nicknameInput);
      setShowNicknameModal(false);
      setNicknameInput('');
    }
  };

  const handleChangeGroupNameImage = () => {
    setGroupNameInput(conversation?.groupName || '');
    setGroupPhotoUri(conversation?.groupPhoto || null);
    setShowChangeGroupModal(true);
  };

  const handlePickGroupImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setGroupPhotoUri(result.assets[0].uri);
    }
  };

  const handleSaveGroupChanges = async () => {
    if (!groupNameInput.trim()) {
      Alert.alert('Error', 'Group name cannot be empty');
      return;
    }

    try {
      setIsUploading(true);
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) throw new Error('Not authenticated');

      let photoUrl = conversation?.groupPhoto || '';

      // Upload new photo if changed
      if (groupPhotoUri && groupPhotoUri !== conversation?.groupPhoto) {
        const uploadResult = await uploadToCloudinary(groupPhotoUri, {
          folder: 'group_avatars',
        });
        photoUrl = uploadResult.secure_url;
      }

      await updateGroupDetails(conversationId as string, currentUserId, {
        groupName: groupNameInput,
        groupPhoto: photoUrl,
      });

      Alert.alert('Success', 'Group details updated');
      setShowChangeGroupModal(false);
      await loadConversationData();
    } catch (error: any) {
      console.error('Error updating group:', error);
      Alert.alert('Error', error.message || 'Failed to update group details');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddPeople = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUsers([]);
    setShowAddPeopleModal(true);
  };

  const handleSearchUsers = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const results = await UserService.searchUsers(query);
      // Filter out users already in the group
      const existingIds = conversation?.participants || [];
      const filtered = results.filter(u => !existingIds.includes(u.id));
      setSearchResults(filtered);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleUserSelection = (user: User) => {
    setSelectedUsers(prev => {
      const exists = prev.find(u => u.id === user.id);
      if (exists) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleAddSelectedUsers = async () => {
    if (selectedUsers.length === 0) {
      Alert.alert('Error', 'Please select at least one user');
      return;
    }

    try {
      setIsUploading(true);
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) throw new Error('Not authenticated');

      // Add each user to the group
      for (const user of selectedUsers) {
        await addParticipantToGroup(conversationId as string, user.id, {
          displayName: user.displayName,
          photoURL: user.profileImage || '',
          username: user.username,
        });
      }

      Alert.alert('Success', `Added ${selectedUsers.length} user(s) to the group`);
      setShowAddPeopleModal(false);
      await loadConversationData();
    } catch (error: any) {
      console.error('Error adding users:', error);
      Alert.alert('Error', error.message || 'Failed to add users');
    } finally {
      setIsUploading(false);
    }
  };

  const handleViewPeople = () => {
    setShowViewPeopleModal(true);
  };

  const handleUserPress = (userId: string) => {
    setShowViewPeopleModal(false);
    router.push(`/user/${userId}` as any);
  };

  const handleLeaveGroup = () => {
    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              const { leaveGroupChat } = require('../../services/groupChats');
              const currentUserId = auth.currentUser?.uid;
              if (!currentUserId) throw new Error('Not authenticated');

              await leaveGroupChat(conversationId as string, currentUserId);
              Alert.alert('Success', 'You left the group');
              router.back();
              router.back(); // Go back to messages list
            } catch (error: any) {
              console.error('Error leaving group:', error);
              Alert.alert('Error', error.message || 'Failed to leave group');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User/Group Info */}
        <View style={styles.userSection}>
          {isGroupChat ? (
            // Group chat header
            <>
              <Image 
                source={{ uri: conversation?.groupPhoto || 'https://via.placeholder.com/100' }} 
                style={styles.avatar} 
              />
              <Text style={styles.userName}>
                {conversation?.groupName || 'Group Chat'}
              </Text>
              <TouchableOpacity onPress={handleChangeGroupNameImage}>
                <Text style={styles.changeNameLink}>Change name and image</Text>
              </TouchableOpacity>
            </>
          ) : (
            // 1-on-1 chat header
            <>
              {(otherUserRealtime?.photoURL || otherUserPhoto) ? (
                <Image source={{ uri: (otherUserRealtime?.photoURL || otherUserPhoto) as string }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>
                    {(otherUserRealtime?.displayName || otherUserName as string)?.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <Text style={styles.userName}>
                {nickname || otherUserRealtime?.displayName || (otherUserName as string)}
              </Text>
              {(otherUserRealtime?.username || otherUserUsername) && (
                <Text style={styles.username}>@{otherUserRealtime?.username || otherUserUsername}</Text>
              )}
            </>
          )}

          {/* Quick Action Buttons */}
          <View style={styles.actionButtons}>
            {isGroupChat ? (
              // Group chat actions
              <TouchableOpacity style={styles.actionButton} onPress={handleAddPeople}>
                <View style={styles.actionIcon}>
                  <Ionicons name="person-add-outline" size={24} color="#000000ff" />
                </View>
                <Text style={styles.actionLabel}>Add</Text>
              </TouchableOpacity>
            ) : (
              // 1-on-1 chat actions
              <TouchableOpacity style={styles.actionButton} onPress={handleViewProfile}>
                <View style={styles.actionIcon}>
                  <Ionicons name="person-outline" size={24} color="#000000ff" />
                </View>
                <Text style={styles.actionLabel}>Profile</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIcon}>
                <Ionicons name="search" size={24} color="#000000ff" />
              </View>
              <Text style={styles.actionLabel}>Search</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleMuteConversation}>
              <View style={styles.actionIcon}>
                <Ionicons name="notifications-off-outline" size={24} color="#000000ff" />
              </View>
              <Text style={styles.actionLabel}>Mute</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleOptions}>
              <View style={styles.actionIcon}>
                <Ionicons name="ellipsis-horizontal" size={24} color="#000000ff" />
              </View>
              <Text style={styles.actionLabel}>Options</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Theme */}
        <TouchableOpacity style={styles.menuItem} onPress={handleChangeTheme}>
          <View style={styles.menuLeft}>
            <View style={[styles.menuIcon, { backgroundColor: '#7C4DFF' }]}>
              <View style={styles.themeCircle} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>Theme</Text>
              <Text style={styles.menuSubtext}>Default</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Disappearing messages */}
        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuLeft}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="timer-outline" size={24} color="#000000ff" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>Disappearing messages</Text>
              <Text style={styles.menuSubtext}>Off</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Group-specific sections */}
        {isGroupChat && (
          <>
            {/* Invite link */}
            <TouchableOpacity style={styles.menuItem} onPress={() => setShowInviteLinkModal(true)}>
              <View style={styles.menuLeft}>
                <View style={styles.menuIconContainer}>
                  <Ionicons name="link-outline" size={24} color="#000000ff" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuText}>Invite link</Text>
                  <Text style={styles.menuSubtext}>snapnow.app/group/{conversationId?.slice(0, 8)}</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* People section */}
            <TouchableOpacity style={styles.menuItem} onPress={handleViewPeople}>
              <View style={styles.menuLeft}>
                <View style={styles.menuIconContainer}>
                  <Ionicons name="people-outline" size={24} color="#000000ff" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuText}>People</Text>
                  {participants.length > 0 && (
                    <Text style={styles.menuSubtext}>{participants[0].username}</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          </>
        )}

        {/* Privacy & safety */}
        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuLeft}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="lock-closed-outline" size={24} color="#000000ff" />
            </View>
            <Text style={styles.menuText}>Privacy & safety</Text>
          </View>
        </TouchableOpacity>

        {/* Nicknames - only for 1-on-1 */}
        {!isGroupChat && (
          <TouchableOpacity style={styles.menuItem} onPress={handleChangeNickname}>
            <View style={styles.menuLeft}>
              <View style={styles.menuIconContainer}>
                <Ionicons name="pencil-outline" size={24} color="#000000ff" />
              </View>
              <Text style={styles.menuText}>Nicknames</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Create a group chat - only for 1-on-1 */}
        {!isGroupChat && (
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <View style={styles.menuIconContainer}>
                <Ionicons name="people-outline" size={24} color="#000000ff" />
              </View>
              <Text style={styles.menuText}>Create a group chat</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Leave Group - only for group chats */}
        {isGroupChat && conversation?.createdBy !== auth.currentUser?.uid && (
          <TouchableOpacity style={styles.menuItem} onPress={handleLeaveGroup}>
            <View style={styles.menuLeft}>
              <View style={styles.menuIconContainer}>
                <Ionicons name="exit-outline" size={24} color="#ef4444" />
              </View>
              <Text style={[styles.menuText, { color: '#ef4444' }]}>Leave Group</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Bottom Action Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.bottomBarButton} onPress={handleViewMedia}>
            <Ionicons name="images-outline" size={28} color="#8E8E8E" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomBarButton}>
            <Ionicons name="repeat-outline" size={28} color="#8E8E8E" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomBarButton}>
            <Ionicons name="link-outline" size={28} color="#8E8E8E" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>

      {/* Options Modal */}
      <Modal
        visible={showOptionsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptionsModal(false)}
        >
          <View style={styles.optionsModalContent}>
            <TouchableOpacity style={styles.optionItem} onPress={handleBlockUser}>
              <Ionicons name="ban-outline" size={24} color="#ef4444" />
              <Text style={[styles.optionText, { color: '#ef4444' }]}>Block User</Text>
            </TouchableOpacity>
            
            <View style={styles.optionDivider} />
            
            <TouchableOpacity style={styles.optionItem} onPress={handleDeleteChat}>
              <Ionicons name="trash-outline" size={24} color="#ef4444" />
              <Text style={[styles.optionText, { color: '#ef4444' }]}>Delete Conversation</Text>
            </TouchableOpacity>
            
            <View style={styles.optionDivider} />
            
            <TouchableOpacity style={styles.optionItem} onPress={handleShowConversationId}>
              <Ionicons name="information-circle-outline" size={24} color="#6b7280" />
              <Text style={styles.optionText}>Conversation ID</Text>
            </TouchableOpacity>
            
            <View style={styles.optionDivider} />
            
            <TouchableOpacity 
              style={styles.optionItem} 
              onPress={() => setShowOptionsModal(false)}
            >
              <Ionicons name="close-outline" size={24} color="#6b7280" />
              <Text style={styles.optionText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Nickname Modal */}
      <Modal
        visible={showNicknameModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNicknameModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Nickname</Text>
            <Text style={styles.modalSubtitle}>Set a nickname for {otherUserName}</Text>
            <TextInput
              style={styles.nicknameInput}
              value={nicknameInput}
              onChangeText={setNicknameInput}
              placeholder={`Current: ${nickname || otherUserName}`}
              placeholderTextColor="#8E8E8E"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowNicknameModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveNickname}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Media Modal */}
      <Modal
        visible={showMediaModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMediaModal(false)}
      >
        <View style={styles.mediaModalOverlay}>
          <View style={styles.mediaModalContent}>
            <View style={styles.mediaModalHeader}>
              <Text style={styles.mediaModalTitle}>Shared Media</Text>
              <TouchableOpacity onPress={() => setShowMediaModal(false)}>
                <Ionicons name="close" size={28} color="#000" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.mediaGrid}>
              {mediaImages.length > 0 ? (
                <View style={styles.mediaGridContainer}>
                  {mediaImages.map((imageUrl, index) => (
                    <TouchableOpacity key={index} style={styles.mediaItem}>
                      <Image source={{ uri: imageUrl }} style={styles.mediaImage} />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyMedia}>
                  <Ionicons name="images-outline" size={64} color="#8E8E8E" />
                  <Text style={styles.emptyMediaText}>No shared media</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Change Group Name/Image Modal */}
      <Modal
        visible={showChangeGroupModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowChangeGroupModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Group Details</Text>
            <Text style={styles.modalSubtitle}>Update group name and photo</Text>
            
            <TouchableOpacity 
              style={styles.groupPhotoButton}
              onPress={handlePickGroupImage}
            >
              {groupPhotoUri ? (
                <Image source={{ uri: groupPhotoUri }} style={styles.groupPhotoPreview} />
              ) : (
                <View style={styles.groupPhotoPlaceholder}>
                  <Ionicons name="camera" size={32} color="#8E8E8E" />
                  <Text style={styles.groupPhotoText}>Choose Photo</Text>
                </View>
              )}
            </TouchableOpacity>

            <TextInput
              style={styles.nicknameInput}
              value={groupNameInput}
              onChangeText={setGroupNameInput}
              placeholder="Group name"
              placeholderTextColor="#8E8E8E"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowChangeGroupModal(false)}
                disabled={isUploading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveGroupChanges}
                disabled={isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add People Modal */}
      <Modal
        visible={showAddPeopleModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddPeopleModal(false)}
      >
        <View style={styles.mediaModalOverlay}>
          <View style={styles.mediaModalContent}>
            <View style={styles.mediaModalHeader}>
              <Text style={styles.mediaModalTitle}>Add People</Text>
              <TouchableOpacity onPress={() => setShowAddPeopleModal(false)}>
                <Ionicons name="close" size={28} color="#000" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#8E8E8E" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={handleSearchUsers}
                placeholder="Search users..."
                placeholderTextColor="#8E8E8E"
              />
            </View>

            {selectedUsers.length > 0 && (
              <View style={styles.selectedUsersContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {selectedUsers.map(user => (
                    <View key={user.id} style={styles.selectedUserChip}>
                      <Image source={{ uri: user.profileImage }} style={styles.selectedUserAvatar} />
                      <Text style={styles.selectedUserName}>{user.username}</Text>
                      <TouchableOpacity onPress={() => toggleUserSelection(user)}>
                        <Ionicons name="close-circle" size={20} color="#8E8E8E" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            <FlatList
              data={searchResults}
              keyExtractor={item => item.id}
              renderItem={({ item }) => {
                const isSelected = selectedUsers.some(u => u.id === item.id);
                return (
                  <TouchableOpacity
                    style={styles.userItem}
                    onPress={() => toggleUserSelection(item)}
                  >
                    <Image source={{ uri: item.profileImage }} style={styles.userAvatar} />
                    <View style={styles.userInfo}>
                      <Text style={styles.userDisplayName}>{item.displayName}</Text>
                      <Text style={styles.userUsername}>@{item.username}</Text>
                    </View>
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                isSearching ? (
                  <View style={styles.emptyState}>
                    <ActivityIndicator color="#0095f6" />
                  </View>
                ) : searchQuery ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No users found</Text>
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="search" size={48} color="#8E8E8E" />
                    <Text style={styles.emptyText}>Search for users to add</Text>
                  </View>
                )
              }
            />

            {selectedUsers.length > 0 && (
              <TouchableOpacity
                style={styles.addUsersButton}
                onPress={handleAddSelectedUsers}
                disabled={isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.addUsersButtonText}>
                    Add {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* View People Modal */}
      <Modal
        visible={showViewPeopleModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowViewPeopleModal(false)}
      >
        <View style={styles.mediaModalOverlay}>
          <View style={styles.mediaModalContent}>
            <View style={styles.mediaModalHeader}>
              <Text style={styles.mediaModalTitle}>Group Members ({participants.length + 1})</Text>
              <TouchableOpacity onPress={() => setShowViewPeopleModal(false)}>
                <Ionicons name="close" size={28} color="#000" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={[
                // Add current user first
                ...(auth.currentUser?.uid ? [{
                  id: auth.currentUser.uid,
                  displayName: participantsInfo.get(auth.currentUser.uid)?.displayName || conversation?.participantDetails?.[auth.currentUser.uid]?.displayName || 'You',
                  username: participantsInfo.get(auth.currentUser.uid)?.username || conversation?.participantDetails?.[auth.currentUser.uid]?.username || '',
                  photoURL: participantsInfo.get(auth.currentUser.uid)?.photoURL || conversation?.participantDetails?.[auth.currentUser.uid]?.photoURL || '',
                  isAdmin: conversation?.admins?.includes(auth.currentUser.uid),
                }] : []),
                // Add other participants
                ...participants.map(p => ({
                  id: p.id,
                  displayName: participantsInfo.get(p.id)?.displayName || p.displayName,
                  username: participantsInfo.get(p.id)?.username || p.username,
                  photoURL: participantsInfo.get(p.id)?.photoURL || p.profileImage || '',
                  isAdmin: conversation?.admins?.includes(p.id),
                }))
              ]}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.participantItem}
                  onPress={() => handleUserPress(item.id)}
                >
                  <Image source={{ uri: item.photoURL }} style={styles.participantAvatar} />
                  <View style={styles.participantInfo}>
                    <Text style={styles.participantName}>{item.displayName}</Text>
                    <Text style={styles.participantUsername}>@{item.username}</Text>
                  </View>
                  {item.isAdmin && (
                    <View style={styles.adminBadge}>
                      <Text style={styles.adminText}>Admin</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Invite Link Modal */}
      <Modal
        visible={showInviteLinkModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInviteLinkModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Group Invite Link</Text>
            <Text style={styles.modalSubtitle}>Share this link with others to invite them to the group</Text>
            
            <View style={{
              backgroundColor: '#f3f4f6',
              padding: 16,
              borderRadius: 12,
              marginVertical: 16,
            }}>
              <Text style={{
                fontSize: 14,
                color: '#3b82f6',
                textAlign: 'center',
              }} selectable>
                snapnow.app/group/{conversationId}
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowInviteLinkModal(false)}
              >
                <Text style={styles.cancelButtonText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={async () => {
                  const link = `snapnow.app/group/${conversationId}`;
                  await Clipboard.setStringAsync(link);
                  Alert.alert('Copied!', 'Invite link copied to clipboard');
                }}
              >
                <Text style={styles.saveButtonText}>Copy Link</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#000000ff',
  },
  content: {
    flex: 1,
    backgroundColor: '#ffffffff',
  },
  userSection: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingBottom: 32,
    backgroundColor: '#ffffffff',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '600',
    color: '#000000ff',
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000ff',
    marginBottom: 4,
  },
  username: {
    fontSize: 15,
    color: '#000000ff',
    marginBottom: 24,
  },
  changeNameLink: {
    fontSize: 14,
    color: '#0095f6',
    marginTop: 8,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 16,
  },
  actionButton: {
    alignItems: 'center',
    minWidth: 70,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: -2,
  },
  actionLabel: {
    fontSize: 12,
    color: '#000000ff',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#ffffffff',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  themeCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuText: {
    fontSize: 16,
    color: '#000000ff',
    fontWeight: '400',
  },
  menuSubtext: {
    fontSize: 14,
    color: '#000000ff',
    marginTop: 2,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 40,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#ffffffff',
  },
  bottomBarButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#8E8E8E',
    marginBottom: 16,
  },
  nicknameInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  saveButton: {
    backgroundColor: '#0095f6',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  optionsModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 'auto',
    marginBottom: 40,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  optionText: {
    fontSize: 16,
    color: '#000',
  },
  optionDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 20,
  },
  mediaModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  mediaModalContent: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  mediaModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  mediaModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  mediaGrid: {
    flex: 1,
  },
  mediaGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  mediaItem: {
    width: '33.33%',
    aspectRatio: 1,
    padding: 2,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  emptyMedia: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyMediaText: {
    fontSize: 16,
    color: '#8E8E8E',
    marginTop: 16,
  },
  groupPhotoButton: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  groupPhotoPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  groupPhotoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupPhotoText: {
    fontSize: 12,
    color: '#8E8E8E',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  selectedUsersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  selectedUserChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
    gap: 6,
  },
  selectedUserAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  selectedUserName: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
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
  userDisplayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  userUsername: {
    fontSize: 14,
    color: '#8E8E8E',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#8E8E8E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#0095f6',
    borderColor: '#0095f6',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E8E',
    marginTop: 16,
  },
  addUsersButton: {
    backgroundColor: '#0095f6',
    borderRadius: 8,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginVertical: 16,
    alignItems: 'center',
  },
  addUsersButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  participantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  participantUsername: {
    fontSize: 14,
    color: '#8E8E8E',
  },
  adminBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminText: {
    fontSize: 12,
    color: '#0095f6',
    fontWeight: '600',
  },
});
