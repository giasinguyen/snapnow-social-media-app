import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  QueryConstraint,
  startAfter,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderPhoto: string;
  receiverId: string;
  type: 'text' | 'image';
  text: string;
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  createdAt: Timestamp;
  readAt?: Timestamp | null;
  isRead: boolean;
}

export interface MessageInput {
  conversationId: string;
  senderId: string;
  senderName: string;
  senderPhoto: string;
  receiverId: string;
  type: 'text' | 'image';
  text: string;
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
}

/**
 * Send a new message in a conversation
 */
export const sendMessage = async (messageData: MessageInput): Promise<Message> => {
  try {
    const { conversationId, ...restData } = messageData;
    
    // Check if conversation exists, if not we'll handle it gracefully
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationDoc = await getDoc(conversationRef);
    
    // Add message to subcollection
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const docRef = await addDoc(messagesRef, {
      ...restData,
      conversationId,
      createdAt: serverTimestamp(),
      readAt: null,
      isRead: false,
    });

    // Update conversation's last message (only if conversation exists)
    if (conversationDoc.exists()) {
      const currentUnreadCount = conversationDoc.data()?.unreadCount?.[messageData.receiverId] || 0;
      
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
        // Increment unread count for receiver
        [`unreadCount.${messageData.receiverId}`]: currentUnreadCount + 1,
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
 * Delete a message
 */
export const deleteMessage = async (
  conversationId: string,
  messageId: string
): Promise<void> => {
  try {
    const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    await deleteDoc(messageRef);
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
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
  getUnreadCount,
  searchMessages,
};
