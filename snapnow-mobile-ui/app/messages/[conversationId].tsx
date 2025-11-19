import { Ionicons } from '@expo/vector-icons';
import { format, isToday, isYesterday } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CLOUDINARY_FOLDERS } from '../../config/cloudinary';
import { auth } from '../../config/firebase';
import { formatLastActive, getUserActivityStatus } from '../../services/activityStatus';
import { uploadToCloudinary } from '../../services/cloudinary';
import {
  createConversation,
  getConversation,
  Conversation,
} from '../../services/conversations';
import {
  markAllMessagesAsRead,
  Message,
  sendMessage,
  subscribeToMessages,
  deleteMessage,
  unsendMessage,
  copyMessageText,
} from '../../services/messages';
import * as Clipboard from 'expo-clipboard';

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const {
    conversationId: initialConversationId,
    otherUserId,
    otherUserName,
    otherUserPhoto,
    otherUserUsername,
  } = params;

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string>(
    initialConversationId as string || ''
  );
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [lastActiveText, setLastActiveText] = useState('');

  const flatListRef = useRef<FlatList>(null);
  const currentUser = auth.currentUser;
  const currentUserId = currentUser?.uid || '';
  const currentUserName = currentUser?.displayName || 'Unknown';
  const currentUserPhoto = currentUser?.photoURL || 'https://via.placeholder.com/150';

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Create conversation if needed
  useEffect(() => {
    const initConversation = async () => {
      if (!otherUserId) return;

      const expectedConversationId = [currentUserId, otherUserId as string].sort().join('_');
      
      console.log('📞 Chat: Checking conversation...');
      console.log('  - Current conversationId:', conversationId);
      console.log('  - Expected conversationId:', expectedConversationId);
      
      // Always ensure conversation exists in Firebase, even if we have an ID
      try {
        const conversation = await createConversation({
          currentUserId,
          currentUserName,
          currentUserPhoto,
          currentUserUsername: currentUser?.email?.split('@')[0] || 'user',
          otherUserId: otherUserId as string,
          otherUserName: otherUserName as string,
          otherUserPhoto: otherUserPhoto as string,
          otherUserUsername: otherUserUsername as string,
        });
        console.log('✅ Chat: Conversation ready:', conversation.id);
        setConversationId(conversation.id);
      } catch (error) {
        console.error('❌ Chat: Error ensuring conversation:', error);
      }
    };

    initConversation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherUserId]);

  // Subscribe to messages
  useEffect(() => {
    if (!conversationId) return;

    // Fetch conversation details
    const fetchConversation = async () => {
      try {
        const conv = await getConversation(conversationId);
        if (conv) {
          setConversation(conv);
        }
      } catch (error) {
        console.error('Error fetching conversation:', error);
      }
    };

    fetchConversation();

    const unsubscribe = subscribeToMessages(
      conversationId,
      (updatedMessages: Message[]) => {
        setMessages(updatedMessages);
        setLoading(false);

        // Mark messages as read
        if (updatedMessages.length > 0) {
          markAllMessagesAsRead(conversationId, currentUserId);
        }

        // Scroll to bottom when new message arrives
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      },
      (error: Error) => {
        console.error('Error loading messages:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Load activity status (only for 1-1 chats)
  useEffect(() => {
    // Skip activity status for group chats
    if (!otherUserId || conversation?.isGroupChat) return;

    const loadActivityStatus = async () => {
      const status = await getUserActivityStatus(otherUserId as string);
      if (status && status.activityStatusEnabled) {
        setIsOnline(status.isOnline);
        if (!status.isOnline && status.lastActive) {
          setLastActiveText(formatLastActive(status.lastActive));
        } else {
          setLastActiveText('');
        }
      }
    };

    loadActivityStatus();
    const interval = setInterval(loadActivityStatus, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [otherUserId, conversation?.isGroupChat]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || sending) return;

    const textToSend = messageText.trim();
    setMessageText('');
    setSending(true);

    try {
      // Use current conversationId (should be set by useEffect)
      const finalConversationId = conversationId || [currentUserId, otherUserId as string].sort().join('_');

      console.log('📤 Sending message to conversation:', finalConversationId);

      await sendMessage({
        conversationId: finalConversationId,
        senderId: currentUserId,
        senderName: currentUserName,
        senderPhoto: currentUserPhoto,
        receiverId: conversation?.isGroupChat ? undefined : (otherUserId as string),
        type: 'text',
        text: textToSend,
      });
      
      console.log('✅ Message sent successfully');
    } catch (error) {
      console.error('❌ Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
      setMessageText(textToSend);
    } finally {
      setSending(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await handleSendImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your camera');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await handleSendImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleSendImage = async (imageUri: string) => {
    if (!imageUri || sending) return;

    setSelectedImage(imageUri);
    setUploadingImage(true);
    setSending(true);

    try {
      const finalConversationId = conversationId || [currentUserId, otherUserId as string].sort().join('_');
      
      console.log('📤 Uploading image to Cloudinary...');
      
      // Upload image to Cloudinary
      const uploadResult = await uploadToCloudinary(imageUri, {
        folder: CLOUDINARY_FOLDERS.messages,
        tags: ['message', finalConversationId],
      });
      
      const imageUrl = uploadResult.secure_url;
      
      console.log('✅ Image uploaded to Cloudinary:', imageUrl);
      console.log('📤 Sending image message...');

      // Send image message
      await sendMessage({
        conversationId: finalConversationId,
        senderId: currentUserId,
        senderName: currentUserName,
        senderPhoto: currentUserPhoto,
        receiverId: conversation?.isGroupChat ? undefined : (otherUserId as string),
        type: 'image',
        text: '', // Empty text for image messages
        imageUrl,
      });

      console.log('✅ Image message sent successfully');
    } catch (error) {
      console.error('❌ Error sending image:', error);
      Alert.alert('Error', 'Failed to send image. Please try again.');
    } finally {
      setSelectedImage(null);
      setUploadingImage(false);
      setSending(false);
    }
  };

  const formatMessageTime = (timestamp: any) => {
    if (!timestamp) return '';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      
      if (isToday(date)) {
        return format(date, 'HH:mm');
      } else if (isYesterday(date)) {
        return 'Yesterday ' + format(date, 'HH:mm');
      } else {
        return format(date, 'MMM dd, HH:mm');
      }
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return '';
    }
  };

  const handleLongPressMessage = (message: Message) => {
    const isMyMessage = message.senderId === currentUserId;
    
    const options = ['Copy'];
    
    if (isMyMessage) {
      options.push('Delete for Me');
      options.push('Unsend for Everyone');
    } else {
      options.push('Delete for Me');
    }
    
    options.push('Cancel');
    
    Alert.alert(
      'Message Options',
      message.text || 'Image message',
      options.map((option) => ({
        text: option,
        style: option === 'Cancel' ? 'cancel' : option.includes('Unsend') || option.includes('Delete') ? 'destructive' : 'default',
        onPress: async () => {
          try {
            if (option === 'Copy' && message.text) {
              await Clipboard.setStringAsync(message.text);
              Alert.alert('Success', 'Message copied to clipboard');
            } else if (option === 'Delete for Me') {
              await deleteMessage(conversationId, message.id, currentUserId);
            } else if (option === 'Unsend for Everyone') {
              await unsendMessage(conversationId, message.id, currentUserId);
            }
          } catch (error: any) {
            console.error('Error handling message option:', error);
            Alert.alert('Error', error.message || 'Failed to perform action');
          }
        },
      })),
      { cancelable: true }
    );
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMyMessage = item.senderId === currentUserId;
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showAvatar = !prevMessage || prevMessage.senderId !== item.senderId;
    const timestamp = formatMessageTime(item.createdAt);

    // Check if message is deleted
    const isDeletedForMe = item.deletedBy?.includes(currentUserId);
    const isDeletedForEveryone = item.deletedForEveryone;
    
    // Don't render if deleted for me
    if (isDeletedForMe) {
      return null;
    }

    return (
      <TouchableOpacity
        onLongPress={() => handleLongPressMessage(item)}
        activeOpacity={0.8}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            marginBottom: 12,
            paddingHorizontal: 12,
            justifyContent: isMyMessage ? 'flex-end' : 'flex-start',
          }}
        >
          {/* Avatar for other user */}
          {!isMyMessage && (
            <View style={{ width: 32, height: 32, marginRight: 8 }}>
              {showAvatar && (
                <Image
                  source={{ uri: item.senderPhoto || 'https://via.placeholder.com/32' }}
                  style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#e5e7eb' }}
                />
              )}
            </View>
          )}

          {/* Message Bubble */}
          <View
            style={{
              maxWidth: '75%',
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 12,
              backgroundColor: isDeletedForEveryone ? '#f3f4f6' : (isMyMessage ? '#3b82f6' : '#ffffff'),
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.08,
              shadowRadius: 3,
              elevation: 2,
            }}
          >
            {item.type === 'image' && item.imageUrl && !isDeletedForEveryone && (
              <Image
                source={{ uri: item.imageUrl }}
                style={{ width: 200, height: 200, borderRadius: 12, marginBottom: 8 }}
                resizeMode="cover"
              />
            )}
            
            <Text
              style={{
                fontSize: 16,
                lineHeight: 22,
                color: isDeletedForEveryone ? '#9ca3af' : (isMyMessage ? '#ffffff' : '#1f2937'),
                fontStyle: isDeletedForEveryone ? 'italic' : 'normal',
              }}
            >
              {item.text}
            </Text>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 }}>
              <Text
                style={{
                  fontSize: 11,
                  color: isDeletedForEveryone ? '#9ca3af' : (isMyMessage ? 'rgba(255,255,255,0.75)' : '#9ca3af'),
                }}
              >
                {timestamp}
              </Text>
              {isMyMessage && item.isRead && !isDeletedForEveryone && (
                <Ionicons name="checkmark-done" size={14} color="rgba(255,255,255,0.75)" style={{ marginLeft: 4 }} />
              )}
              {isMyMessage && !item.isRead && !isDeletedForEveryone && (
                <Ionicons name="checkmark" size={14} color="rgba(255,255,255,0.75)" style={{ marginLeft: 4 }} />
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
      <Ionicons name="chatbubbles-outline" size={64} color="#d1d5db" />
      <Text style={{ textAlign: 'center', color: '#6b7280', marginTop: 16, fontSize: 16 }}>
        No messages yet. Say hi! 👋
      </Text>
    </View>
  );

  if (loading && !conversationId) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: '',
          headerStyle: {
            backgroundColor: '#ffffffff',
          },
          headerShadowVisible: true,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/messages/conversation-details' as any,
                  params: {
                    conversationId,
                    otherUserId,
                    otherUserName,
                    otherUserPhoto,
                    otherUserUsername,
                  },
                })
              }
              style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 16 }}
            >
              <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
                <Ionicons name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>
              <View style={{ position: 'relative' }}>
                <Image
                  source={{ 
                    uri: conversation?.isGroupChat
                      ? (conversation.groupPhoto || 'https://via.placeholder.com/40?text=Group')
                      : ((otherUserPhoto as string) || 'https://via.placeholder.com/40')
                  }}
                  style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10, backgroundColor: '#e5e7eb' }}
                />
                {!conversation?.isGroupChat && isOnline && (
                  <View
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 10,
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: '#34c759',
                      borderWidth: 2,
                      borderColor: '#ffffff',
                    }}
                  />
                )}
              </View>
              <View>
                <Text style={{ fontWeight: '700', fontSize: 16, color: '#000' }} numberOfLines={1}>
                  {conversation?.isGroupChat
                    ? (conversation.groupName || 'Group Chat')
                    : (otherUserName as string || 'Unknown User')}
                </Text>
                {conversation?.isGroupChat ? (
                  <Text style={{ fontSize: 12, color: '#6b7280' }}>
                    {conversation.participants?.length || 0} members
                  </Text>
                ) : isOnline ? (
                  <Text style={{ fontSize: 12, color: '#34c759', fontWeight: '500' }}>
                    Active now
                  </Text>
                ) : lastActiveText ? (
                  <Text style={{ fontSize: 12, color: '#6b7280' }}>
                    {lastActiveText}
                  </Text>
                ) : otherUserUsername ? (
                  <Text style={{ fontSize: 12, color: '#6b7280' }}>
                    @{otherUserUsername}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 16, paddingRight: 8 }}>
              <TouchableOpacity>
                <Ionicons name="videocam-outline" size={26} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity>
                <Ionicons name="call-outline" size={24} color="#000" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'position'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={{ flex: 1, backgroundColor: '#f9fafb' }}
        contentContainerStyle={{ flex: 1 }}
      >
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={{ paddingVertical: 16, flexGrow: 1 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}
        />

        {/* Input Bar */}
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: '#e5e7eb',
            backgroundColor: '#ffffff',
            paddingBottom: Platform.OS === 'android' && keyboardVisible ? 0 : 0,
          }}
        >
          {/* Image Preview when uploading */}
          {uploadingImage && selectedImage && (
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
              <View style={{ position: 'relative' }}>
                <Image 
                  source={{ uri: selectedImage }}
                  style={{ width: 100, height: 100, borderRadius: 12 }}
                  resizeMode="cover"
                />
                <View style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  borderRadius: 12,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={{ color: '#fff', marginTop: 8, fontSize: 12 }}>Uploading...</Text>
                </View>
              </View>
            </View>
          )}

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
          >
            {/* Camera Button */}
            <TouchableOpacity 
              onPress={handleTakePhoto}
              disabled={sending}
              style={{ padding: 8, marginRight: 4 }}
            >
              <Ionicons 
                name="camera-outline" 
                size={24} 
                color={sending ? '#d1d5db' : '#3b82f6'} 
              />
            </TouchableOpacity>

            {/* Image Button */}
            <TouchableOpacity 
              onPress={handlePickImage}
              disabled={sending}
              style={{ padding: 8, marginRight: 8 }}
            >
              <Ionicons 
                name="image-outline" 
                size={24} 
                color={sending ? '#d1d5db' : '#3b82f6'} 
              />
            </TouchableOpacity>

            {/* Text Input */}
            <View
              style={{
                flex: 1,
                backgroundColor: '#f3f4f6',
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 8,
                marginRight: 8,
              }}
            >
              <TextInput
                value={messageText}
                onChangeText={setMessageText}
                placeholder="Message..."
                placeholderTextColor="#9ca3af"
                multiline
                maxLength={500}
                editable={!sending}
                style={{
                  fontSize: 16,
                  maxHeight: 100,
                  color: '#000',
                }}
                returnKeyType="default"
                blurOnSubmit={false}
              />
            </View>

            {/* Send Button */}
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={!messageText.trim() || sending}
              style={{
                padding: 12,
                borderRadius: 24,
                backgroundColor: messageText.trim() && !sending ? '#3b82f6' : '#d1d5db',
              }}
            >
              {sending && !uploadingImage ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}
