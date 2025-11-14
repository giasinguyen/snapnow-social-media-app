# Video Call Feature Implementation

## Overview

This implementation adds a complete video calling feature to the SnapNow social media app using Jitsi Meet embedded in a WebView. The feature includes Firestore-based call management and real-time incoming call notifications.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User A (Caller)                          │
│  Chat Screen → Click Video Icon → Create Call in Firestore  │
│         ↓                                                     │
│  Navigate to Call Screen (WebView + Jitsi)                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    Firestore 'calls' collection
                    (roomId, status: 'ringing')
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     User B (Receiver)                        │
│  GlobalCallListener detects new call                         │
│         ↓                                                     │
│  IncomingCallModal appears (with vibration)                  │
│         ↓                                                     │
│  User accepts → Navigate to Call Screen                      │
│         ↓                                                     │
│  Both users in same Jitsi room (roomId)                     │
└─────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. Call Screen (`app/call/[roomId].tsx`)
- **Purpose**: Display Jitsi Meet interface in WebView
- **Features**:
  - Loads Jitsi room based on roomId
  - Shows loading indicator
  - Handles call status updates (active, ended)
  - Confirmation dialog before ending call
  - Platform-specific WebView configurations

### 2. Room ID Utility (`utils/callUtils.ts`)
- **Purpose**: Generate consistent room IDs
- **Algorithm**: Sort user IDs alphabetically and join with underscore
- **Example**: `userId1_userId2`
- **Benefit**: Both users always generate the same room ID

### 3. Calls Service (`services/calls.ts`)
- **Purpose**: Firestore call management
- **Functions**:
  - `createCall()`: Create new call document
  - `updateCallStatus()`: Update call state
  - `endCall()`: End and cleanup call
  - `subscribeToIncomingCalls()`: Real-time listener for incoming calls
  - `subscribeToCall()`: Monitor specific call status
- **Call States**: ringing, active, ended, missed, rejected

### 4. Incoming Call Modal (`components/call/IncomingCallModal.tsx`)
- **Purpose**: Display incoming call notification
- **Features**:
  - Shows caller's photo and name
  - Accept (green) and Decline (red) buttons
  - Vibration pattern on incoming call
  - Auto-cancels vibration on dismiss
  - Updates call status in Firestore

### 5. Global Call Listener (`components/call/GlobalCallListener.tsx`)
- **Purpose**: Monitor incoming calls across the entire app
- **Integration**: Added to root layout (`app/_layout.tsx`)
- **Behavior**: Only active when user is authenticated
- **Real-time**: Uses Firestore subscriptions for instant notifications

## Data Model

### Firestore `calls` Collection

```typescript
{
  id: string,                    // Same as roomId
  roomId: string,                // Deterministic room identifier
  callerId: string,              // UID of caller
  callerName: string,            // Display name of caller
  callerPhoto: string,           // Profile photo URL of caller
  receiverId: string,            // UID of receiver
  receiverName: string,          // Display name of receiver
  receiverPhoto: string,         // Profile photo URL of receiver
  type: 'video' | 'audio',       // Call type
  status: 'ringing' | 'active' | 'ended' | 'missed' | 'rejected',
  createdAt: Timestamp,          // When call was initiated
  answeredAt?: Timestamp,        // When call was accepted (if applicable)
  endedAt?: Timestamp           // When call ended (if applicable)
}
```

## Call Flow

### Initiating a Call (User A)

1. User A opens chat with User B
2. User A clicks video camera icon in header
3. `handleVideoCall()` function:
   - Generates `roomId` using `generateRoomId(userA, userB)`
   - Creates call document in Firestore:
     - `status: 'ringing'`
     - Caller and receiver info
   - Navigates to `/call/[roomId]`
4. Call screen loads:
   - Updates call status to `'active'`
   - Opens Jitsi Meet WebView with roomId

### Receiving a Call (User B)

1. GlobalCallListener subscribes to calls where `receiverId == userB`
2. When new call detected:
   - IncomingCallModal appears
   - Device vibrates
3. User B has two options:
   - **Accept**: 
     - Updates call status to `'active'`
     - Navigates to `/call/[roomId]`
     - Joins same Jitsi room as User A
   - **Decline**:
     - Updates call status to `'rejected'`
     - Ends call (cleanup after 2s)

### Ending a Call

