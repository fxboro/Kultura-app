import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

// Your web app's Firebase configuration read from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "empty_api_key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "empty_auth_domain",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "empty_project_id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "empty_storage_bucket",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "empty_sender_id",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "empty_app_id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Connect to local emulator suite ONLY when explicitly enabled via VITE_USE_EMULATOR === "true"
if (typeof window !== "undefined" && import.meta.env.VITE_USE_EMULATOR === "true") {
  connectAuthEmulator(auth, "http://localhost:9099");
  connectFirestoreEmulator(db, "localhost", 8080);
}

export { auth, db, googleProvider };
