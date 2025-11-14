import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  Image,
  Modal,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  Vibration,
} from 'react-native';
import { Call, updateCallStatus, endCall } from '../../services/calls';

interface IncomingCallModalProps {
  call: Call | null;
  visible: boolean;
  onAccept: () => void;
  onReject: () => void;
}

export default function IncomingCallModal({
  call,
  visible,
  onAccept,
  onReject,
}: IncomingCallModalProps) {
  if (!call) return null;

  const handleAccept = async () => {
    try {
      // Update call status to active
      await updateCallStatus(call.id, 'active');
      
      // Navigate to call screen
      router.push({
        pathname: '/call/[roomId]',
        params: {
          roomId: call.roomId,
          otherUserName: call.callerName,
          otherUserId: call.callerId,
        },
      });
      
      onAccept();
    } catch (error) {
      console.error('Error accepting call:', error);
    }
  };

  const handleReject = async () => {
    try {
      // Update call status to rejected and delete
      await endCall(call.id);
      onReject();
    } catch (error) {
      console.error('Error rejecting call:', error);
    }
  };

  // Vibrate when call comes in
  React.useEffect(() => {
    if (visible && call) {
      Vibration.vibrate([0, 500, 200, 500], true);
      
      return () => {
        Vibration.cancel();
      };
    }
  }, [visible, call]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleReject}
    >
      <View style={styles.container}>
        <View style={styles.callCard}>
          {/* Caller Avatar */}
          <Image
            source={{ uri: call.callerPhoto || 'https://via.placeholder.com/120' }}
            style={styles.avatar}
          />

          {/* Call Info */}
          <Text style={styles.callerName}>{call.callerName}</Text>
          <Text style={styles.callType}>
            {call.type === 'video' ? 'Video Call' : 'Voice Call'}
          </Text>
          <Text style={styles.incomingText}>Incoming call...</Text>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {/* Reject Button */}
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={handleReject}
            >
              <Ionicons name="close" size={32} color="#ffffff" />
              <Text style={styles.buttonLabel}>Decline</Text>
            </TouchableOpacity>

            {/* Accept Button */}
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={handleAccept}
            >
              <Ionicons
                name={call.type === 'video' ? 'videocam' : 'call'}
                size={32}
                color="#ffffff"
              />
              <Text style={styles.buttonLabel}>Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  callCard: {
    backgroundColor: '#1f2937',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 24,
    backgroundColor: '#374151',
  },
  callerName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  callType: {
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 4,
  },
  incomingText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 32,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 32,
    marginTop: 16,
  },
  actionButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  acceptButton: {
    backgroundColor: '#10b981',
  },
  buttonLabel: {
    color: '#ffffff',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
  },
});
