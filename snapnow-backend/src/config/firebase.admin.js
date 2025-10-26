const admin = require('firebase-admin');
const path = require('path');

let firebaseApp = null;

/**
 * Initialize Firebase Admin SDK
 */
function initializeFirebaseAdmin() {
  if (firebaseApp) {
    console.log('✅ Firebase Admin already initialized');
    return firebaseApp;
  }

  try {
    let credential;

    // Option 1: Use service account JSON file
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const serviceAccountPath = path.resolve(
        process.cwd(),
        process.env.FIREBASE_SERVICE_ACCOUNT_PATH
      );
      credential = admin.credential.cert(serviceAccountPath);
      console.log('🔑 Using Firebase Service Account from file');
    }
    // Option 2: Use environment variables
    else if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ) {
      credential = admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      });
      console.log('🔑 Using Firebase credentials from environment variables');
    } else {
      throw new Error(
        'Firebase Admin credentials not found. Please set FIREBASE_SERVICE_ACCOUNT_PATH or Firebase environment variables.'
      );
    }

    firebaseApp = admin.initializeApp({
      credential: credential,
      projectId: process.env.FIREBASE_PROJECT_ID,
    });

    console.log('✅ Firebase Admin SDK initialized successfully');
    return firebaseApp;
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error.message);
    throw error;
  }
}

/**
 * Get Firebase Admin instance
 */
function getFirebaseAdmin() {
  if (!firebaseApp) {
    throw new Error('Firebase Admin not initialized. Call initializeFirebaseAdmin() first.');
  }
  return firebaseApp;
}

/**
 * Get Firestore instance
 */
function getFirestore() {
  return admin.firestore();
}

/**
 * Get Firebase Auth instance
 */
function getAuth() {
  return admin.auth();
}

/**
 * Get Firebase Storage instance
 */
function getStorage() {
  return admin.storage();
}

module.exports = {
  initializeFirebaseAdmin,
  getFirebaseAdmin,
  getFirestore,
  getAuth,
  getStorage,
  admin,
};
