import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

// Your web app's Firebase configuration.
// Replace placeholders with your own Firebase project credentials.
const firebaseConfig = {
  apiKey: "demo-api-key-for-emulator", // Needs a non-empty string so Firebase SDK initialized correctly
  authDomain: "kultura-demo.firebaseapp.com",
  projectId: "kultura-app-demo",
  storageBucket: "kultura-demo.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:1234567890"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Connect to local emulator suite when running locally
if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
  connectAuthEmulator(auth, "http://localhost:9099");
  connectFirestoreEmulator(db, "localhost", 8080);
}

export { auth, db, googleProvider };
