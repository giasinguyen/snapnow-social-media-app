import {
  collection,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Conversation {
  id: string;
  participants: string[];
  participantDetails: {
    [userId: string]: {
      id: string;
      displayName: string;
      photoURL: string;
      username: string;
    };
  };
  lastMessage: {
    text: string;
    senderId: string;
    senderName: string;
    timestamp: Timestamp;
    type: 'text' | 'image';
    imageUrl?: string;
  } | null;
  unreadCount: {
    [userId: string]: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ConversationInput {
  currentUserId: string;
  currentUserName: string;
  currentUserPhoto: string;
  currentUserUsername: string;
  otherUserId: string;
  otherUserName: string;
  otherUserPhoto: string;
  otherUserUsername: string;
}

/**
 * Generate conversation ID from two user IDs (always in same order)
 */
export const generateConversationId = (userId1: string, userId2: string): string => {
  return [userId1, userId2].sort().join('_');
};

/**
 * Create or get existing conversation between two users
 */
export const createConversation = async (
  conversationData: ConversationInput
): Promise<Conversation> => {
  try {
    const {
      currentUserId,
      currentUserName,
      currentUserPhoto,
      currentUserUsername,
      otherUserId,
      otherUserName,
      otherUserPhoto,
      otherUserUsername,
    } = conversationData;

    console.log('🆕 Creating/getting conversation between:', currentUserId, 'and', otherUserId);

    const conversationId = generateConversationId(currentUserId, otherUserId);
    const conversationRef = doc(db, 'conversations', conversationId);

    // Check if conversation already exists
    const existingConversation = await getDoc(conversationRef);
    if (existingConversation.exists()) {
      console.log('✅ Conversation already exists:', conversationId);
      return {
        id: existingConversation.id,
        ...existingConversation.data(),
      } as Conversation;
    }

    // Create new conversation
    const newConversation = {
      participants: [currentUserId, otherUserId],
      participantDetails: {
        [currentUserId]: {
          id: currentUserId,
          displayName: currentUserName,
          photoURL: currentUserPhoto,
          username: currentUserUsername,
        },
        [otherUserId]: {
          id: otherUserId,
          displayName: otherUserName,
          photoURL: otherUserPhoto,
          username: otherUserUsername,
        },
      },
      lastMessage: null,
      unreadCount: {
        [currentUserId]: 0,
        [otherUserId]: 0,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    console.log('💾 Saving new conversation:', conversationId, 'participants:', newConversation.participants);
    await setDoc(conversationRef, newConversation);

    const createdDoc = await getDoc(conversationRef);
    console.log('✅ Conversation created successfully:', conversationId);
    
    return {
      id: createdDoc.id,
      ...createdDoc.data(),
    } as Conversation;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
};

/**
 * Get all conversations for a user
 */
export const getUserConversations = async (userId: string): Promise<Conversation[]> => {
  try {
    const conversationsRef = collection(db, 'conversations');
    // Simplified query - sort client-side to avoid index requirement
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', userId)
    );

    const snapshot = await getDocs(q);
    const conversations = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Conversation[];

    // Sort client-side by updatedAt
    return conversations.sort((a, b) => {
      const timeA = a.updatedAt?.toMillis?.() || 0;
      const timeB = b.updatedAt?.toMillis?.() || 0;
      return timeB - timeA; // Descending order
    });
  } catch (error) {
    console.error('Error getting user conversations:', error);
    throw error;
  }
};

/**
 * Subscribe to realtime conversation updates
 * Uses client-side sorting to avoid Firebase composite index requirement
 */
export const subscribeToConversations = (
  userId: string,
  onConversationsUpdate: (conversations: Conversation[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  console.log('🔔 Setting up conversation subscription for user:', userId);
  
  try {
    const conversationsRef = collection(db, 'conversations');
    
    // Query all conversations where user is a participant
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', userId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log('📦 Received snapshot with', snapshot.docs.length, 'conversations');
        
        const conversations = snapshot.docs.map((doc) => {
          const data = doc.data();
          console.log('📄 Conversation:', doc.id, 'participants:', data.participants);
          
          return {
            id: doc.id,
            ...data,
          } as Conversation;
        });
        
        // Sort client-side by updatedAt (newest first)
        const sortedConversations = conversations.sort((a, b) => {
          const timeA = a.updatedAt?.toMillis?.() || 0;
          const timeB = b.updatedAt?.toMillis?.() || 0;
          return timeB - timeA;
        });
        
        console.log('✅ Sorted conversations:', sortedConversations.length);
        onConversationsUpdate(sortedConversations);
      },
      (error) => {
        console.error('❌ Error in conversation snapshot:', error);
        onError?.(error as Error);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('❌ Error setting up conversation subscription:', error);
    onError?.(error as Error);
    return () => {}; // Return empty function on error
  }
};

/**
 * Get a single conversation by ID
 */
export const getConversation = async (conversationId: string): Promise<Conversation | null> => {
  try {
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationDoc = await getDoc(conversationRef);

    if (!conversationDoc.exists()) {
      return null;
    }

    return {
      id: conversationDoc.id,
      ...conversationDoc.data(),
    } as Conversation;
  } catch (error) {
    console.error('Error getting conversation:', error);
    throw error;
  }
};

/**
 * Subscribe to a single conversation
 */
export const subscribeToConversation = (
  conversationId: string,
  onConversationUpdate: (conversation: Conversation | null) => void,
  onError?: (error: Error) => void
): (() => void) => {
  try {
    const conversationRef = doc(db, 'conversations', conversationId);

    const unsubscribe = onSnapshot(
      conversationRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          onConversationUpdate(null);
          return;
        }

        const conversation = {
          id: snapshot.id,
          ...snapshot.data(),
        } as Conversation;
        onConversationUpdate(conversation);
      },
      (error) => {
        console.error('Error subscribing to conversation:', error);
        onError?.(error as Error);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up conversation subscription:', error);
    throw error;
  }
};

/**
 * Delete a conversation
 */
export const deleteConversation = async (conversationId: string): Promise<void> => {
  try {
    const conversationRef = doc(db, 'conversations', conversationId);
    await deleteDoc(conversationRef);
  } catch (error) {
    console.error('Error deleting conversation:', error);
    throw error;
  }
};

/**
 * Get other participant info from conversation
 */
export const getOtherParticipant = (
  conversation: Conversation,
  currentUserId: string
): {
  id: string;
  displayName: string;
  photoURL: string;
  username: string;
} | null => {
  const otherUserId = conversation.participants.find((id) => id !== currentUserId);
  if (!otherUserId) return null;

  const details = conversation.participantDetails[otherUserId];
  if (!details) return null;

  return {
    id: otherUserId,
    ...details,
  };
};

/**
 * Get total unread count across all conversations
 */
export const getTotalUnreadCount = async (userId: string): Promise<number> => {
  try {
    const conversations = await getUserConversations(userId);
    const totalUnread = conversations.reduce((total, conv) => {
      return total + (conv.unreadCount[userId] || 0);
    }, 0);
    return totalUnread;
  } catch (error) {
    console.error('Error getting total unread count:', error);
    return 0;
  }
};

/**
 * Update participant details (e.g., when user updates profile)
 */
export const updateParticipantDetails = async (
  userId: string,
  updates: {
    displayName?: string;
    photoURL?: string;
    username?: string;
  }
): Promise<void> => {
  try {
    const conversationsRef = collection(db, 'conversations');
    const q = query(conversationsRef, where('participants', 'array-contains', userId));

    const snapshot = await getDocs(q);
    const updatePromises = snapshot.docs.map((doc) => {
      const updateData: any = {};
      if (updates.displayName) {
        updateData[`participantDetails.${userId}.displayName`] = updates.displayName;
      }
      if (updates.photoURL) {
        updateData[`participantDetails.${userId}.photoURL`] = updates.photoURL;
      }
      if (updates.username) {
        updateData[`participantDetails.${userId}.username`] = updates.username;
      }
      return updateDoc(doc.ref, updateData);
    });

    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error updating participant details:', error);
    throw error;
  }
};

export default {
  generateConversationId,
  createConversation,
  getUserConversations,
  subscribeToConversations,
  getConversation,
  subscribeToConversation,
  deleteConversation,
  getOtherParticipant,
  getTotalUnreadCount,
  updateParticipantDetails,
};
