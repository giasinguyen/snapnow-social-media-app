import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Conversation } from './conversations';

export interface GroupChatInput {
  creatorId: string;
  creatorName: string;
  creatorPhoto: string;
  creatorUsername: string;
  groupName: string;
  groupPhoto?: string;
  participantIds: string[]; // Array of user IDs to add to group
}

export interface GroupParticipant {
  id: string;
  displayName: string;
  photoURL: string;
  username: string;
  isAdmin?: boolean;
  joinedAt?: Timestamp;
}

/**
 * Create a new group conversation
 */
export const createGroupChat = async (
  groupData: GroupChatInput
): Promise<Conversation> => {
  try {
    const {
      creatorId,
      creatorName,
      creatorPhoto,
      creatorUsername,
      groupName,
      groupPhoto,
      participantIds,
    } = groupData;

    // Include creator in participants
    const allParticipants = [creatorId, ...participantIds.filter(id => id !== creatorId)];

    // Create participant details (we'll need to fetch full details from users collection)
    const participantDetails: any = {
      [creatorId]: {
        id: creatorId,
        displayName: creatorName,
        photoURL: creatorPhoto,
        username: creatorUsername,
        isAdmin: true,
      },
    };

    // Initialize unread count for all participants
    const unreadCount: any = {};
    allParticipants.forEach(id => {
      unreadCount[id] = 0;
    });

    const newGroup = {
      participants: allParticipants,
      participantDetails,
      isGroupChat: true,
      groupName,
      groupPhoto: groupPhoto || '',
      lastMessage: null,
      unreadCount,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: creatorId,
      admins: [creatorId],
    };

    // Use auto-generated ID for group chats (not based on participants)
    const groupsRef = collection(db, 'conversations');
    const docRef = await addDoc(groupsRef, newGroup);

    const createdDoc = await getDoc(docRef);
    
    return {
      id: createdDoc.id,
      ...createdDoc.data(),
    } as Conversation;
  } catch (error) {
    console.error('Error creating group chat:', error);
    throw error;
  }
};

/**
 * Add participant to group chat
 */
export const addParticipantToGroup = async (
  conversationId: string,
  participantId: string,
  participantDetails: {
    displayName: string;
    photoURL: string;
    username: string;
  },
  addedBy?: string
): Promise<void> => {
  try {
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationDoc = await getDoc(conversationRef);

    if (!conversationDoc.exists()) {
      throw new Error('Group chat not found');
    }

    const data = conversationDoc.data();
    if (!data.isGroupChat) {
      throw new Error('Not a group chat');
    }

    // Check if already a participant
    if (data.participants.includes(participantId)) {
      throw new Error('User is already in the group');
    }

    const isAddedByAdmin = addedBy && data.admins?.includes(addedBy);
    const requiresApproval = data.requireApproval && !isAddedByAdmin;

    if (requiresApproval) {
      // Check if already in pending requests
      const pendingRequests = data.pendingRequests || [];
      if (pendingRequests.some((req: any) => req.userId === participantId)) {
        throw new Error('User already has a pending join request');
      }

      // Add to pending requests - use Timestamp.now() instead of serverTimestamp() in arrayUnion
      await updateDoc(conversationRef, {
        pendingRequests: arrayUnion({
          userId: participantId,
          ...participantDetails,
          requestedAt: Timestamp.now(),
          addedBy,
        }),
        updatedAt: serverTimestamp(),
      });

      // Send system notification
      const { sendSystemMessage } = require('./messages');
      await sendSystemMessage(
        conversationId,
        `${participantDetails.displayName} was added by ${data.participantDetails?.[addedBy!]?.displayName || 'a member'} and is pending admin approval`
      );
    } else {
      // Add directly to group
      await updateDoc(conversationRef, {
        participants: arrayUnion(participantId),
        [`participantDetails.${participantId}`]: {
          id: participantId,
          ...participantDetails,
          isAdmin: false,
          joinedAt: Timestamp.now(),
        },
        [`unreadCount.${participantId}`]: 0,
        updatedAt: serverTimestamp(),
      });

      // Send system notification
      const { sendSystemMessage } = require('./messages');
      await sendSystemMessage(conversationId, `${participantDetails.displayName} was added to the group`);
    }
  } catch (error) {
    console.error('Error adding participant to group:', error);
    throw error;
  }
};

/**
 * Remove participant from group chat
 */
