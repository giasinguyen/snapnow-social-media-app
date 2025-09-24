import { Alert } from 'react-native';
import { router } from 'expo-router';

// Mock user data for demo
const mockUsers = [
  {
    uid: 'demo-admin-id',
    email: 'admin@snapnow.com',
    displayName: 'SnapNow Admin',
    isAdmin: true
  },
  {
    uid: 'demo-user-1',
    email: 'user@example.com',
    displayName: 'Demo User',
    isAdmin: false
  }
];

let currentUser: any = null;

// Mock auth functions that work without Firebase
export const mockAuth = {
  async loginAsAdmin() {
    console.log('🔥 Mock: Admin login');
    currentUser = mockUsers.find(u => u.isAdmin);
    
    Alert.alert(
      'Demo Mode', 
      'Logged in as Admin (Demo)',
      [{ text: 'OK', onPress: () => router.replace('/(tabs)/home-new') }]
    );
    
    return currentUser;
  },

  async loginUser(email: string, password: string) {
    console.log('🔥 Mock: User login', { email });
    
    // Simple demo validation
    if (email && password) {
      currentUser = mockUsers.find(u => u.email === email) || mockUsers[1];
      
      Alert.alert(
        'Demo Mode',
        `Welcome ${currentUser.displayName}!`,
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/home-new') }]
      );
      
      return currentUser;
    } else {
      throw new Error('Please fill in all fields');
    }
  },

  async registerUser(email: string, password: string, username: string, displayName: string) {
    console.log('🔥 Mock: User registration', { email, username });
    
    currentUser = {
      uid: `demo-${Date.now()}`,
      email,
      displayName,
      username,
      isAdmin: false
    };

    Alert.alert(
      'Demo Mode',
      'Account created successfully!',
      [{ text: 'OK', onPress: () => router.replace('/(tabs)/home-new') }]
    );

    return currentUser;
  },

  getCurrentUser() {
    return currentUser;
  },

  async signOut() {
    console.log('🔥 Mock: Sign out');
    currentUser = null;
    router.replace('/(auth)/login');
  },

  onAuthStateChanged(callback: (user: any) => void) {
    // Mock auth state listener
    callback(currentUser);
    return () => {}; // unsubscribe function
  }
};

export const createAdminAccount = async () => {
  console.log('🔥 Mock: Admin account ready');
};

export { mockAuth as authService };