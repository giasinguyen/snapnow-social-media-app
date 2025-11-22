import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { auth } from '../../config/firebase';
import { useTheme } from '../../contexts/ThemeContext';
import {
    AIMessage,
    clearAIConversation,
    generateImageWithAI,
    getAIConversationHistory,
    sendMessageToAI,
    subscribeToAIConversation,
} from '../../services/aiChat';

export default function AIChatScreen() {
  const { colors } = useTheme();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const currentUser = auth.currentUser;
  const currentUserId = currentUser?.uid || '';

  // Load conversation history
  useEffect(() => {
    if (!currentUserId) return;

    const loadHistory = async () => {
      try {
        const history = await getAIConversationHistory(currentUserId, 100);
        setMessages(history);
      } catch (error) {
        console.error('Error loading AI conversation:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToAIConversation(
      currentUserId,
      (updatedMessages) => {
        setMessages(updatedMessages);
      },
      100
    );

    return () => unsubscribe();
  }, [currentUserId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || sending || generatingImage) return;

    const userMessage = messageText.trim();
    
    // Check if user wants to generate an image
    const imageKeywords = ['tạo ảnh', 'vẽ', 'generate image', 'create image', 'draw', 'hình ảnh về'];
    const isImageRequest = imageKeywords.some(keyword => 
      userMessage.toLowerCase().includes(keyword)
    );

    setMessageText('');

    if (isImageRequest) {
      // Generate image
      setGeneratingImage(true);
      try {
        // Extract the prompt (remove the command part)
        let imagePrompt = userMessage;
        imageKeywords.forEach(keyword => {
          imagePrompt = imagePrompt.replace(new RegExp(keyword, 'gi'), '').trim();
        });
        
        if (!imagePrompt) {
          Alert.alert('Lỗi', 'Vui lòng mô tả ảnh bạn muốn tạo');
          setGeneratingImage(false);
          return;
        }

        console.log('🎨 Starting image generation with prompt:', imagePrompt);
        await generateImageWithAI(imagePrompt, currentUserId);
        console.log('✅ Image generation complete!');
      } catch (error: any) {
        console.error('Error generating image:', error);
        Alert.alert(
          'Lỗi tạo ảnh', 
          error.message || 'Không thể tạo ảnh. Vui lòng thử lại sau.'
        );
      } finally {
        setGeneratingImage(false);
      }
    } else {
      // Send text message
      setSending(true);
      try {
        await sendMessageToAI(userMessage, currentUserId, messages);
      } catch (error: any) {
        console.error('Error sending message to AI:', error);
        Alert.alert('Lỗi', error.message || 'Không thể gửi tin nhắn đến AI');
      } finally {
        setSending(false);
      }
    }
  };

  const handleClearConversation = async () => {
    Alert.alert(
      'Xóa lịch sử chat?',
      'Bạn có chắc muốn xóa toàn bộ lịch sử chat với AI?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAIConversation(currentUserId);
              setMessages([]);
            } catch (error) {
              console.error('Error clearing conversation:', error);
              Alert.alert('Lỗi', 'Không thể xóa lịch sử chat');
            }
          },
        },
      ]
    );
  };

  const renderMessage = ({ item }: { item: AIMessage }) => {
    const isUser = item.role === 'user';

    return (
      <View style={[styles.messageContainer, isUser ? styles.userMessageContainer : styles.aiMessageContainer]}>
        <View style={styles.messageWrapper}>
          {!isUser && (
            <View style={styles.aiAvatarSmall}>
              <Ionicons name="sparkles" size={16} color="white" />
            </View>
          )}
          
          <View
            style={[
              styles.messageBubble,
              isUser ? styles.userBubble : { backgroundColor: colors.backgroundGray }
            ]}
          >
            <Text style={[styles.messageText, isUser ? styles.userText : { color: colors.textPrimary }]}>
              {item.text}
            </Text>
            
            {/* Display AI-generated image */}
            {item.imageUrl && !isUser && (
              <View style={styles.imageContainer}>
                <Image 
                  source={{ uri: item.imageUrl }} 
                  style={styles.generatedImage}
                  resizeMode="cover"
                />
                {item.imagePrompt && (
                  <Text style={[styles.imagePromptText, { color: colors.textSecondary }]}>
                    Prompt: {item.imagePrompt}
                  </Text>
                )}
              </View>
            )}
          </View>

          {isUser && (
            <View style={styles.userAvatar}>
              <Ionicons name="person" size={16} color="white" />
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderSuggestedPrompts = () => {
    const prompts = [
      { icon: 'camera', text: 'Gợi ý chụp ảnh', prompt: 'Cho tôi gợi ý chụp ảnh đẹp cho Instagram' },
      { icon: 'text', text: 'Viết caption', prompt: 'Giúp tôi viết caption hay cho bài đăng' },
      { icon: 'image', text: 'Tạo ảnh AI', prompt: 'Tạo ảnh một con mèo dễ thương trong vườn hoa' },
      { icon: 'bulb', text: 'Ý tưởng post', prompt: 'Cho tôi ý tưởng nội dung thú vị' },
    ];

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.promptsContainer}
        contentContainerStyle={styles.promptsContent}
      >
        {prompts.map((prompt, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => {
              setMessageText(prompt.prompt);
            }}
            style={[styles.promptChip, { backgroundColor: colors.backgroundGray }]}
          >
            <Ionicons
              name={prompt.icon as any}
              size={16}
              color={colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.promptText, { color: colors.textPrimary }]}>
              {prompt.text}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.backgroundWhite }]}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'SnapNow AI',
            headerBackTitle: 'Back',
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundWhite }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'SnapNow AI',
          headerBackTitle: 'Messages',
          headerRight: () => (
            <TouchableOpacity
              onPress={handleClearConversation}
              style={{ marginRight: 12 }}
            >
              <Ionicons name="trash-outline" size={22} color="#fc8727ff" />
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Welcome Banner */}
        {messages.length === 0 && (
          <View style={styles.emptyState}>
            <LinearGradient
              colors={['#fc8727ff', '#764ba2']}
              style={styles.welcomeAvatar}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="sparkles" size={40} color="white" />
            </LinearGradient>
            <Text style={[styles.welcomeTitle, { color: colors.textPrimary }]}>SnapNow AI</Text>
            <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
              Xin chào! Tôi là trợ lý AI của SnapNow. {'\n'}
              💬 Hỏi tôi bất cứ điều gì về chụp ảnh, caption, hashtag...{'\n'}
              🎨 Hoặc gõ &quot;Tạo ảnh về...&quot; để tôi tạo ảnh AI cho bạn! ✨
            </Text>
            {renderSuggestedPrompts()}
          </View>
        )}

        {/* Messages List */}
        {messages.length > 0 && (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            ListHeaderComponent={renderSuggestedPrompts}
            onContentSizeChange={() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }}
          />
        )}

        {/* Input Area */}
        <View style={[styles.inputContainer, { backgroundColor: colors.backgroundWhite, borderTopColor: colors.borderLight }]}>
          {(sending || generatingImage) && (
            <View style={styles.loadingIndicator}>
              <ActivityIndicator size="small" color="#fc8727ff" />
              <Text style={[styles.loadingText, { color: colors.primary }]}>
                {generatingImage ? '🎨 Đang tạo ảnh với AI... (30-60 giây)' : '💬 AI đang trả lời...'}
              </Text>
            </View>
          )}
          
          <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundGray }]}>
            <TextInput
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Nhắn tin hoặc 'Tạo ảnh về...' để tạo ảnh AI"
              placeholderTextColor={colors.textSecondary}
              style={[styles.textInput, { color: colors.textPrimary }]}
              multiline
              maxLength={1000}
              editable={!sending && !generatingImage}
            />
            
            {(sending || generatingImage) ? (
              <ActivityIndicator size="small" color="#fc8727ff" />
            ) : (
              <TouchableOpacity
                onPress={handleSendMessage}
                disabled={!messageText.trim() || sending || generatingImage}
                style={[
                  styles.sendButton,
                  messageText.trim() ? styles.sendButtonActive : styles.sendButtonInactive
                ]}
              >
                <Ionicons name="send" size={16} color="white" />
              </TouchableOpacity>
            )}
          </View>
          
          <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
            AI có thể mắc lỗi. Hãy kiểm tra thông tin quan trọng.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  messagesList: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  messageContainer: {
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  aiMessageContainer: {
    alignItems: 'flex-start',
  },
  messageWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    maxWidth: '80%',
  },
  aiAvatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fc8727ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 2,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fc8727ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    marginBottom: 2,
  },
  userBubble: {
    backgroundColor: '#fc8727ff',
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: '#ffffff',
  },
  imageContainer: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  generatedImage: {
    width: 256,
    height: 256,
    borderRadius: 12,
  },
  imagePromptText: {
    fontSize: 11,
    marginTop: 6,
    fontStyle: 'italic',
  },
  promptsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  promptsContent: {
    gap: 8,
  },
  promptChip: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  promptText: {
    fontSize: 14,
  },
  inputContainer: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#fc8727ff',
  },
  sendButtonInactive: {
    backgroundColor: '#d1d5db',
  },
  disclaimer: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
  },
});
