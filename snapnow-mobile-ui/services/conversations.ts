import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
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
  archivedBy?: string[]; // Array of user IDs who archived this conversation
  isGroupChat?: boolean; // True if this is a group conversation
  groupName?: string; // Name for group chats
  groupPhoto?: string; // Photo for group chats
  admins?: string[]; // Array of admin user IDs for group chats
  createdBy?: string; // Creator user ID for group chats
  nicknames?: {
    [userId: string]: string; // Nicknames set by each user for other participants
  };
  theme?: 'default' | 'purple' | 'blue' | 'dark'; // Optional theme for the conversation
  requireApproval?: boolean; // Whether non-admin member additions require admin approval
  pendingRequests?: Array<{
    userId: string;
    displayName: string;
    photoURL: string;
    username: string;
    requestedAt: Timestamp;
    addedBy?: string;
  }>; // Pending join requests for group chats
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

  // details already has id field from type definition
  return details;
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
 * Subscribe to total unread count (real-time)
 */
export const subscribeToUnreadCount = (
  userId: string,
  onUpdate: (count: number) => void,
  onError?: (error: Error) => void
): (() => void) => {
  try {
    console.log('🔔 Setting up unread count subscription for user:', userId);
    
    const conversationsRef = collection(db, 'conversations');
    const q = query(conversationsRef, where('participants', 'array-contains', userId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const totalUnread = snapshot.docs.reduce((total, doc) => {
          const conv = doc.data() as Conversation;
          return total + (conv.unreadCount?.[userId] || 0);
        }, 0);
        
        console.log('📊 Total unread count:', totalUnread);
        onUpdate(totalUnread);
      },
      (error) => {
        console.error('❌ Error in unread count subscription:', error);
        if (onError) {
          onError(error as Error);
        }
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('❌ Error setting up unread count subscription:', error);
    if (onError) {
      onError(error as Error);
    }
    return () => {};
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

/**
 * Archive a conversation for current user
 */
export const archiveConversation = async (
  conversationId: string,
  userId: string
): Promise<void> => {
  try {
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationDoc = await getDoc(conversationRef);
    
    if (!conversationDoc.exists()) {
      throw new Error('Conversation not found');
    }

    const currentArchivedBy = conversationDoc.data()?.archivedBy || [];
    
    if (!currentArchivedBy.includes(userId)) {
      await updateDoc(conversationRef, {
        archivedBy: [...currentArchivedBy, userId],
      });
    }
  } catch (error) {
    console.error('Error archiving conversation:', error);
    throw error;
  }
};

/**
 * Unarchive a conversation for current user
 */
export const unarchiveConversation = async (
  conversationId: string,
  userId: string
): Promise<void> => {
  try {
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationDoc = await getDoc(conversationRef);
    
    if (!conversationDoc.exists()) {
      throw new Error('Conversation not found');
    }

    const currentArchivedBy = conversationDoc.data()?.archivedBy || [];
    const updatedArchivedBy = currentArchivedBy.filter((id: string) => id !== userId);
    
    await updateDoc(conversationRef, {
      archivedBy: updatedArchivedBy,
    });
  } catch (error) {
    console.error('Error unarchiving conversation:', error);
    throw error;
  }
};

/**
 * Get archived conversations for a user
 */
export const getArchivedConversations = async (userId: string): Promise<Conversation[]> => {
  try {
    const allConversations = await getUserConversations(userId);
    return allConversations.filter((conv) => conv.archivedBy?.includes(userId));
  } catch (error) {
    console.error('Error getting archived conversations:', error);
    throw error;
  }
};

/**
 * Generate invite link for group conversation
 */
export const generateGroupInviteLink = (conversationId: string): string => {
  // In production, this would be a deep link or shortened URL
  return `snapnow://group/join/${conversationId}`;
};

/**
 * Add member to group conversation
 */
export const addGroupMember = async (
  conversationId: string,
  newMemberId: string,
  newMemberName: string,
  newMemberPhoto: string,
  newMemberUsername: string
): Promise<void> => {
  try {
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationDoc = await getDoc(conversationRef);
    
    if (!conversationDoc.exists()) {
      throw new Error('Conversation not found');
    }

    const conversation = conversationDoc.data() as Conversation;
    
    if (!conversation.isGroupChat) {
      throw new Error('This is not a group conversation');
    }

    // Check if user is already a member
    if (conversation.participants.includes(newMemberId)) {
      throw new Error('User is already a member of this group');
    }

    // Add new member to participants
    const updatedParticipants = [...conversation.participants, newMemberId];
    
    // Add new member details
    const updatedParticipantDetails = {
      ...conversation.participantDetails,
      [newMemberId]: {
        id: newMemberId,
        displayName: newMemberName,
        photoURL: newMemberPhoto,
        username: newMemberUsername,
      },
    };

    // Initialize unread count for new member
    const updatedUnreadCount = {
      ...conversation.unreadCount,
      [newMemberId]: 0,
    };

    await updateDoc(conversationRef, {
      participants: updatedParticipants,
      participantDetails: updatedParticipantDetails,
      unreadCount: updatedUnreadCount,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error adding group member:', error);
    throw error;
  }
};

/**
 * Remove member from group conversation
 */
export const removeGroupMember = async (
  conversationId: string,
  memberId: string
): Promise<void> => {
  try {
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationDoc = await getDoc(conversationRef);
    
    if (!conversationDoc.exists()) {
      throw new Error('Conversation not found');
    }

    const conversation = conversationDoc.data() as Conversation;
    
    if (!conversation.isGroupChat) {
      throw new Error('This is not a group conversation');
    }

    // Remove member from participants
    const updatedParticipants = conversation.participants.filter(id => id !== memberId);
    
    // Remove member details
    const updatedParticipantDetails = { ...conversation.participantDetails };
    delete updatedParticipantDetails[memberId];

    // Remove member's unread count
    const updatedUnreadCount = { ...conversation.unreadCount };
    delete updatedUnreadCount[memberId];

    await updateDoc(conversationRef, {
      participants: updatedParticipants,
      participantDetails: updatedParticipantDetails,
      unreadCount: updatedUnreadCount,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error removing group member:', error);
    throw error;
  }
};

/**
 * Join group via invite link
 */
export const joinGroupViaInvite = async (
  conversationId: string,
  userId: string,
  userName: string,
  userPhoto: string,
  userUsername: string
): Promise<void> => {
  try {
    await addGroupMember(conversationId, userId, userName, userPhoto, userUsername);
  } catch (error) {
    console.error('Error joining group:', error);
    throw error;
  }
};

/**
 * Update nickname for a participant in a conversation
 * @param conversationId The conversation ID
 * @param currentUserId The user setting the nickname
 * @param targetUserId The user whose nickname is being set
 * @param nickname The nickname to set (empty string to remove)
 */
export const updateNickname = async (
  conversationId: string,
  currentUserId: string,
  targetUserId: string,
  nickname: string
): Promise<void> => {
  try {
    const conversationRef = doc(db, 'conversations', conversationId);
    const nicknameKey = `nicknames.${currentUserId}_${targetUserId}`;
    
    if (nickname.trim()) {
      await updateDoc(conversationRef, {
        [nicknameKey]: nickname.trim(),
        updatedAt: serverTimestamp(),
      });
    } else {
      // Remove nickname if empty
      await updateDoc(conversationRef, {
        [nicknameKey]: null,
        updatedAt: serverTimestamp(),
      });
    }
    
    console.log('✅ Nickname updated successfully');
  } catch (error) {
    console.error('Error updating nickname:', error);
    throw error;
  }
};

/**
 * Get nickname for a user in a conversation
 * @param conversation The conversation object
 * @param currentUserId The user who set the nickname
 * @param targetUserId The user whose nickname to get
 * @returns The nickname or empty string if not set
 */
export const getNickname = (
  conversation: Conversation | null,
  currentUserId: string,
  targetUserId: string
): string => {
  if (!conversation?.nicknames) return '';
  const nicknameKey = `${currentUserId}_${targetUserId}`;
  return conversation.nicknames[nicknameKey] || '';
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
  subscribeToUnreadCount,
  updateParticipantDetails,
  archiveConversation,
  unarchiveConversation,
  getArchivedConversations,
  generateGroupInviteLink,
  addGroupMember,
  removeGroupMember,
  joinGroupViaInvite,
  updateNickname,
  getNickname,
};
