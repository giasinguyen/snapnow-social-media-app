import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { endCall, updateCallStatus } from '../../services/calls';

export default function CallScreen() {
  const params = useLocalSearchParams();
  const { roomId, otherUserName } = params;
  const [loading, setLoading] = useState(true);

  // Construct Jitsi Meet URL
  const jitsiUrl = `https://meet.jit.si/${roomId}`;

  // Update call status to active when screen loads
  useEffect(() => {
    const markCallActive = async () => {
      if (roomId) {
        try {
          await updateCallStatus(roomId as string, 'active');
          console.log('✅ Call marked as active:', roomId);
        } catch (error) {
          console.error('Error marking call as active:', error);
        }
      }
    };

    markCallActive();
  }, [roomId]);

  // Handle ending the call
  const handleEndCall = async () => {
    try {
      if (roomId) {
        await endCall(roomId as string);
        console.log('✅ Call ended:', roomId);
      }
      router.back();
    } catch (error) {
      console.error('Error ending call:', error);
      router.back();
    }
  };

  // Confirm before leaving
  const handleClose = () => {
    Alert.alert(
      'End Call',
      'Are you sure you want to end this call?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'End Call', style: 'destructive', onPress: handleEndCall },
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: `Call with ${otherUserName || 'User'}`,
          headerStyle: {
            backgroundColor: '#000000',
          },
          headerTintColor: '#ffffff',
          headerLeft: () => (
            <TouchableOpacity
              onPress={handleClose}
              style={{ marginLeft: 8 }}
            >
              <Ionicons name="close" size={28} color="#ffffff" />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={{ flex: 1, backgroundColor: '#000000' }}>
        {loading && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#000000',
              zIndex: 1,
            }}
          >
            <ActivityIndicator size="large" color="#ffffff" />
          </View>
        )}

        <WebView
          source={{ uri: jitsiUrl }}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback={true}
          // iOS specific
          {...(Platform.OS === 'ios' && {
            allowsInlineMediaPlayback: true,
            mediaPlaybackRequiresUserAction: false,
          })}
          // Android specific
          {...(Platform.OS === 'android' && {
            mixedContentMode: 'always',
            setBuiltInZoomControls: false,
          })}
          style={{ flex: 1, backgroundColor: '#000000' }}
        />
      </View>
    </>
  );
}