export const removeParticipantFromGroup = async (
  conversationId: string,
  participantId: string,
  removedBy: string
): Promise<void> => {
  try {
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationDoc = await getDoc(conversationRef);

    if (!conversationDoc.exists()) {
      throw new Error('Group chat not found');
    }

    const data = conversationDoc.data();
    if (!data.isGroupChat) {
      throw new Error('Not a group chat');
    }

    // Check if remover is admin
    if (!data.admins?.includes(removedBy)) {
      throw new Error('Only admins can remove participants');
    }

    // Cannot remove creator
    if (participantId === data.createdBy) {
      throw new Error('Cannot remove group creator');
    }

    // Remove participant
    const updatedParticipantDetails = { ...data.participantDetails };
    const removedUserName = updatedParticipantDetails[participantId]?.displayName || 'A member';
    delete updatedParticipantDetails[participantId];

    const updatedUnreadCount = { ...data.unreadCount };
    delete updatedUnreadCount[participantId];

    await updateDoc(conversationRef, {
      participants: arrayRemove(participantId),
      participantDetails: updatedParticipantDetails,
      unreadCount: updatedUnreadCount,
      updatedAt: serverTimestamp(),
    });

    // Send system notification
    const { sendSystemMessage } = require('./messages');
    await sendSystemMessage(conversationId, `${removedUserName} was removed from the group`);
  } catch (error) {
    console.error('Error removing participant from group:', error);
    throw error;
  }
};

/**
 * Leave group chat
 */
export const leaveGroupChat = async (
  conversationId: string,
  userId: string
): Promise<void> => {
  try {
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationDoc = await getDoc(conversationRef);

    if (!conversationDoc.exists()) {
      throw new Error('Group chat not found');
    }

    const data = conversationDoc.data();
    if (!data.isGroupChat) {
      throw new Error('Not a group chat');
    }

    // Creator cannot leave, must delete group instead
    if (userId === data.createdBy) {
      throw new Error('Group creator cannot leave. Delete the group instead.');
    }

    // Remove user from participants
    const updatedParticipantDetails = { ...data.participantDetails };
    delete updatedParticipantDetails[userId];

    const updatedUnreadCount = { ...data.unreadCount };
    delete updatedUnreadCount[userId];

    // Remove from admins if applicable
    const updatedAdmins = (data.admins || []).filter((id: string) => id !== userId);

    const userDisplayName = data.participantDetails[userId]?.displayName || 'A member';

    await updateDoc(conversationRef, {
      participants: arrayRemove(userId),
      participantDetails: updatedParticipantDetails,
      unreadCount: updatedUnreadCount,
      admins: updatedAdmins,
      updatedAt: serverTimestamp(),
    });

    // Send system notification
    const { sendSystemMessage } = require('./messages');
    await sendSystemMessage(conversationId, `${userDisplayName} left the group`);
  } catch (error) {
    console.error('Error leaving group chat:', error);
    throw error;
  }
};

/**
 * Make participant admin
 */
export const makeGroupAdmin = async (
  conversationId: string,
  participantId: string,
  requesterId: string
): Promise<void> => {
  try {
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationDoc = await getDoc(conversationRef);

    if (!conversationDoc.exists()) {
      throw new Error('Group chat not found');
    }

    const data = conversationDoc.data();
    if (!data.isGroupChat) {
      throw new Error('Not a group chat');
    }

    // Only creator or existing admins can make new admins
    if (!data.admins?.includes(requesterId)) {
      throw new Error('Only admins can make other users admin');
    }

    // Check if user is in group
    if (!data.participants.includes(participantId)) {
      throw new Error('User is not in the group');
    }

    await updateDoc(conversationRef, {
      admins: arrayUnion(participantId),
      [`participantDetails.${participantId}.isAdmin`]: true,
      updatedAt: serverTimestamp(),
    });

    // Send system notification
    const { sendSystemMessage } = require('./messages');
    const newAdminName = data.participantDetails[participantId]?.displayName || 'A member';
    await sendSystemMessage(conversationId, `${newAdminName} is now an admin`);
  } catch (error) {
    console.error('Error making group admin:', error);
    throw error;
  }
};

/**
 * Remove admin status
 */
