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

<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyAaxiV83phcveGwvmzi4YM-Q_AdWQ-8Gfk",
    authDomain: "travel-planner-3e0d3.firebaseapp.com",
    projectId: "travel-planner-3e0d3",
    storageBucket: "travel-planner-3e0d3.firebasestorage.app",
    messagingSenderId: "249520780550",
    appId: "1:249520780550:web:ffb61ab4a192540d441a87"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
</script>
