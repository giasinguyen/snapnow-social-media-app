import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import { AuthService, UserProfile } from '../../services/authService';

export default function TabsLayout() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const profile = await AuthService.getCurrentUserProfile();
        setUserProfile(profile);
      } catch (error) {
        console.error('Failed to load user profile:', error);
      }
    };

    loadUserProfile();
  }, []);

  const ProfileAvatar = ({ focused }: { focused: boolean }) => {
    if (userProfile?.profileImage) {
      return (
        <View style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          borderWidth: focused ? 2 : 1,
          borderColor: focused ? '#262626' : '#8E8E8E',
          overflow: 'hidden'
        }}>
          <Image
            source={{ uri: userProfile.profileImage }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        </View>
      );
    }
    
    // Fallback to person icon if no profile image
    return (
      <Ionicons 
        name={focused ? "person" : "person-outline"} 
        size={26} 
        color={focused ? '#262626' : '#8E8E8E'} 
      />
    );
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0.5,
          borderTopColor: '#DBDBDB',
          height: 50,
          paddingBottom: 6,
          paddingTop: 4,
        },
        tabBarActiveTintColor: '#262626',
        tabBarInactiveTintColor: '#8E8E8E',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
        tabBarShowLabel: false, // Hide labels for cleaner look (Instagram style)
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <Ionicons 
              name={focused ? "home" : "home-outline"} 
              size={26} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <Ionicons 
              name={focused ? "search" : "search-outline"} 
              size={26} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <Ionicons 
              name={focused ? "add-circle" : "add-circle-outline"} 
              size={26} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <Ionicons 
              name={focused ? "heart" : "heart-outline"} 
              size={26} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <ProfileAvatar focused={focused} />
          ),
        }}
      />
      
      {/* Hidden screens - Not shown in tab bar */}
      <Tabs.Screen
        name="edit-profile"
        options={{
          href: null,
          title: 'Edit Profile',
        }}
      />
      <Tabs.Screen
        name="share-profile"
        options={{
          href: null,
          title: 'Share Profile',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
          title: 'Settings',
        }}
      />
    </Tabs>
  );
}