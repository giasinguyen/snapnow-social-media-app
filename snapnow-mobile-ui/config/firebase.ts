import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC3kVWu2QknSVlDShiOzeoaeSH2j0sXoxQ",
  authDomain: "snapn-9345d.firebaseapp.com",
  projectId: "snapn-9345d",
  storageBucket: "snapn-9345d.firebasestorage.app",
  messagingSenderId: "43991038752",
  appId: "1:43991038752:web:947d2bed8f739d02dab545",
  measurementId: "G-3NP1NDCC99"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;