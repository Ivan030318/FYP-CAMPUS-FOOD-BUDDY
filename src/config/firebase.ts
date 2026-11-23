import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, type Auth, type Persistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// getReactNativePersistence exists at runtime (Metro resolves firebase/auth's
// "react-native" export condition to a build that includes it) but is not part of
// firebase/auth's published type declarations, so pull it in via require + a manual type.
const { getReactNativePersistence } = require('firebase/auth') as {
  getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence;
};

// Chat messages are stored in Firestore (see src/types + firestore.rules) so that a single
// database handles users, requests, chats and messages with one consistent security model.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey) {
  console.warn(
    '[firebase] Missing EXPO_PUBLIC_FIREBASE_* env vars. Copy .env.example to .env and fill in ' +
      'your Firebase project config, then restart Expo with `npx expo start -c`.'
  );
}

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let authInstance: Auth;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  // initializeAuth throws if it was already called (e.g. Fast Refresh) — reuse existing instance.
  const { getAuth } = require('firebase/auth');
  authInstance = getAuth(app);
}

export const auth = authInstance;
export const firestore = getFirestore(app);
