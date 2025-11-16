import { Stack } from 'expo-router';

export default function MessagesLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Messages',
          headerLargeTitle: true,
        }}
      />
      <Stack.Screen
        name="[conversationId]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="conversation-details"
        options={{
          title: '',
          headerShown: true,
        }}
      />
    </Stack>
  );
}
