import { Stack } from "expo-router";

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerTitleAlign: "center",
        headerStyle: {
          backgroundColor: "#fff",
        },
        headerShadowVisible: false,
        headerTintColor: "#262626",
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ title: "Settings" }} 
      />
      <Stack.Screen 
        name="about" 
        options={{ title: "About SnapNow" }} 
      />
      <Stack.Screen 
        name="help-center" 
        options={{ title: "Help Center" }} 
      />
      <Stack.Screen 
        name="term" 
        options={{ title: "Terms of Service" }} 
      />
      <Stack.Screen 
        name="privacy" 
        options={{ title: "Privacy Policy" }} 
      />
      <Stack.Screen 
        name="time-spent" 
        options={{ title: "Time Management" }} 
      />
      <Stack.Screen 
        name="security" 
        options={{ title: "Security" }} 
      />
      <Stack.Screen
        name="security/change-password"
        options={{ title: 'Change password' }}
      />
      <Stack.Screen
        name="security/two-factor"
        options={{ title: 'Two-factor authentication' }}
      />
      <Stack.Screen
        name="email-notifications"
        options={{ title: 'Email Notifications' }}
      />
    </Stack>
  );
}
