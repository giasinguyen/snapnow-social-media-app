import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, isSameDay, isToday, isYesterday } from 'date-fns';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert, DeviceEventEmitter, FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { CLOUDINARY_FOLDERS } from '../../config/cloudinary';
import { auth, db } from '../../config/firebase';
import { useTheme } from '../../contexts/ThemeContext';
import { formatLastActive, getUserActivityStatus } from '../../services/activityStatus';
import { uploadToCloudinary } from '../../services/cloudinary';
import {
  Conversation,
  createConversation,
  getConversation,
  getNickname,
} from '../../services/conversations';
import {
  deleteMessage,
  markAllMessagesAsRead,
  Message,
  sendMessage,
  subscribeToMessages,
  unsendMessage
} from '../../services/messages';

export default function ChatScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const {
    conversationId: initialConversationId,
    otherUserId,
    otherUserName,
    otherUserPhoto,
    otherUserUsername,
    initialMessage,
  } = params;

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string>(
    initialConversationId as string || ''
  );
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatTheme, setChatTheme] = useState<'default' | 'purple' | 'blue' | 'dark'>('default');
  const [messageText, setMessageText] = useState(initialMessage as string || '');
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [lastActiveText, setLastActiveText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const swipeableRefs = useRef<Map<string, any>>(new Map());
  const [senderInfo, setSenderInfo] = useState<Map<string, { displayName: string; photoURL: string }>>(new Map());
  const [otherUserRealtime, setOtherUserRealtime] = useState<{ displayName: string; photoURL: string; username: string } | null>(null);
  const senderSubscriptions = useRef<Map<string, () => void>>(new Map());
  const [messageOptionsVisible, setMessageOptionsVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [nickname, setNickname] = useState<string>('');

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

    // Fetch conversation details and listen for updates
    const fetchConversation = async () => {
      try {
        const conv = await getConversation(conversationId);
        if (conv) {
          setConversation(conv);
          
          // Load nickname for 1-on-1 chats
          if (!conv.isGroupChat && otherUserId) {
            const savedNickname = getNickname(conv, currentUserId, otherUserId as string);
            setNickname(savedNickname);
          }
        }
      } catch (error) {
        console.error('Error fetching conversation:', error);
      }
    };

    fetchConversation();

    // Listen for conversation updates (for group name/photo changes)
    const conversationRef = doc(db, 'conversations', conversationId);
    const unsubscribeConversation = onSnapshot(conversationRef, (snapshot) => {
      if (snapshot.exists()) {
        const updatedConv = { id: snapshot.id, ...snapshot.data() } as Conversation;
        setConversation(updatedConv);
        
        // Update nickname for 1-on-1 chats
        if (!updatedConv.isGroupChat && otherUserId) {
          const savedNickname = getNickname(updatedConv, currentUserId, otherUserId as string);
          setNickname(savedNickname);
        }
      }
    });

    // When conversation doc updates, prefer server-side theme if present
    // (this ensures other participants see theme changes even if DeviceEventEmitter isn't emitted locally)
    const handleConversationSnapshot = onSnapshot(conversationRef, (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data() as any;
      if (data?.theme && data.theme !== chatTheme) {
        setChatTheme(data.theme);
        // keep local cache in sync
        const key = conversationId ? `chat_theme_${conversationId}` : 'chat_theme_default';
        AsyncStorage.setItem(key, data.theme).catch(() => {});
      }
    });

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

    return () => {
      unsubscribe();
      unsubscribeConversation();
      handleConversationSnapshot();
    };
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

  // Filter messages based on search query
    // Theme helper and persistence per conversation
    const getThemeColors = (theme: typeof chatTheme) => {
      switch (theme) {
        case 'purple':
          return { containerBg: '#F7F3FF', headerBg: '#efe7ff', accent: '#7C4DFF', text: '#1f1f1f', messageReceivedBg: '#fff' };
        case 'blue':
          return { containerBg: '#F0F7FF', headerBg: '#eaf6ff', accent: '#3B82F6', text: '#1f1f1f', messageReceivedBg: '#fff' };
        case 'dark':
          return { containerBg: '#0b0c0d', headerBg: '#0b0c0d', accent: '#9CA3AF', text: '#ffffff', messageReceivedBg: '#111215' };
        default:
          return { containerBg: '#f9fafb', headerBg: '#ffffffff', accent: '#fc8727ff', text: '#000000', messageReceivedBg: '#ffffff' };
      }
    };

    useEffect(() => {
      const loadTheme = async () => {
        if (!conversationId) return;
        try {
          const key = `chat_theme_${conversationId}`;
          const stored = await AsyncStorage.getItem(key);
          if (stored === 'purple' || stored === 'blue' || stored === 'dark' || stored === 'default') {
            setChatTheme(stored as any);
          }
        } catch (error) {
          // ignore
        }
      };

      loadTheme();
      // subscribe to theme change events for this conversation
      const sub = DeviceEventEmitter.addListener('chatThemeChanged', (payload: any) => {
        if (!payload) return;
        // if event is for this conversation (or global), apply immediately
        if (payload.conversationId === conversationId || !payload.conversationId) {
          if (payload.theme === 'purple' || payload.theme === 'blue' || payload.theme === 'dark' || payload.theme === 'default') {
            setChatTheme(payload.theme);
          }
        }
      });
      return () => {
        sub.remove();
      };
    }, [conversationId]);
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = messages.filter(msg => 
        msg.text.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMessages(filtered);
    } else {
      setFilteredMessages(messages);
    }
  }, [searchQuery, messages]);

  // Subscribe to real-time user profile updates for all senders
  useEffect(() => {
    if (!conversationId || messages.length === 0) return;

    // Get unique sender IDs from messages
    const senderIds = [...new Set(messages.map(msg => msg.senderId))];

    // Subscribe to new senders only
    senderIds.forEach(senderId => {
      // Skip if already subscribed
      if (senderSubscriptions.current.has(senderId)) return;
      
      const userDocRef = doc(db, 'users', senderId);
      const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setSenderInfo(prev => {
            const newMap = new Map(prev);
            newMap.set(senderId, {
              displayName: userData.displayName || 'Unknown User',
              photoURL: userData.profileImage || userData.photoURL || 'https://via.placeholder.com/32',
            });
            return newMap;
          });
        }
      }, (error) => {
        console.error('Error subscribing to user profile:', senderId, error);
      });
      
      senderSubscriptions.current.set(senderId, unsubscribe);
    });

    // Cleanup function only unsubscribes when component unmounts
    return () => {
      senderSubscriptions.current.forEach(unsub => unsub());
      senderSubscriptions.current.clear();
    };
  }, [conversationId, messages]);

  // Subscribe to other user's profile for real-time header updates (1-on-1 chats only)
  useEffect(() => {
    if (!otherUserId || conversation?.isGroupChat) return;

    const userDocRef = doc(db, 'users', otherUserId as string);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        setOtherUserRealtime({
          displayName: userData.displayName || 'Unknown User',
          photoURL: userData.profileImage || userData.photoURL || 'https://via.placeholder.com/40',
          username: userData.username || '',
        });
      }
    });

    return () => unsubscribe();
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

      const messageData: any = {
        conversationId: finalConversationId,
        senderId: currentUserId,
        senderName: currentUserName,
        senderPhoto: currentUserPhoto,
        receiverId: conversation?.isGroupChat ? undefined : (otherUserId as string),
        type: 'text',
        text: textToSend,
      };

      // Only add replyTo if it exists
      if (replyingTo) {
        messageData.replyTo = {
          messageId: replyingTo.id,
          text: replyingTo.text,
          senderName: replyingTo.senderName,
          ...(replyingTo.imageUrl && { imageUrl: replyingTo.imageUrl }),
        };
      }

      await sendMessage(messageData);
      
      console.log('✅ Message sent successfully');
      setReplyingTo(null); // Clear reply after sending
      // Close any open swipeables
      swipeableRefs.current.forEach(ref => ref?.close());
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

  const formatDetailedTime = (timestamp: any) => {
    if (!timestamp) return '';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      
      if (isToday(date)) {
        return 'Today at ' + format(date, 'HH:mm');
      } else if (isYesterday(date)) {
        return 'Yesterday at ' + format(date, 'HH:mm');
      } else {
        return format(date, 'MMMM dd, yyyy \\at HH:mm');
      }
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return '';
    }
  };

  const formatDateSeparator = (timestamp: any) => {
    if (!timestamp) return '';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      
      if (isToday(date)) {
        return 'Today';
      } else if (isYesterday(date)) {
        return 'Yesterday';
      } else {
        return format(date, 'MMMM dd, yyyy');
      }
    } catch (error) {
      console.error('Error formatting date separator:', error);
      return '';
    }
  };

  const handleLongPressMessage = (message: Message) => {
    // Don't show options for system messages
    if (message.type === 'system') return;
    
    setSelectedMessage(message);
    setMessageOptionsVisible(true);
  };

  const handleCopyMessage = async () => {
    if (selectedMessage?.text) {
      try {
        await Clipboard.setStringAsync(selectedMessage.text);
        setMessageOptionsVisible(false);
        Alert.alert('Success', 'Message copied to clipboard');
      } catch (error) {
        console.error('Error copying message:', error);
      }
    }
  };

  const handleDeleteForMe = async () => {
    if (selectedMessage) {
      try {
        setMessageOptionsVisible(false);
        await deleteMessage(conversationId, selectedMessage.id, currentUserId);
      } catch (error: any) {
        console.error('Error deleting message:', error);
        Alert.alert('Error', error.message || 'Failed to delete message');
      }
    }
  };

  const handleUnsendMessage = async () => {
    if (selectedMessage) {
      try {
        setMessageOptionsVisible(false);
        await unsendMessage(conversationId, selectedMessage.id, currentUserId);
      } catch (error: any) {
        console.error('Error unsending message:', error);
        Alert.alert('Error', error.message || 'Failed to unsend message');
      }
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    // Check if message is deleted
    const isDeletedForMe = item.deletedBy?.includes(currentUserId);
    const isDeletedForEveryone = item.deletedForEveryone;
    
    // Don't render if deleted for me
    if (isDeletedForMe) {
      return null;
    }

    // Render system messages differently
    if (item.type === 'system') {
      return (
        <View style={{
          alignItems: 'center',
          marginVertical: 8,
          paddingHorizontal: 20,
        }}>
          <View style={{
            backgroundColor: colors.backgroundGray,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 16,
            maxWidth: '80%',
          }}>
            <Text style={{
              fontSize: 13,
              color: colors.textSecondary,
              textAlign: 'center',
            }}>
              {item.text}
            </Text>
          </View>
        </View>
      );
    }

    const isMyMessage = item.senderId === currentUserId;
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showAvatar = !prevMessage || prevMessage.senderId !== item.senderId;
    
    // Show date separator if this is the first message or if it's from a different day
    let showDateSeparator = true;
    if (prevMessage) {
      try {
        const prevDate = prevMessage.createdAt?.toDate ? prevMessage.createdAt.toDate() : new Date();
        const currentDate = item.createdAt?.toDate ? item.createdAt.toDate() : new Date();
        showDateSeparator = !isSameDay(prevDate, currentDate);
      } catch {
        showDateSeparator = false;
      }
    }
    
    // Get latest sender info from real-time map, fallback to stored message data
    const latestSenderInfo = senderInfo.get(item.senderId);
    const senderName = latestSenderInfo?.displayName || item.senderName;
    const senderPhoto = latestSenderInfo?.photoURL || item.senderPhoto;

    const renderRightActions = () => {
      return (
        <View style={{ justifyContent: 'center', paddingHorizontal: 16 }}>
          <Ionicons name="arrow-undo" size={24} color="#ee6e05ff" />
        </View>
      );
    };

    const handleSwipeReply = () => {
      if (!isDeletedForEveryone) {
        setReplyingTo(item);
        // Close the swipeable after selecting
        const swipeableRef = swipeableRefs.current.get(item.id);
        if (swipeableRef) {
          swipeableRef.close();
        }
      }
    };

    const messageContent = (
      <>
        {/* Date Separator */}
        {showDateSeparator && (
          <View style={{
            alignItems: 'center',
            marginVertical: 16,
          }}>
            <View style={{
              backgroundColor: colors.backgroundGray,
              paddingHorizontal: 16,
              paddingVertical: 6,
              borderRadius: 12,
            }}>
              <Text style={{
                fontSize: 12,
                color: colors.textSecondary,
                fontWeight: '500',
              }}>
                {formatDateSeparator(item.createdAt)}
              </Text>
            </View>
          </View>
        )}

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
                  source={{ uri: senderPhoto || 'https://via.placeholder.com/32' }}
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
              backgroundColor: isDeletedForEveryone ? '#f3f4f6' : (isMyMessage ? '#fc8727ff' : getThemeColors(chatTheme).messageReceivedBg),
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.08,
              shadowRadius: 3,
              elevation: 2,
            }}
          >
            {/* Reply Preview */}
            {item.replyTo && !isDeletedForEveryone && (
              <View style={{
                backgroundColor: isMyMessage ? 'rgba(255,255,255,0.2)' : colors.backgroundGray,
                borderLeftWidth: 3,
                borderLeftColor: isMyMessage ? 'rgba(255,255,255,0.5)' : '#fc8727ff',
                paddingLeft: 8,
                paddingVertical: 6,
                marginBottom: 8,
                borderRadius: 6,
              }}>
                <Text style={{
                  fontSize: 11,
                  fontWeight: '600',
                  color: isMyMessage ? 'rgba(255,255,255,0.9)' : '#fc8727ff',
                  marginBottom: 2,
                }}>
                  {senderInfo.get(item.senderId)?.displayName || item.replyTo.senderName}
                </Text>
                {item.replyTo.imageUrl && (
                  <Image
                    source={{ uri: item.replyTo.imageUrl }}
                    style={{ width: 60, height: 60, borderRadius: 6, marginBottom: 4 }}
                    resizeMode="cover"
                  />
                )}
                <Text
                  numberOfLines={2}
                  style={{
                    fontSize: 13,
                    color: isMyMessage ? 'rgba(255,255,255,0.75)' : colors.textSecondary,
                  }}
                >
                  {item.replyTo.text || 'Image'}
                </Text>
              </View>
            )}

            {/* Story Reply Preview */}
            {item.storyId && !isDeletedForEveryone && (
              <View style={{ marginBottom: 8 }}>
                {/* Always show "replied to story" text */}
                <Text
                  style={{
                    fontSize: 12,
                    color: isMyMessage ? 'rgba(255,255,255,0.7)' : '#9ca3af',
                    fontWeight: '500',
                    marginBottom: 6,
                  }}
                >
                  Replied to {isMyMessage ? 'their' : 'your'} story
                </Text>
                
                {/* Show story image if available */}
                {item.storyImageUrl && (
                  <Image
                    source={{ uri: item.storyImageUrl }}
                    style={{ 
                      width: 150, 
                      height: 200, 
                      borderRadius: 12, 
                      opacity: 0.5 
                    }}
                    resizeMode="cover"
                  />
                )}
              </View>
            )}

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
                color: isDeletedForEveryone ? '#9ca3af' : (isMyMessage ? '#ffffff' : (chatTheme === 'dark' ? '#e6eef8' : '#1f2937')),
                fontStyle: isDeletedForEveryone ? 'italic' : 'normal',
              }}
            >
              {item.text}
            </Text>
            
            {/* Read receipts only - no timestamp */}
            {isMyMessage && !isDeletedForEveryone && (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 }}>
                {item.isRead ? (
                  <Ionicons name="checkmark-done" size={14} color="rgba(255,255,255,0.75)" />
                ) : (
                  <Ionicons name="checkmark" size={14} color="rgba(255,255,255,0.75)" />
                )}
              </View>
            )}
          </View>
        </View>
        </TouchableOpacity>
      </>
    );

    // Allow swipe-to-reply on all messages
    if (!isDeletedForEveryone) {
      return (
        <Swipeable
          ref={(ref) => {
            if (ref) {
              swipeableRefs.current.set(item.id, ref);
            } else {
              swipeableRefs.current.delete(item.id);
            }
          }}
          renderRightActions={renderRightActions}
          onSwipeableOpen={handleSwipeReply}
          overshootRight={false}
          rightThreshold={40}
        >
          {messageContent}
        </Swipeable>
      );
    }

    return messageContent;
  };

  const renderEmptyState = () => (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
      <Ionicons name="chatbubbles-outline" size={64} color={colors.borderLight} />
      <Text style={{ textAlign: 'center', color: colors.textSecondary, marginTop: 16, fontSize: 16 }}>
        No messages yet. Say hi! 👋
      </Text>
    </View>
  );

  if (loading && !conversationId) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color="#fc8727ff" />
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
            backgroundColor: getThemeColors(chatTheme).headerBg,
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
                <Ionicons name="arrow-back" size={24} color={getThemeColors(chatTheme).text} />
              </TouchableOpacity>
              <View style={{ position: 'relative' }}>
                <Image
                  source={{ 
                    uri: conversation?.isGroupChat
                      ? (conversation.groupPhoto || 'https://via.placeholder.com/40?text=Group')
                      : (otherUserRealtime?.photoURL || (otherUserPhoto as string) || 'https://via.placeholder.com/40')
                  }}
                  style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10, backgroundColor: colors.borderLight }}
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
                <Text style={{ fontWeight: '700', fontSize: 16, color: getThemeColors(chatTheme).text }} numberOfLines={1}>
                  {conversation?.isGroupChat
                    ? (conversation.groupName || 'Group Chat')
                    : (nickname || otherUserRealtime?.displayName || (otherUserName as string) || 'Unknown User')}
                </Text>
                {conversation?.isGroupChat ? (
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                    {conversation.participants?.length || 0} members
                  </Text>
                ) : isOnline ? (
                  <Text style={{ fontSize: 12, color: '#34c759', fontWeight: '500' }}>
                    Active now
                  </Text>
                ) : lastActiveText ? (
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                    {lastActiveText}
                  </Text>
                ) : (otherUserRealtime?.username || otherUserUsername) ? (
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                    @{otherUserRealtime?.username || otherUserUsername}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 16, gap: 16 }}>
              <TouchableOpacity onPress={() => setSearchVisible(!searchVisible)}>
                <Ionicons name="search-outline" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <KeyboardAvoidingView
        behavior={'padding'}
        keyboardVerticalOffset={90}
        style={{ flex: 1, backgroundColor: getThemeColors(chatTheme).containerBg }}
        contentContainerStyle={{ flex: 1 }}
      >
        {/* Search Bar */}
        {searchVisible && (
          <View style={{
            backgroundColor: colors.backgroundWhite,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderBottomWidth: 1,
            borderBottomColor: colors.borderLight,
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.backgroundGray,
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 8,
            }}>
              <Ionicons name="search" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search in conversation..."
                placeholderTextColor={colors.textSecondary}
                autoFocus
                style={{
                  flex: 1,
                  fontSize: 16,
                  color: colors.textPrimary,
                }}
              />
              {searchQuery && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={searchQuery ? filteredMessages : messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          ListEmptyComponent={searchQuery ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
              <Ionicons name="search-outline" size={64} color={colors.borderLight} />
              <Text style={{ textAlign: 'center', color: colors.textSecondary, marginTop: 16, fontSize: 16 }}>
                No messages found
              </Text>
            </View>
          ) : renderEmptyState}
          contentContainerStyle={{ paddingVertical: 16, flexGrow: 1 }}
          onContentSizeChange={() => !searchQuery && flatListRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}
        />

        {/* Input Bar */}
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: colors.borderLight,
            backgroundColor: colors.backgroundWhite,
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

          {/* Reply Preview */}
          {replyingTo && (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: colors.backgroundGray,
              borderBottomWidth: 1,
              borderBottomColor: colors.borderLight,
            }}>
              <View style={{
                flex: 1,
                borderLeftWidth: 3,
                borderLeftColor: '#fc8727ff',
                paddingLeft: 12,
              }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#fc8727ff', marginBottom: 2 }}>
                  Replying to {replyingTo.senderName}
                </Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary }} numberOfLines={1}>
                  {replyingTo.text || 'Image'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setReplyingTo(null);
                  swipeableRefs.current.forEach(ref => ref?.close());
                }}
                style={{ padding: 8 }}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
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
                color={sending ? '#d1d5db' : '#fc8727ff'} 
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
                color={sending ? '#d1d5db' : '#fc8727ff'} 
              />
            </TouchableOpacity>

            {/* Text Input */}
            <View
              style={{
                flex: 1,
                backgroundColor: colors.backgroundGray,
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
                placeholderTextColor={colors.textSecondary}
                multiline
                maxLength={500}
                editable={!sending}
                style={{
                  fontSize: 16,
                  maxHeight: 100,
                  color: colors.textPrimary,
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
                backgroundColor: messageText.trim() && !sending ? '#fc8727ff' : '#d1d5db',
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

      {/* Message Options Modal */}
      <Modal
        visible={messageOptionsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMessageOptionsVisible(false)}
      >
        <Pressable 
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
          }}
          onPress={() => setMessageOptionsVisible(false)}
        >
          <Pressable 
            style={{
              backgroundColor: colors.backgroundWhite,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingBottom: Platform.OS === 'ios' ? 40 : 20,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Timestamp Header */}
            <View style={{
              paddingVertical: 20,
              paddingHorizontal: 24,
              borderBottomWidth: 1,
              borderBottomColor: colors.backgroundGray,
              alignItems: 'center',
            }}>
              <Text style={{
                fontSize: 14,
                color: colors.textSecondary,
                fontWeight: '500',
              }}>
                {selectedMessage ? formatDetailedTime(selectedMessage.createdAt) : ''}
              </Text>
              {selectedMessage?.text && (
                <Text style={{
                  fontSize: 13,
                  color: colors.textSecondary,
                  marginTop: 6,
                  textAlign: 'center',
                }} numberOfLines={2}>
                  {selectedMessage.text}
                </Text>
              )}
            </View>

            {/* Options */}
            <View style={{ paddingVertical: 8 }}>
              {/* Copy */}
              {selectedMessage?.text && (
                <TouchableOpacity
                  onPress={handleCopyMessage}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 16,
                    paddingHorizontal: 24,
                  }}
                >
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: colors.backgroundGray,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                  }}>
                    <Ionicons name="copy-outline" size={20} color="#fc8727ff" />
                  </View>
                  <Text style={{
                    fontSize: 16,
                    color: colors.textPrimary,
                    fontWeight: '500',
                  }}>
                    Copy
                  </Text>
                </TouchableOpacity>
              )}

              {/* Delete for Me */}
              <TouchableOpacity
                onPress={handleDeleteForMe}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 16,
                  paddingHorizontal: 24,
                }}
              >
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#fef2f2',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                }}>
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </View>
                <Text style={{
                  fontSize: 16,
                  color: '#ef4444',
                  fontWeight: '500',
                }}>
                  Delete for Me
                </Text>
              </TouchableOpacity>

              {/* Unsend for Everyone - only for my messages */}
              {selectedMessage?.senderId === currentUserId && (
                <TouchableOpacity
                  onPress={handleUnsendMessage}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 16,
                    paddingHorizontal: 24,
                  }}
                >
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: '#fef2f2',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                  }}>
                    <Ionicons name="arrow-undo-outline" size={20} color="#ef4444" />
                  </View>
                  <Text style={{
                    fontSize: 16,
                    color: '#ef4444',
                    fontWeight: '500',
                  }}>
                    Unsend for Everyone
                  </Text>
                </TouchableOpacity>
              )}

              {/* Cancel */}
              <TouchableOpacity
                onPress={() => setMessageOptionsVisible(false)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 16,
                  paddingHorizontal: 24,
                  marginTop: 8,
                }}
              >
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.backgroundGray,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                }}>
                  <Ionicons name="close-outline" size={24} color={colors.textSecondary} />
                </View>
                <Text style={{
                  fontSize: 16,
                  color: colors.textSecondary,
                  fontWeight: '500',
                }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
