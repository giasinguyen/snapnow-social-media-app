import {
  addDoc,
  collection,
  doc,
  DocumentSnapshot,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  QueryConstraint,
  serverTimestamp,
  startAfter,
  Timestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderPhoto: string;
  receiverId?: string; // Optional for group chats
  type: 'text' | 'image' | 'system';
  text: string;
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  storyId?: string; // Reference to story being replied to
  storyImageUrl?: string; // Story image for preview
  replyTo?: {
    messageId: string;
    text: string;
    senderName: string;
    imageUrl?: string;
  }; // Message being replied to
  createdAt: Timestamp;
  readAt?: Timestamp | null;
  isRead: boolean;
  deletedBy?: string[]; // Array of user IDs who deleted this message
  deletedForEveryone?: boolean; // True if sender unsent the message
}

export interface MessageInput {
  conversationId: string;
  senderId: string;
  senderName: string;
  senderPhoto: string;
  receiverId?: string; // Optional for group chats
  type: 'text' | 'image' | 'system';
  text: string;
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  storyId?: string; // Reference to story being replied to
  storyImageUrl?: string; // Story image for preview
  replyTo?: {
    messageId: string;
    text: string;
    senderName: string;
    imageUrl?: string;
  }; // Message being replied to
}

/**
 * Send a new message in a conversation
 */