1. Either user taps close button
2. Confirmation dialog appears
3. If confirmed:
   - Updates call status to `'ended'`
   - Adds `endedAt` timestamp
   - Deletes call document after 2 seconds
   - Navigates back to chat

## Files Changed/Created

### New Files
- `snapnow-mobile-ui/app/call/[roomId].tsx` - Call screen component
- `snapnow-mobile-ui/utils/callUtils.ts` - Room ID generator
- `snapnow-mobile-ui/services/calls.ts` - Firestore call service
- `snapnow-mobile-ui/components/call/IncomingCallModal.tsx` - Incoming call UI
- `snapnow-mobile-ui/components/call/GlobalCallListener.tsx` - Global call monitor
- `snapnow-mobile-ui/CALL_FEATURE_TESTING.md` - Testing guide

### Modified Files
- `snapnow-mobile-ui/app/messages/[conversationId].tsx` - Added video call button handler
- `snapnow-mobile-ui/app/_layout.tsx` - Integrated GlobalCallListener

## Dependencies

### Existing (No Installation Required)
- `react-native-webview@13.15.0` - Already in package.json
- `firebase` - Already configured
- `expo-router` - Already in use
- `@expo/vector-icons` - Already in use

### No New Dependencies Added ✅

## Configuration

### Jitsi Server
- **Default**: Public Jitsi server (`https://meet.jit.si`)
- **Customizable**: Can be changed to self-hosted Jitsi server
- **Location**: `app/call/[roomId].tsx`, line 20

### WebView Settings
- JavaScript enabled
- DOM storage enabled
- Inline media playback (iOS)
- Mixed content allowed (Android)
- Media playback without user action

## Testing

See [CALL_FEATURE_TESTING.md](./CALL_FEATURE_TESTING.md) for comprehensive testing guide.

**Quick Test:**
1. Open app on two devices with Expo Go
2. Log in as different users
3. Start a chat
4. Click video icon → Accept on other device
5. Both should see Jitsi interface

## Security

### Firestore Security Rules (Recommended)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /calls/{callId} {
      allow read, write: if request.auth != null && 
        (resource.data.callerId == request.auth.uid || 
         resource.data.receiverId == request.auth.uid);
    }
  }
}
```

### Privacy Considerations
- Room IDs are deterministic but use user UIDs (not easily guessable)
- Call documents auto-delete after ending (no history)
- Jitsi uses end-to-end encryption
- No call recordings stored by default

## Limitations

1. **Foreground Only**: App must be in foreground to receive calls
2. **No Push Notifications**: Calls won't trigger push notifications (yet)
3. **Video Only**: Audio-only calls not yet implemented
4. **Two Participants**: No group calls support
5. **No Call History**: Calls deleted after ending
6. **WebView Performance**: May vary by device

## Future Enhancements

1. **Background Call Reception**: Add push notifications for calls
2. **Audio Calls**: Implement audio-only mode
3. **Call History**: Store call logs
4. **Group Calls**: Support 3+ participants
5. **Custom Jitsi**: Self-host for better control
6. **Call Quality**: Display connection indicators
7. **Recording**: Add call recording feature
8. **Missed Calls**: Show missed call badges

## Troubleshooting

### Common Issues

**Incoming call doesn't show:**
- Check GlobalCallListener is in _layout.tsx
- Verify Firestore permissions
- Check console logs for errors

**WebView blank screen:**
- Check internet connection
- Verify Jitsi URL is correct
- Check console for WebView errors

**Can't see other user:**
- Verify both devices have same roomId
- Check camera/microphone permissions
- Ensure good internet connection

## Performance

- **Memory**: WebView adds ~50-100MB depending on device
- **Network**: Video calls use ~1-3 Mbps
- **Battery**: Active calls may drain battery faster
- **Cleanup**: Automatic deletion prevents Firestore bloat

## API Reference

### callUtils.ts

```typescript
generateRoomId(userId1: string, userId2: string): string
```

### calls.ts

```typescript
createCall(callData: CreateCallInput): Promise<Call>
updateCallStatus(callId: string, status: CallStatus): Promise<void>
endCall(callId: string): Promise<void>
subscribeToIncomingCalls(userId: string, onCallReceived, onError?): () => void
subscribeToCall(callId: string, onCallUpdate, onError?): () => void
getCall(callId: string): Promise<Call | null>
```

---

**Status**: ✅ Ready for Testing  
**Platform**: React Native (Expo)  
**Version**: 1.0.0  
**Last Updated**: 2025-11-14
