import React, { useEffect, useState } from 'react';
import { auth } from '../../config/firebase';
import { Call, subscribeToIncomingCalls } from '../../services/calls';
import IncomingCallModal from '../call/IncomingCallModal';

/**
 * Global component that listens for incoming calls and shows the incoming call modal
 * Should be added to the root layout
 */
export default function GlobalCallListener() {
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    console.log('🔔 Setting up global call listener for user:', currentUser.uid);

    const unsubscribe = subscribeToIncomingCalls(
      currentUser.uid,
      (call) => {
        console.log('📞 Incoming call from:', call.callerName);
        setIncomingCall(call);
        setShowModal(true);
      },
      (error) => {
        console.error('Error in call subscription:', error);
      }
    );

    return () => {
      console.log('🔕 Cleaning up global call listener');
      unsubscribe();
    };
  }, []);

  const handleAccept = () => {
    setShowModal(false);
    setIncomingCall(null);
  };

  const handleReject = () => {
    setShowModal(false);
    setIncomingCall(null);
  };

  return (
    <IncomingCallModal
      call={incomingCall}
      visible={showModal}
      onAccept={handleAccept}
      onReject={handleReject}
    />
  );
}
