import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import { AuthService, UserProfile } from '../../services/authService';
import { subscribeToNotifications } from '../../services/notifications';

export default function TabsLayout() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

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

  useEffect(() => {
    const user = AuthService.getCurrentUser();
    if (!user) return;

    // Subscribe to notifications to get real-time unread count
    const unsubscribe = subscribeToNotifications(user.uid, (notifications) => {
      const unreadCount = notifications.filter(n => !n.isRead).length;
      setUnreadCount(unreadCount);
    });

    return () => unsubscribe();
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
          height: 60,
          paddingTop: 4,
          paddingBottom: 4,
          elevation: 0,
        },
        tabBarActiveTintColor: '#262626',
        tabBarInactiveTintColor: '#8E8E8E',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
        tabBarShowLabel: false, // Hide labels for cleaner look (Instagram style)
        tabBarHideOnKeyboard: true, // Hide when keyboard is shown
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
            <View style={{ width: 26, height: 26 }}>
              <Ionicons 
                name={focused ? "heart" : "heart-outline"} 
                size={26} 
                color={color} 
              />
              {unreadCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    backgroundColor: '#FF3B30',
                    borderRadius: 5,
                    width: 10,
                    height: 10,
                  }}
                />
              )}
            </View>
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