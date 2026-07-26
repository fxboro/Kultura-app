import React, { createContext, useState, useEffect } from "react";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "../lib/firebase";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setProfile(docSnap.data());
          } else {
            setProfile(null);
          }
        } catch (error) {
          console.error("Error fetching user profile from Firestore:", error);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email, password, role, profileData = {}) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      
      const newProfile = {
        email,
        role: role || "visitor",
        createdAt: new Date().toISOString(),
        ...(profileData.displayName ? { displayName: profileData.displayName } : {}),
        ...(role === "organizer" ? {
          approved: false,
          ...(profileData.organizationName ? { organizationName: profileData.organizationName } : {}),
          ...(profileData.venueName ? { venueName: profileData.venueName } : {})
        } : {})
      };
      
      // Save profile to Firestore (with resilient error catch)
      try {
        await setDoc(doc(db, "users", uid), newProfile);
      } catch (fsError) {
        console.warn("Firestore profile creation warning (fallback applied):", fsError);
      }
      setProfile(newProfile);
      return userCredential;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Profile will be fetched automatically via onAuthStateChanged listener
      return userCredential;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const loginWithGoogle = async (role = "visitor") => {
    setLoading(true);
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const uid = userCredential.user.uid;
      const googleDisplayName = userCredential.user.displayName || "";
      
      // Check if profile exists, otherwise create it
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        const newProfile = {
          email: userCredential.user.email,
          displayName: googleDisplayName,
          role: role,
          createdAt: new Date().toISOString(),
          ...(role === "organizer" ? { approved: false } : {})
        };
        await setDoc(docRef, newProfile);
        setProfile(newProfile);
      } else {
        const existingProfile = docSnap.data();
        setProfile(existingProfile);
      }
      return userCredential;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setProfile(null);
      setUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, login, loginWithGoogle, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};
