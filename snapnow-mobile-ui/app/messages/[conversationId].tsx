import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { auth } from '../../config/firebase';
import {
  subscribeToMessages,
  sendMessage,
  markAllMessagesAsRead,
  Message,
} from '../../services/messages';
import {
  createConversation,
} from '../../services/conversations';
import { uploadToCloudinary } from '../../services/cloudinary';
import { CLOUDINARY_FOLDERS } from '../../config/cloudinary';
import { format, isToday, isYesterday } from 'date-fns';

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
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const currentUser = auth.currentUser;
  const currentUserId = currentUser?.uid || '';
  const currentUserName = currentUser?.displayName || 'Unknown';
  const currentUserPhoto = currentUser?.photoURL || 'https://via.placeholder.com/150';

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
        receiverId: otherUserId as string,
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
        receiverId: otherUserId as string,
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

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMyMessage = item.senderId === currentUserId;
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showAvatar = !prevMessage || prevMessage.senderId !== item.senderId;
    const timestamp = formatMessageTime(item.createdAt);

    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          marginBottom: 12,
          paddingHorizontal: 16,
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
            maxWidth: '70%',
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: isMyMessage ? '#3b82f6' : '#ffffff',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.08,
            shadowRadius: 3,
            elevation: 2,
          }}
        >
          {item.type === 'image' && item.imageUrl && (
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
              color: isMyMessage ? '#ffffff' : '#1f2937',
            }}
          >
            {item.text}
          </Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 }}>
            <Text
              style={{
                fontSize: 11,
                color: isMyMessage ? 'rgba(255,255,255,0.75)' : '#9ca3af',
              }}
            >
              {timestamp}
            </Text>
            {isMyMessage && item.isRead && (
              <Ionicons name="checkmark-done" size={14} color="rgba(255,255,255,0.75)" style={{ marginLeft: 4 }} />
            )}
            {isMyMessage && !item.isRead && (
              <Ionicons name="checkmark" size={14} color="rgba(255,255,255,0.75)" style={{ marginLeft: 4 }} />
            )}
          </View>
        </View>

        {/* Spacer for my messages */}
        {isMyMessage && <View style={{ width: 32, height: 32, marginLeft: 8 }} />}
      </View>
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
            backgroundColor: '#ffffff',
          },
          headerShadowVisible: true,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 16 }}
            >
              <Ionicons name="arrow-back" size={24} color="#000" style={{ marginRight: 12 }} />
              <Image
                source={{ uri: (otherUserPhoto as string) || 'https://via.placeholder.com/40' }}
                style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10, backgroundColor: '#e5e7eb' }}
              />
              <View>
                <Text style={{ fontWeight: '700', fontSize: 16, color: '#000' }} numberOfLines={1}>
                  {otherUserName as string || 'Unknown User'}
                </Text>
                {otherUserUsername && (
                  <Text style={{ fontSize: 12, color: '#6b7280' }}>
                    @{otherUserUsername}
                  </Text>
                )}
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={{ flex: 1, backgroundColor: '#f9fafb' }}
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