export const sendMessage = async (messageData: MessageInput): Promise<Message> => {
  try {
    const { conversationId, receiverId, ...restData } = messageData;
    
    // Check if conversation exists, if not we'll handle it gracefully
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationDoc = await getDoc(conversationRef);
    
    // Prepare message data - only include receiverId if it exists
    const messageDocData: any = {
      ...restData,
      conversationId,
      createdAt: serverTimestamp(),
      readAt: null,
      isRead: false,
    };
    
    // Only add receiverId if it's defined (not for group chats)
    if (receiverId) {
      messageDocData.receiverId = receiverId;
    }
    
    // Add message to subcollection
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const docRef = await addDoc(messagesRef, messageDocData);

    // Update conversation's last message (only if conversation exists)
    if (conversationDoc.exists()) {
      const conversationData = conversationDoc.data();
      const isGroupChat = conversationData?.isGroupChat || false;
      
      // For group chats, update unread count for all participants except sender
      const unreadUpdate: any = {};
      if (isGroupChat && conversationData?.participants) {
        conversationData.participants.forEach((participantId: string) => {
          if (participantId !== messageData.senderId) {
            const currentCount = conversationData?.unreadCount?.[participantId] || 0;
            unreadUpdate[`unreadCount.${participantId}`] = currentCount + 1;
          }
        });
      } else if (messageData.receiverId) {
        // For 1-1 chat, only update receiver's unread count
        const currentUnreadCount = conversationData?.unreadCount?.[messageData.receiverId] || 0;
        unreadUpdate[`unreadCount.${messageData.receiverId}`] = currentUnreadCount + 1;
      }
      
      await updateDoc(conversationRef, {
        lastMessage: {
          text: messageData.text,
          senderId: messageData.senderId,
          senderName: messageData.senderName,
          timestamp: serverTimestamp(),
          type: messageData.type,
          imageUrl: messageData.imageUrl || null,
        },
        updatedAt: serverTimestamp(),
        // Update unread counts (either for receiver in 1-1 or all participants in group)
        ...unreadUpdate,
      });
    }

    // Get the created message
    const messageDoc = await getDoc(docRef);
    return {
      id: messageDoc.id,
      ...messageDoc.data(),
    } as Message;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Get messages in a conversation with pagination
 */
export const getMessages = async (
  conversationId: string,
  pageSize: number = 50,
  lastDoc?: DocumentSnapshot
): Promise<{ messages: Message[]; lastDocument: DocumentSnapshot | null }> => {
  try {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const constraints: QueryConstraint[] = [
      orderBy('createdAt', 'asc'),
      limit(pageSize),
    ];

    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    const q = query(messagesRef, ...constraints);
    const snapshot = await getDocs(q);

    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Message[];

    return {
      messages,
      lastDocument: snapshot.docs[snapshot.docs.length - 1] || null,
    };
  } catch (error) {
    console.error('Error getting messages:', error);
    throw error;
  }
};

/**
 * Subscribe to realtime messages in a conversation
 */
export const subscribeToMessages = (
  conversationId: string,
  onMessagesUpdate: (messages: Message[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  try {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const messages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Message[];
        onMessagesUpdate(messages);
      },
      (error) => {
        console.error('Error subscribing to messages:', error);
        onError?.(error as Error);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up message subscription:', error);
    throw error;
  }
};

/**
 * Mark a message as read
 */
export const markMessageAsRead = async (
  conversationId: string,
  messageId: string
): Promise<void> => {
  try {
    const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    await updateDoc(messageRef, {
      isRead: true,
      readAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
};

/**
 * Mark all messages in a conversation as read for current user
 */
export const markAllMessagesAsRead = async (
  conversationId: string,
  currentUserId: string
): Promise<void> => {
  try {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(
      messagesRef,
      where('receiverId', '==', currentUserId),
      where('isRead', '==', false)
    );

    const snapshot = await getDocs(q);
    const updatePromises = snapshot.docs.map((doc) =>
      updateDoc(doc.ref, {
        isRead: true,
        readAt: serverTimestamp(),
      })
    );

    await Promise.all(updatePromises);

    // Reset unread count in conversation (only if exists)
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationDoc = await getDoc(conversationRef);
    
    if (conversationDoc.exists()) {
      await updateDoc(conversationRef, {
        [`unreadCount.${currentUserId}`]: 0,
      });
    }
  } catch (error) {
    console.error('Error marking all messages as read:', error);
    // Don't throw - just log the error
  }
};

/**
 * Delete a message (soft delete - only hide for current user)
 */
export const deleteMessage = async (
  conversationId: string,
  messageId: string,
  userId: string
): Promise<void> => {
  try {
    const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    const messageDoc = await getDoc(messageRef);
    
    if (!messageDoc.exists()) {
      throw new Error('Message not found');
    }

    const currentDeletedBy = messageDoc.data()?.deletedBy || [];
    
    await updateDoc(messageRef, {
      deletedBy: [...currentDeletedBy, userId],
    });
  } catch (error) {
    console.error('Error deleting message for user:', error);
    throw error;
  }
};

/**
 * Send a system notification message in a conversation
 */
export const sendSystemMessage = async (
  conversationId: string,
  text: string
): Promise<void> => {
  try {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    await addDoc(messagesRef, {
      conversationId,
      senderId: 'system',
      senderName: 'System',
      senderPhoto: '',
      type: 'system',
      text,
      createdAt: serverTimestamp(),
      readAt: null,
      isRead: false,
    });

    // Update conversation's last message
    const conversationRef = doc(db, 'conversations', conversationId);
    await updateDoc(conversationRef, {
      lastMessage: {
        text,
        senderId: 'system',
        senderName: 'System',
        timestamp: serverTimestamp(),
        type: 'system',
      },
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error sending system message:', error);
    throw error;
  }
};

/**
 * Unsend a message (hard delete for everyone - only sender can do this)
 */
export const unsendMessage = async (
  conversationId: string,
  messageId: string,
  senderId: string
): Promise<void> => {
  try {
    const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    const messageDoc = await getDoc(messageRef);
    
    if (!messageDoc.exists()) {
      throw new Error('Message not found');
    }

    // Verify the user is the sender
    if (messageDoc.data()?.senderId !== senderId) {
      throw new Error('Only the sender can unsend a message');
    }

    // Mark as deleted for everyone instead of hard delete (to preserve conversation history)
    await updateDoc(messageRef, {
      deletedForEveryone: true,
      text: 'This message was deleted',
    });
  } catch (error) {
    console.error('Error unsending message:', error);
    throw error;
  }
};

/**
 * Copy message text to clipboard
 */
export const copyMessageText = (text: string): string => {
  return text;
};

/**
 * Get unread message count for a conversation
 */
export const getUnreadCount = async (
  conversationId: string,
  userId: string
): Promise<number> => {
  try {
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationDoc = await getDoc(conversationRef);
    
    if (!conversationDoc.exists()) {
      return 0;
    }

    return conversationDoc.data()?.unreadCount?.[userId] || 0;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

/**
 * Search messages in a conversation
 */
export const searchMessages = async (
  conversationId: string,
  searchText: string
): Promise<Message[]> => {
  try {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(
      messagesRef,
      where('type', '==', 'text'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const allMessages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Message[];
    
    const messages = allMessages.filter((msg) =>
      msg.text?.toLowerCase().includes(searchText.toLowerCase())
    );

    return messages;
  } catch (error) {
    console.error('Error searching messages:', error);
    throw error;
  }
};

export default {
  sendMessage,
  getMessages,
  subscribeToMessages,
  markMessageAsRead,
  markAllMessagesAsRead,
  deleteMessage,
  unsendMessage,
  copyMessageText,
  getUnreadCount,
  searchMessages,
};
