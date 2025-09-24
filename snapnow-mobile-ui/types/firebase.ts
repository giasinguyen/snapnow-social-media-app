// Firebase types for the app
export interface MockAuth {
  currentUser: any;
  signInWithEmailAndPassword: (email: string, password: string) => Promise<any>;
  createUserWithEmailAndPassword: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  onAuthStateChanged: (callback: (user: any) => void) => () => void;
}

export interface MockFirestore {
  collection: (path: string) => any;
}

export interface MockStorage {
  ref: (path?: string) => any;
}