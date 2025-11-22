const admin = require('firebase-admin');
const path = require('path');

let firebaseApp = null;

function initializeFirebaseAdmin() {
  if (firebaseApp) {
    console.log('✅ Firebase Admin already initialized');
    return firebaseApp;
  }

  try {
    let credential;

    // ✅ OPTION 1: Dùng FIREBASE_SERVICE_ACCOUNT (JSON string) – dành cho Railway
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

      // Fix trường hợp private_key bị \\n
      if (typeof serviceAccount.private_key === 'string') {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }

      credential = admin.credential.cert(serviceAccount);
      console.log('🔑 Using Firebase Service Account from FIREBASE_SERVICE_ACCOUNT (env JSON)');
    }

    // OPTION 2: Dùng file JSON (local dev)
    else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const serviceAccountPath = path.resolve(
        process.cwd(),
        process.env.FIREBASE_SERVICE_ACCOUNT_PATH
      );
      credential = admin.credential.cert(serviceAccountPath);
      console.log('🔑 Using Firebase Service Account from file:', serviceAccountPath);
    }

    // OPTION 3: Dùng từng biến lẻ (local/dev)
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
      console.log('🔑 Using Firebase credentials from separated env variables');
    }

    // Không có cái nào
    else {
      throw new Error(
        'Firebase Admin credentials not found. Expected FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY.'
      );
    }

    firebaseApp = admin.initializeApp({
      credential,
    });

    console.log('✅ Firebase Admin SDK initialized successfully');
    return firebaseApp;
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error);
    throw error;
  }
}

function getFirebaseAdmin() {
  if (!firebaseApp) {
    throw new Error('Firebase Admin not initialized. Call initializeFirebaseAdmin() first.');
  }
  return firebaseApp;
}

function getFirestore() {
  return admin.firestore();
}

function getAuth() {
  return admin.auth();
}

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