export const removeGroupAdmin = async (
  conversationId: string,
  participantId: string,
  requesterId: string
): Promise<void> => {
  try {
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationDoc = await getDoc(conversationRef);

    if (!conversationDoc.exists()) {
      throw new Error('Group chat not found');
    }

    const data = conversationDoc.data();
    if (!data.isGroupChat) {
      throw new Error('Not a group chat');
    }

    // Only creator can remove admins
    if (requesterId !== data.createdBy) {
      throw new Error('Only group creator can remove admin status');
    }

    // Cannot remove creator's admin status
    if (participantId === data.createdBy) {
      throw new Error('Cannot remove admin status from group creator');
    }

    await updateDoc(conversationRef, {
      admins: arrayRemove(participantId),
      [`participantDetails.${participantId}.isAdmin`]: false,
      updatedAt: serverTimestamp(),
    });

    // Send system notification
    const { sendSystemMessage } = require('./messages');
    const removedAdminName = data.participantDetails[participantId]?.displayName || 'A member';
    await sendSystemMessage(conversationId, `${removedAdminName} is no longer an admin`);
  } catch (error) {
    console.error('Error removing group admin:', error);
    throw error;
  }
};

/**
 * Update group details (name, photo)
 */
export const updateGroupDetails = async (
  conversationId: string,
  requesterId: string,
  updates: {
    groupName?: string;
    groupPhoto?: string;
  }
): Promise<void> => {
  try {
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationDoc = await getDoc(conversationRef);

    if (!conversationDoc.exists()) {
      throw new Error('Group chat not found');
    }

    const data = conversationDoc.data();
    if (!data.isGroupChat) {
      throw new Error('Not a group chat');
    }

    // Allow any participant to update group details
    if (!data.participants.includes(requesterId)) {
      throw new Error('Only group members can update group details');
    }

    const updateData: any = {
      updatedAt: serverTimestamp(),
    };

    const updaterName = data.participantDetails[requesterId]?.displayName || 'Someone';
    let systemMessage = '';

    if (updates.groupName) {
      updateData.groupName = updates.groupName;
      systemMessage = `${updaterName} changed the group name to "${updates.groupName}"`;
    }
    if (updates.groupPhoto !== undefined) {
      updateData.groupPhoto = updates.groupPhoto;
      if (systemMessage) {
        systemMessage += ' and updated the group photo';
      } else {
        systemMessage = `${updaterName} updated the group photo`;
      }
    }

    await updateDoc(conversationRef, updateData);

    // Send system notification if there were changes
    if (systemMessage) {
      const { sendSystemMessage } = require('./messages');
      await sendSystemMessage(conversationId, systemMessage);
    }
  } catch (error) {
    console.error('Error updating group details:', error);
    throw error;
  }
};

/**
 * Get all group chats for a user
 */
export const getUserGroupChats = async (userId: string): Promise<Conversation[]> => {
  try {
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', userId),
      where('isGroupChat', '==', true)
    );

    const snapshot = await getDocs(q);
    const groups = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Conversation[];

    // Sort by updated date
    return groups.sort((a, b) => {
      const timeA = a.updatedAt?.toMillis?.() || 0;
      const timeB = b.updatedAt?.toMillis?.() || 0;
      return timeB - timeA;
    });
  } catch (error) {
    console.error('Error getting user group chats:', error);
    throw error;
  }
};

/**
 * Join a group via invite link
 */
export const joinGroupViaLink = async (
  conversationId: string,
  userId: string,
  userDetails: {
    displayName: string;
    photoURL: string;
    username: string;
  }
): Promise<void> => {
  try {
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationDoc = await getDoc(conversationRef);

    if (!conversationDoc.exists()) {
      throw new Error('Group not found');
    }

    const data = conversationDoc.data();
    if (!data.isGroupChat) {
      throw new Error('This is not a group chat');
    }

    // Check if already a participant
    if (data.participants.includes(userId)) {
      throw new Error('You are already a member of this group');
    }

    // Add user to group
    await updateDoc(conversationRef, {
      participants: arrayUnion(userId),
      [`participantDetails.${userId}`]: {
        id: userId,
        ...userDetails,
        isAdmin: false,
        joinedAt: Timestamp.now(),
      },
      [`unreadCount.${userId}`]: 0,
      updatedAt: serverTimestamp(),
    });

    // Send system notification
    const { sendSystemMessage } = require('./messages');
    await sendSystemMessage(conversationId, `${userDetails.displayName} joined via invite link`);
  } catch (error) {
    console.error('Error joining group via link:', error);
    throw error;
  }
};

/**
 * Toggle require approval setting for group
 */
