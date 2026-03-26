import { getApp, getApps, initializeApp, type FirebaseOptions } from "firebase/app";
import { collection, getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
} satisfies Partial<FirebaseOptions>;

export const hasFirebaseConfig = Object.values(firebaseConfig).every(
  (value) => typeof value === "string" && value.length > 0,
);

const firebaseApp = hasFirebaseConfig
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig as FirebaseOptions)
  : null;

export const db = firebaseApp ? getFirestore(firebaseApp) : null;
export const storage = firebaseApp ? getStorage(firebaseApp) : null;

export function getParticipantsCollection() {
  return db ? collection(db, "participants") : null;
}

export function getGalleryCollection() {
  return db ? collection(db, "gallery") : null;
}
