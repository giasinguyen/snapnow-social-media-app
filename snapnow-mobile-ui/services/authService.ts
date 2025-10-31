import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { Alert } from 'react-native';
import { router } from 'expo-router';

// Interface cho User
export interface UserProfile {
  id: string;
  email: string;
  username: string;
  displayName: string;
  profileImage?: string;
  bio?: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  createdAt: Date;
  isAdmin?: boolean;
  isPrivate?: boolean;
}

// Alias for backward compatibility
export type User = UserProfile;

// Tài khoản admin mặc định
const ADMIN_EMAIL = 'admin@snapnow.com';
const ADMIN_PASSWORD = 'admin123'; // Firebase requires minimum 6 characters

// Tạo tài khoản admin
export const createAdminAccount = async () => {
  try {
    console.log('🔥 Checking admin account...');
    
    // Kiểm tra xem admin đã tồn tại chưa
    try {
      await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
      console.log('✅ Admin account already exists');
      await signOut(auth); // Logout sau khi check
      return;
    } catch (signInError: any) {
      if (signInError.code !== 'auth/user-not-found' && signInError.code !== 'auth/invalid-credential') {
        console.log('ℹ️ Admin check error:', signInError.message);
        return;
      }
    }
    
    // Tạo tài khoản admin nếu chưa tồn tại
    console.log('🔥 Creating admin account...');
    const adminCredential = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    
    // Lưu thông tin admin vào Firestore
    await setDoc(doc(db, 'users', adminCredential.user.uid), {
      id: adminCredential.user.uid,
      email: ADMIN_EMAIL,
      displayName: 'SnapNow Admin',
      username: 'admin',
      isAdmin: true,
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      createdAt: new Date()
    });
    
    console.log('✅ Admin account created successfully');
    await signOut(auth); // Logout sau khi tạo
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('✅ Admin account already exists');
    } else {
      console.log('ℹ️ Admin account setup error:', error.message);
    }
  }
};

// Đăng nhập user thông thường
export const loginUser = async (email: string, password: string) => {
  try {
    console.log('🔐 Attempting login with:', email);
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('✅ Firebase Auth successful for:', user.uid);
    
    // Lấy thông tin user từ Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      console.warn('⚠️ User document not found in Firestore, creating one...');
      // Tạo document nếu chưa có
      const newUserData: UserProfile = {
        id: user.uid,
        email: user.email || email,
        username: email.split('@')[0],
        displayName: email.split('@')[0],
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        createdAt: new Date(),
        isAdmin: email === ADMIN_EMAIL,
        isPrivate: false,
      };
      
      await setDoc(doc(db, 'users', user.uid), newUserData);
      console.log('✅ User document created in Firestore');
    }
    
    const userData = userDoc.exists() ? userDoc.data() : null;
    
    console.log('✅ Login successful:', userData?.displayName || user.email);
    
    // Navigate immediately without Alert
    setTimeout(() => {
      router.replace('/(tabs)');
    }, 100);
    
    return { ...user, ...userData };
  } catch (error: any) {
    console.error('❌ Login error:', error.code, error.message);
    
    // Provide user-friendly error messages
    let errorMessage = 'Invalid credentials';
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
      errorMessage = 'Invalid email or password';
    } else if (error.code === 'auth/user-not-found') {
      errorMessage = 'User not found';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many failed attempts. Please try again later.';
    } else if (error.code === 'auth/network-request-failed') {
      errorMessage = 'Network error. Please check your connection.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
};

// Đăng nhập admin nhanh
export const loginAsAdmin = async () => {
  try {
    const adminCredential = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    
    console.log('✅ Admin login successful');
    
    // Navigate immediately without Alert
    setTimeout(() => {
      router.replace('/(tabs)');
    }, 100);
    
    return adminCredential.user;
  } catch (error: any) {
    console.error('Admin login error:', error);
    Alert.alert('Lỗi đăng nhập Admin', error.message);
    throw error;
  }
};

// Bypass login for development/testing (uses the mock in __mocks__)
// export const loginBypass = async (email?: string, password?: string) => {
//   // Only allow bypass in development
//   // React Native exposes global.__DEV__ when in development mode
//   if (!(global as any).__DEV__) {
//     throw new Error('Bypass login is allowed in development only');
//   }

//   try {
//     // Dynamically require the mock so it isn't bundled in production builds
//     // eslint-disable-next-line @typescript-eslint/no-var-requires
//     const mockModule = require('../__mocks__/authService.mock');
//     const mock = mockModule.mockAuth || mockModule.authService;

//     // Call the mock login; fallback to admin demo account
//     const user = await mock.loginUser(email || 'admin@snapnow.com', password || 'admin');

//     // Navigate to main tabs (mirror real login behavior)
//     setTimeout(() => {
//       router.replace('/(tabs)');
//     }, 100);

//     return user;
//   } catch (error: any) {
//     console.error('Bypass login error:', error);
//     throw error;
//   }
// };

// Đăng ký user mới
export const registerUser = async (email: string, password: string, username: string, displayName: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Lưu thông tin user vào Firestore
    const userProfile: User = {
      id: user.uid,
      email: email,
      displayName: displayName,
      username: username,
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      createdAt: new Date(),
      isAdmin: false
      ,isPrivate: false
    };
    
    await setDoc(doc(db, 'users', user.uid), userProfile);
    
    console.log('✅ Registration successful:', displayName);
    
    // Navigate immediately without Alert
    setTimeout(() => {
      router.replace('/(tabs)');
    }, 100);
    
    return user;
  } catch (error: any) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Đăng xuất
export const signOutUser = async () => {
  try {
    await signOut(auth);
    router.replace('/(auth)/login');
  } catch (error: any) {
    console.error('Sign out error:', error);
    Alert.alert('Lỗi đăng xuất', error.message);
  }
};

// Get current user profile
export const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const user = auth.currentUser;
    if (!user) return null;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
      } as UserProfile;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting current user profile:', error);
    throw error;
  }
};

// Class-based API for backward compatibility
export class AuthService {
  static async signIn(email: string, password: string) {
    return loginUser(email, password);
  }

  static async signUp(email: string, password: string, username: string, displayName: string) {
    return registerUser(email, password, username, displayName);
  }

  static async signOut() {
    return signOutUser();
  }

  static async getCurrentUserProfile(): Promise<UserProfile | null> {
    return getCurrentUserProfile();
  }

  static getCurrentUser() {
    return auth.currentUser;
  }
}

// Lắng nghe thay đổi auth state
export const onAuthStateChange = onAuthStateChanged;

// Export auth để sử dụng ở nơi khác
export { auth };