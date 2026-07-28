import React, { createContext, useState, useEffect, useRef } from "react";
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
  const signingUp = useRef(false);

  useEffect(() => {
    let mounted = true;
    const safetyTimeout = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 1500);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!mounted) return;
      clearTimeout(safetyTimeout);
      setUser(currentUser);

      // Skip profile fetch while signUp() is in progress — it will
      // set the profile itself once the Firestore write completes.
      if (signingUp.current) {
        return;
      }

      if (currentUser) {
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists() && mounted) {
            setProfile(docSnap.data());
          } else if (mounted) {
            setProfile(null);
          }
        } catch (error) {
          console.error("Error fetching user profile from Firestore:", error);
          if (mounted) setProfile(null);
        }
      } else if (mounted) {
        setProfile(null);
      }
      if (mounted) setLoading(false);
    }, (error) => {
      console.warn("onAuthStateChanged error:", error);
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      unsubscribe();
    };
  }, []);

  const signUp = async (email, password, role, profileData = {}) => {
    setLoading(true);
    signingUp.current = true;
    try {
      let uid;
      let userObj;

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        uid = userCredential.user.uid;
        userObj = userCredential.user;
      } catch (authErr) {
        const isApiKeyError = authErr.code === "auth/api-key-not-valid" || 
                              authErr.code === "auth/invalid-api-key" || 
                              authErr.message?.includes("api-key-not-valid");
                              
        if (isApiKeyError) {
          console.warn("Firebase API Key unconfigured — activating local development session:", authErr.message);
          uid = "dev-user-" + Date.now();
          userObj = { uid, email, displayName: profileData.displayName || email.split("@")[0] };
          setUser(userObj);
        } else {
          throw authErr;
        }
      }
      
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
      
      // Save profile to Firestore — surface errors so the UI can inform the user
      try {
        await setDoc(doc(db, "users", uid), newProfile);
      } catch (fsError) {
        console.error("Firestore profile creation failed:", fsError);
        throw new Error("Account created but profile could not be saved. Please try logging in again.");
      }

      setProfile(newProfile);
      return { user: userObj };
    } finally {
      signingUp.current = false;
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential;
      } catch (authErr) {
        const isApiKeyError = authErr.code === "auth/api-key-not-valid" || 
                              authErr.code === "auth/invalid-api-key" || 
                              authErr.message?.includes("api-key-not-valid");

        if (isApiKeyError) {
          console.warn("Firebase API Key unconfigured — logging in with local dev session:", authErr.message);
          const devUid = "dev-user-" + email.replace(/[^a-zA-Z0-9]/g, "");
          const devUser = { uid: devUid, email };
          const devRole = email.includes("organizer") ? "organizer" : email.includes("admin") ? "admin" : "visitor";
          const devProfile = { email, role: devRole, displayName: email.split("@")[0], approved: true };
          setUser(devUser);
          setProfile(devProfile);
          return { user: devUser };
        } else {
          throw authErr;
        }
      }
    } finally {
      setLoading(false);
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
