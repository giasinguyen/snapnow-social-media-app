import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
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
import { auth } from '../../config/firebase';
import { Conversation, getConversation } from '../../services/conversations';
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

  useEffect(() => {
    loadConversationData();
    loadUserDetails();
    loadMediaImages();
  }, [otherUserId, conversationId]);

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
              <TouchableOpacity>
                <Text style={styles.changeNameLink}>Change name and image</Text>
              </TouchableOpacity>
            </>
          ) : (
            // 1-on-1 chat header
            <>
              {otherUserPhoto ? (
                <Image source={{ uri: otherUserPhoto as string }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>
                    {(otherUserName as string)?.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <Text style={styles.userName}>
                {nickname || (otherUserName as string)}
              </Text>
              {otherUserUsername && (
                <Text style={styles.username}>@{otherUserUsername}</Text>
              )}
            </>
          )}

          {/* Quick Action Buttons */}
          <View style={styles.actionButtons}>
            {isGroupChat ? (
              // Group chat actions
              <TouchableOpacity style={styles.actionButton}>
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
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <View style={styles.menuIconContainer}>
                  <Ionicons name="link-outline" size={24} color="#000000ff" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuText}>Invite link</Text>
                  <Text style={styles.menuSubtext}>https://ig.me/j/{conversationId?.slice(0, 12)}/</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* People section */}
            <TouchableOpacity style={styles.menuItem}>
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
});
