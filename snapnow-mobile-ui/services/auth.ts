import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

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
}

export class AuthService {
  static async signIn(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  }

  static async signUp(email: string, password: string, username: string, displayName: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user profile in Firestore
      const userProfile: UserProfile = {
        id: user.uid,
        email: user.email || email,
        username: username.toLowerCase(),
        displayName,
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        createdAt: new Date(),
      };

      await setDoc(doc(db, 'users', user.uid), userProfile);
      
      return user;
    } catch (error) {
      throw error;
    }
  }

  static async signOut() {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  }

  static async getCurrentUserProfile(): Promise<UserProfile | null> {
    try {
      const user = auth.currentUser;
      if (!user) return null;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          ...data,
          createdAt: data.createdAt.toDate(),
        } as UserProfile;
      }
      
      return null;
    } catch (error) {
      throw error;
    }
  }

  static getCurrentUser(): User | null {
    return auth.currentUser;
  }
}