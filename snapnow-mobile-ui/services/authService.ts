import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { Alert } from 'react-native';
import { router } from 'expo-router';

// Interface cho User
interface User {
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
}

// Tài khoản admin mặc định
const ADMIN_EMAIL = 'admin@snapnow.com';
const ADMIN_PASSWORD = 'admin123';

// Tạo tài khoản admin
export const createAdminAccount = async () => {
  try {
    console.log('🔥 Creating admin account...');
    
    // Tạo tài khoản admin
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
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('✅ Admin account already exists');
    } else {
      console.log('ℹ️ Admin account setup:', error.message);
    }
  }
};

// Đăng nhập user thông thường
export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Lấy thông tin user từ Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.data();
    
    console.log('✅ Login successful:', userData?.displayName || user.email);
    
    // Navigate immediately without Alert
    setTimeout(() => {
      router.replace('/(tabs)');
    }, 100);
    
    return { ...user, ...userData };
  } catch (error: any) {
    console.error('Login error:', error);
    throw error;
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

// Lắng nghe thay đổi auth state
export const onAuthStateChange = onAuthStateChanged;

// Export auth để sử dụng ở nơi khác
export { auth };