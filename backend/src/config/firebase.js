const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const fs = require('fs');
const path = require('path');

let isInitialized = false;
let messagingInstance = null;

/**
 * Attempts to load Firebase service account credentials from environment variables.
 * Supports:
 * 1. Discrete environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)
 * 2. Raw JSON string in FIREBASE_SERVICE_ACCOUNT_KEY
 * 3. File path specified in FIREBASE_SERVICE_ACCOUNT_PATH
 */
function initializeFirebase() {
  if (getApps().length > 0) {
    isInitialized = true;
    messagingInstance = getMessaging();
    return messagingInstance;
  }

  try {
    let credential = null;

    // 1. Check for discrete environment variables
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
      // Handle escaped newlines commonly found in .env strings
      privateKey = privateKey.replace(/\\n/g, '\n');
      credential = cert({
        projectId,
        clientEmail,
        privateKey,
      });
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      // 2. Check for inline JSON string in env
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      credential = cert(serviceAccount);
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      // 3. Check for file path
      const filePath = path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const serviceAccount = JSON.parse(fileContent);
        credential = cert(serviceAccount);
      } else {
        console.warn(`[Firebase] Service account file not found at path: ${filePath}`);
      }
    }

    if (credential) {
      const app = initializeApp({ credential });
      messagingInstance = getMessaging(app);
      isInitialized = true;
      console.log('✅ [Firebase Admin] Initialized successfully.');
      return messagingInstance;
    } else {
      console.warn(
        '⚠️  [Firebase Admin] Service account credentials not provided in environment variables.\n' +
        '   Push notifications are currently unavailable.\n' +
        '   To enable FCM, configure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env.'
      );
      isInitialized = false;
      return null;
    }
  } catch (error) {
    console.error('❌ [Firebase Admin] Initialization failed:', error.message);
    isInitialized = false;
    return null;
  }
}

// Perform initial setup check without crashing the application
initializeFirebase();

module.exports = {
  getMessagingInstance: () => messagingInstance,
  isFirebaseConfigured: () => isInitialized,
  initializeFirebase,
};
