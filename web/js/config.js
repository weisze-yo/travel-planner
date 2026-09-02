// ---------------------------------------------------------------------------
// PASTE YOUR FIREBASE WEB CONFIG HERE.
//
// Firebase console → your project → Project settings (gear icon) →
// "Your apps" → Web app (</> icon) → Config. Copy the values across.
//
// Until you do, the app still runs: it keeps everything in this browser only
// (localStorage), so you can try the screens before any backend exists.
// These values are not secrets — they identify your project. What protects
// your data is the Firestore rules in firebase/firestore.rules.
// ---------------------------------------------------------------------------

export const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};

/** Pinned so a future SDK release cannot change behaviour without a bump. */
export const FIREBASE_SDK = '10.12.5';
