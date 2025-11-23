import { Stack } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';

export default function MessagesLayout() {
  const { colors } = useTheme();
  
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.backgroundWhite,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          color: colors.textPrimary,
        },
      }}
    >
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
      <Stack.Screen
        name="group-settings"
        options={{
          title: 'Privacy & Safety',
          headerShown: true,
        }}
      />
    </Stack>
  );
}
