import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your Firebase config from console
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

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);

export default app;