import {
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export type CallStatus = 'ringing' | 'active' | 'ended' | 'missed' | 'rejected';
export type CallType = 'video' | 'audio';

export interface Call {
  id: string;
  roomId: string;
  callerId: string;
  callerName: string;
  callerPhoto: string;
  receiverId: string;
  receiverName: string;
  receiverPhoto: string;
  type: CallType;
  status: CallStatus;
  createdAt: Timestamp;
  answeredAt?: Timestamp;
  endedAt?: Timestamp;
}

export interface CreateCallInput {
  roomId: string;
  callerId: string;
  callerName: string;
  callerPhoto: string;
  receiverId: string;
  receiverName: string;
  receiverPhoto: string;
  type: CallType;
}

/**
 * Create a new call document in Firestore
 */
export const createCall = async (callData: CreateCallInput): Promise<Call> => {
  try {
    const { roomId, callerId, receiverId } = callData;
    
    // Use roomId as the call document ID to ensure only one active call per room
    const callRef = doc(db, 'calls', roomId);
    
    const newCall = {
      ...callData,
      status: 'ringing' as CallStatus,
      createdAt: serverTimestamp(),
    };

    console.log('📞 Creating call:', roomId, 'from', callerId, 'to', receiverId);
    await setDoc(callRef, newCall);

    const createdDoc = await getDoc(callRef);
    console.log('✅ Call created successfully:', roomId);

    return {
      id: createdDoc.id,
      ...createdDoc.data(),
    } as Call;
  } catch (error) {
    console.error('Error creating call:', error);
    throw error;
  }
};

/**
 * Update call status
 */
export const updateCallStatus = async (
  callId: string,
  status: CallStatus
): Promise<void> => {
  try {
    const callRef = doc(db, 'calls', callId);
    const updateData: any = { status };

    if (status === 'active') {
      updateData.answeredAt = serverTimestamp();
    } else if (status === 'ended' || status === 'missed' || status === 'rejected') {
      updateData.endedAt = serverTimestamp();
    }

    await setDoc(callRef, updateData, { merge: true });
    console.log('✅ Call status updated:', callId, '->', status);
  } catch (error) {
    console.error('Error updating call status:', error);
    throw error;
  }
};

/**
 * End and delete a call
 */
export const endCall = async (callId: string): Promise<void> => {
  try {
    const callRef = doc(db, 'calls', callId);
    
    // First update status to ended
    await updateCallStatus(callId, 'ended');
    
    // Then delete the call document after a short delay
    setTimeout(async () => {
      await deleteDoc(callRef);
      console.log('✅ Call document deleted:', callId);
    }, 2000);
  } catch (error) {
    console.error('Error ending call:', error);
    throw error;
  }
};

/**
 * Subscribe to incoming calls for a user
 */
export const subscribeToIncomingCalls = (
  userId: string,
  onCallReceived: (call: Call) => void,
  onError?: (error: Error) => void
): (() => void) => {
  try {
    console.log('🔔 Setting up incoming call subscription for user:', userId);

    const callsRef = collection(db, 'calls');
    const q = query(
      callsRef,
      where('receiverId', '==', userId),
      where('status', '==', 'ringing')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        snapshot.docs.forEach((doc) => {
          const call = {
            id: doc.id,
            ...doc.data(),
          } as Call;
          
          console.log('📞 Incoming call detected:', call.id, 'from', call.callerName);
          onCallReceived(call);
        });
      },
      (error) => {
        console.error('❌ Error in incoming calls subscription:', error);
        onError?.(error as Error);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('❌ Error setting up incoming calls subscription:', error);
    onError?.(error as Error);
    return () => {};
  }
};

/**
 * Subscribe to a specific call's status
 */
export const subscribeToCall = (
  callId: string,
  onCallUpdate: (call: Call | null) => void,
  onError?: (error: Error) => void
): (() => void) => {
  try {
    const callRef = doc(db, 'calls', callId);

    const unsubscribe = onSnapshot(
      callRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          onCallUpdate(null);
          return;
        }

        const call = {
          id: snapshot.id,
          ...snapshot.data(),
        } as Call;
        
        onCallUpdate(call);
      },
      (error) => {
        console.error('Error subscribing to call:', error);
        onError?.(error as Error);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up call subscription:', error);
    throw error;
  }
};

/**
 * Get a call by ID
 */
export const getCall = async (callId: string): Promise<Call | null> => {
  try {
    const callRef = doc(db, 'calls', callId);
    const callDoc = await getDoc(callRef);

    if (!callDoc.exists()) {
      return null;
    }

    return {
      id: callDoc.id,
      ...callDoc.data(),
    } as Call;
  } catch (error) {
    console.error('Error getting call:', error);
    throw error;
  }
};

export default {
  createCall,
  updateCallStatus,
  endCall,
  subscribeToIncomingCalls,
  subscribeToCall,
  getCall,
};