export const toggleGroupApprovalRequired = async (
  conversationId: string,
  requesterId: string,
  requireApproval: boolean
): Promise<void> => {
  try {
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationDoc = await getDoc(conversationRef);

    if (!conversationDoc.exists()) {
      throw new Error('Group chat not found');
    }

    const data = conversationDoc.data();
    if (!data.isGroupChat) {
      throw new Error('Not a group chat');
    }

    // Only admins can change this setting
    if (!data.admins?.includes(requesterId)) {
      throw new Error('Only admins can change approval settings');
    }

    await updateDoc(conversationRef, {
      requireApproval,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error toggling group approval setting:', error);
    throw error;
  }
};

/**
 * Request to join group (when approval is required)
 */
export const requestToJoinGroup = async (
  conversationId: string,
  userId: string,
  userDetails: {
    displayName: string;
    photoURL: string;
    username: string;
  }
): Promise<void> => {
  try {
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationDoc = await getDoc(conversationRef);

    if (!conversationDoc.exists()) {
      throw new Error('Group not found');
    }

    const data = conversationDoc.data();
    if (!data.isGroupChat) {
      throw new Error('This is not a group chat');
    }

    // Check if already a participant
    if (data.participants.includes(userId)) {
      throw new Error('You are already a member of this group');
    }

    // Check if already requested
    const pendingRequests = data.pendingRequests || [];
    if (pendingRequests.some((req: any) => req.userId === userId)) {
      throw new Error('You have already requested to join this group');
    }

    // Add to pending requests
    await updateDoc(conversationRef, {
      pendingRequests: arrayUnion({
        userId,
        ...userDetails,
        requestedAt: Timestamp.now(),
      }),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error requesting to join group:', error);
    throw error;
  }
};

/**
 * Approve join request
 */
export const approveJoinRequest = async (
  conversationId: string,
  userId: string,
  approverId: string
): Promise<void> => {
  try {
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationDoc = await getDoc(conversationRef);

    if (!conversationDoc.exists()) {
      throw new Error('Group chat not found');
    }

    const data = conversationDoc.data();
    if (!data.isGroupChat) {
      throw new Error('Not a group chat');
    }

    // Only admins can approve requests
    if (!data.admins?.includes(approverId)) {
      throw new Error('Only admins can approve join requests');
    }

    // Find the request
    const pendingRequests = data.pendingRequests || [];
    const request = pendingRequests.find((req: any) => req.userId === userId);

    if (!request) {
      throw new Error('Join request not found');
    }

    // Remove from pending requests
    const updatedRequests = pendingRequests.filter((req: any) => req.userId !== userId);

    // Add user to group
    await updateDoc(conversationRef, {
      participants: arrayUnion(userId),
      [`participantDetails.${userId}`]: {
        id: userId,
        displayName: request.displayName,
        photoURL: request.photoURL,
        username: request.username,
        isAdmin: false,
        joinedAt: Timestamp.now(),
      },
      [`unreadCount.${userId}`]: 0,
      pendingRequests: updatedRequests,
      updatedAt: serverTimestamp(),
    });

    // Send system notification
    const { sendSystemMessage } = require('./messages');
    await sendSystemMessage(conversationId, `${request.displayName} joined the group`);
  } catch (error) {
    console.error('Error approving join request:', error);
    throw error;
  }
};

/**
 * Reject join request
 */
export const rejectJoinRequest = async (
  conversationId: string,
  userId: string,
  rejecterId: string
): Promise<void> => {
  try {
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationDoc = await getDoc(conversationRef);

    if (!conversationDoc.exists()) {
      throw new Error('Group chat not found');
    }

    const data = conversationDoc.data();
    if (!data.isGroupChat) {
      throw new Error('Not a group chat');
    }

    // Only admins can reject requests
    if (!data.admins?.includes(rejecterId)) {
      throw new Error('Only admins can reject join requests');
    }

    // Find and remove the request
    const pendingRequests = data.pendingRequests || [];
    const updatedRequests = pendingRequests.filter((req: any) => req.userId !== userId);

    await updateDoc(conversationRef, {
      pendingRequests: updatedRequests,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error rejecting join request:', error);
    throw error;
  }
};

export default {
  createGroupChat,
  addParticipantToGroup,
  removeParticipantFromGroup,
  leaveGroupChat,
  makeGroupAdmin,
  removeGroupAdmin,
  updateGroupDetails,
  getUserGroupChats,
  joinGroupViaLink,
  toggleGroupApprovalRequired,
  requestToJoinGroup,
  approveJoinRequest,
  rejectJoinRequest,
};

