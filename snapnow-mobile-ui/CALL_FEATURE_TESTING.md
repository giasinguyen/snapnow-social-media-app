# Video Call Feature - Testing Guide

## Overview
This document provides instructions for testing the new video call feature implemented using Jitsi Meet and WebView.

## Prerequisites
- Two physical devices or emulators with Expo Go installed
- Firebase project configured with Firestore
- Internet connection on both devices
- Two different user accounts created in the app

## Setup Steps

### 1. Firebase Configuration (If Not Already Done)

The Firestore `calls` collection will be created automatically when the first call is made. However, you may want to set up security rules:

```javascript
// Add to your Firestore security rules
match /calls/{callId} {
  allow read, write: if request.auth != null && 
    (resource.data.callerId == request.auth.uid || 
     resource.data.receiverId == request.auth.uid);
}
```

### 2. Install Dependencies (Already Completed)

The app already has `react-native-webview` installed. No additional dependencies needed.

## Testing Scenarios

### Basic Video Call Flow

1. **Start the app on Device A**
   ```bash
   cd snapnow-mobile-ui
   npm start
   ```
   - Scan QR code with Expo Go
   - Log in as User A

2. **Start the app on Device B**
   - Scan the same QR code with Expo Go
   - Log in as User B

3. **Initiate a Call**
   - On Device A: Navigate to Messages
   - Open a conversation with User B (or start a new one)
   - Tap the video camera icon in the header (top right)
   
4. **Receive the Call**
   - Device B should show an incoming call modal
   - The modal displays:
     - User A's profile photo
     - User A's name
     - "Video Call" type indicator
     - "Incoming call..." text
     - Accept (green) and Decline (red) buttons
   - Device B should vibrate

5. **Accept the Call**
   - On Device B: Tap the green Accept button
   - Both devices should navigate to the call screen
   - WebView should load Jitsi Meet interface
   - Both users should see each other in the same room

6. **End the Call**
   - On either device: Tap the close (X) button
   - Confirm "End Call" in the alert dialog
   - Should navigate back to chat screen
   - Call document should be cleaned up from Firestore

### Test Cases

#### Test Case 1: Room ID Consistency
- User A initiates call to User B
- User B accepts
- **Expected**: Both users should be in the same Jitsi room
- **Verify**: Check that the room URL is identical on both devices

#### Test Case 2: Incoming Call Notification
- User A initiates call
- **Expected**: User B sees incoming call modal immediately
- **Verify**: Modal appears, vibration occurs, caller info is correct

#### Test Case 3: Decline Call
- User A initiates call
- User B declines
- **Expected**: 
  - User B returns to previous screen
  - Call document is removed from Firestore
  - User A's call screen should detect the rejection (optional enhancement)

#### Test Case 4: Call Status Updates
- Monitor Firestore console during a call
- **Expected Status Flow**:
  1. Call created → status: "ringing"
  2. User B accepts → status: "active"
  3. Either user ends → status: "ended"
  4. After 2 seconds → document deleted

#### Test Case 5: Multiple Calls
- User A calls User B
- Before User B answers, User C tries to call User A
- **Expected**: Both calls should work independently

#### Test Case 6: Network Issues
- Start a call
- Disable internet on one device briefly
- Re-enable internet
- **Expected**: Jitsi should attempt to reconnect (handled by Jitsi)

## Debugging

### Check Firestore Console
1. Open Firebase Console → Firestore Database
2. Look for the `calls` collection
3. During a call, you should see a document with the room ID
4. Check the fields: callerId, receiverId, status, timestamps

### Check Console Logs
Important log messages to look for:

**When initiating a call:**
```
✅ Call created, navigating to call screen
📞 Creating call: {roomId} from {callerId} to {receiverId}
✅ Call created successfully: {roomId}
```

**When receiving a call:**
```
🔔 Setting up global call listener for user: {userId}
📞 Incoming call detected: {callId} from {callerName}
```

**When accepting a call:**
```
✅ Call status updated: {callId} -> active
✅ Call marked as active: {roomId}
```

**When ending a call:**
```
✅ Call status updated: {callId} -> ended
✅ Call ended: {roomId}
✅ Call document deleted: {callId}
```

## Known Limitations

1. **Jitsi Performance**: WebView performance may vary by device
2. **Background Calls**: App must be in foreground to receive calls
3. **Push Notifications**: Not yet implemented for calls (messages only)
4. **Call History**: Calls are deleted after ending (no history)
5. **Audio Calls**: Only video calls implemented (audio button not connected)

## Troubleshooting

### Issue: Incoming call modal doesn't appear
- **Check**: Is GlobalCallListener added to _layout.tsx?
- **Check**: Is user authenticated?
- **Check**: Are Firestore permissions correct?
- **Check**: Console logs for subscription errors

### Issue: Both users don't see each other
- **Check**: Are they using the same room ID? (Check URL)
- **Check**: Camera/microphone permissions on both devices
- **Check**: Internet connection on both devices
- **Check**: Try reloading the WebView

### Issue: WebView shows blank screen
- **Check**: Internet connection
- **Check**: Jitsi URL format: `https://meet.jit.si/{roomId}`
- **Check**: Console logs for WebView errors

### Issue: Call doesn't end properly
- **Check**: Firestore console for stuck documents
- **Manually delete**: Any call documents older than a few minutes

## Feature Enhancements (Future)

1. **Push Notifications for Calls**: Receive calls even when app is backgrounded
2. **Call History**: Store completed calls in a history collection
3. **Audio-Only Calls**: Implement the audio call button
4. **Group Calls**: Support more than 2 participants
5. **Call Recording**: Add recording capability
6. **Custom Jitsi Server**: Self-host Jitsi for better control
7. **Call Quality Indicators**: Show network quality, connection status
8. **Missed Call Notifications**: Notify user of missed calls

## Testing Checklist

- [ ] Call initiation from chat screen
- [ ] Incoming call modal appears
- [ ] Vibration on incoming call
- [ ] Accept call navigation
- [ ] Both users in same room
- [ ] Video/audio working
- [ ] End call functionality
- [ ] Call status updates in Firestore
- [ ] Call document cleanup
- [ ] Decline call
- [ ] Multiple simultaneous calls
- [ ] Back button during call
- [ ] Network interruption handling

## Security Considerations

1. **Firestore Rules**: Ensure only call participants can access call documents
2. **Room ID Security**: Room IDs are deterministic but not easily guessable
3. **HTTPS**: Jitsi uses HTTPS for secure communication
4. **No Credentials Stored**: No sensitive call data stored long-term

## Performance Notes

- **WebView Overhead**: Expect slightly higher memory usage
- **Network Usage**: Video calls are bandwidth-intensive
- **Battery**: Extended calls may drain battery faster
- **Cleanup**: Automatic cleanup prevents Firestore bloat

---

**Implementation Date**: 2025-11-14
**Status**: Ready for Testing
**Platform Support**: iOS (Expo Go), Android (Expo Go), Web (limited)
