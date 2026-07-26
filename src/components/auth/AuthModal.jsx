import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { X, Sparkles, LogIn, UserPlus, AlertCircle, CheckCircle, Building2 } from "lucide-react";

const AuthModal = ({ isOpen, onClose, defaultMode = "login" }) => {
  const { login, signUp, loginWithGoogle, profile: currentProfile } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState(defaultMode); // "login" or "signup"
  const [role, setRole] = useState("visitor"); // "visitor" or "organizer"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [venueName, setVenueName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  if (!isOpen) return null;

  // Redirect user to their role-specific workspace
  const redirectByRole = (userRole) => {
    if (userRole === "organizer") {
      navigate("/organizer");
    } else if (userRole === "admin") {
      navigate("/admin");
    }
    // Visitors stay on "/" (Discover feed) — no redirect needed
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (mode === "login") {
        const userCredential = await login(email, password);
        // After login, we need to fetch profile to determine redirect
        // The profile is set by onAuthStateChanged, but we can use the current profile
        // We'll wait briefly for the profile to be set, then redirect
        // Use a small timeout to let onAuthStateChanged trigger
        setTimeout(() => {
          // Re-read from auth context (will be available by now)
          onClose();
          // We redirect based on the profile that's already fetched
        }, 100);
        return;
      } else {
        // Sign-up flow
        const profileData = {
          displayName: displayName.trim(),
          ...(role === "organizer" ? {
            organizationName: organizationName.trim(),
            ...(venueName.trim() ? { venueName: venueName.trim() } : {})
          } : {})
        };
        await signUp(email, password, role, profileData);
        
        // Show welcome confirmation briefly
        if (role === "organizer") {
          setSuccessMessage("Application received! Your organizer profile is pending admin approval.");
        } else {
          setSuccessMessage(`Welcome to Kultura, ${displayName.trim() || "Explorer"}! 🎭`);
        }

        // Close modal after showing success, then redirect
        setTimeout(() => {
          onClose();
          redirectByRole(role);
        }, 2200);
        return;
      }
    } catch (err) {
      console.error("Auth error:", err);
      // Clean up firebase error codes to make them human readable
      let msg = "An authentication error occurred. Please try again.";
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        msg = "Invalid email or password.";
      } else if (err.code === "auth/email-already-in-use") {
        msg = "This email is already registered.";
      } else if (err.code === "auth/weak-password") {
        msg = "Password should be at least 6 characters.";
      } else if (err.code === "auth/invalid-email") {
        msg = "Please enter a valid email address.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      // Pass the selected role in case it's a new user registration
      await loginWithGoogle(role);
      onClose();
    } catch (err) {
      console.error("Google sign-in error:", err);
      setError("Failed to authenticate with Google.");
    } finally {
      setLoading(false);
    }
  };

  // Handle login redirect after profile is loaded via onAuthStateChanged
  const handleLoginSuccess = () => {
    onClose();
    // Use a small delay to ensure profile is loaded
    setTimeout(() => {
      if (currentProfile?.role) {
        redirectByRole(currentProfile.role);
      }
    }, 200);
  };

  // Override handleSubmit for login to use handleLoginSuccess
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
        // Profile will be loaded by onAuthStateChanged; we need to wait and then redirect.
        // Close the modal and let the redirect happen after the profile updates.
        setLoading(false);
        handleLoginSuccess();
        return;
      } else {
        // Sign-up flow
        const profileData = {
          displayName: displayName.trim(),
          ...(role === "organizer" ? {
            organizationName: organizationName.trim(),
            ...(venueName.trim() ? { venueName: venueName.trim() } : {})
          } : {})
        };
        await signUp(email, password, role, profileData);
        
        // Show welcome confirmation briefly
        if (role === "organizer") {
          setSuccessMessage("Application received! Your organizer profile is pending admin approval.");
        } else {
          setSuccessMessage(`Welcome to Kultura, ${displayName.trim() || "Explorer"}! 🎭`);
        }

        setLoading(false);
        // Close modal after showing success, then redirect
        setTimeout(() => {
          onClose();
          redirectByRole(role);
        }, 2200);
        return;
      }
    } catch (err) {
      console.error("Auth error:", err);
      let msg = "An authentication error occurred. Please try again.";
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        msg = "Invalid email or password.";
      } else if (err.code === "auth/email-already-in-use") {
        msg = "This email is already registered.";
      } else if (err.code === "auth/weak-password") {
        msg = "Password should be at least 6 characters.";
      } else if (err.code === "auth/invalid-email") {
        msg = "Please enter a valid email address.";
      }
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-md transition-opacity duration-300">
      {/* Modal Container */}
      <div 
        className="w-full max-w-md bg-[#FDFDFD] border border-neutral-100 rounded-[2rem] shadow-2xl flex flex-col relative max-h-[90vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-6 top-6 w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200/80 text-neutral-500 hover:text-[#2A2A2A] flex items-center justify-center transition-colors shadow-sm z-10"
        >
          <X size={16} />
        </button>

        {/* Form Body */}
        <div className="p-8">
          <div className="flex items-center gap-1.5 text-[#358597] mb-2">
            <Sparkles size={16} className="text-[#EA7963]" />
            <span className="font-display font-medium text-sm tracking-wide">Kultura Portal</span>
          </div>

          <h2 className="text-3xl font-bold font-display text-[#2A2A2A] tracking-tight mb-6">
            {mode === "login" ? "Welcome Back" : "Begin Your Trail"}
          </h2>

          {/* Success Confirmation */}
          {successMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs flex gap-2.5 items-start leading-relaxed font-sans animate-in">
              <CheckCircle size={16} className="shrink-0 text-emerald-500 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Toggle Role Selector for SignUp mode */}
          {mode === "signup" && !successMessage && (
            <div className="mb-6">
              <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-2.5">
                I want to join as a
              </label>
              <div className="grid grid-cols-2 gap-3 p-1 rounded-2xl bg-neutral-100/70 border border-neutral-200/50">
                <button
                  type="button"
                  onClick={() => setRole("visitor")}
                  className={`py-3 px-4 rounded-xl font-display text-sm font-semibold tracking-wide transition-all duration-300 ${
                    role === "visitor"
                      ? "bg-[#358597] text-white shadow-md"
                      : "text-neutral-500 hover:text-[#2A2A2A]"
                  }`}
                >
                  Visitor
                </button>
                <button
                  type="button"
                  onClick={() => setRole("organizer")}
                  className={`py-3 px-4 rounded-xl font-display text-sm font-semibold tracking-wide transition-all duration-300 ${
                    role === "organizer"
                      ? "bg-[#EA7963] text-white shadow-md"
                      : "text-neutral-500 hover:text-[#2A2A2A]"
                  }`}
                >
                  Organizer
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs flex gap-2.5 items-start leading-relaxed font-sans">
              <AlertCircle size={16} className="shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!successMessage && (
            <form onSubmit={handleFormSubmit} className="space-y-4 font-sans">
              {/* Full Name — Sign-up only */}
              {mode === "signup" && (
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5 pl-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Chima Okereke"
                    className="w-full h-12 px-4 rounded-2xl border border-neutral-200/80 bg-neutral-50/50 focus:outline-none focus:ring-2 focus:ring-[#358597]/25 focus:border-[#358597] text-sm text-[#2A2A2A] placeholder-neutral-300 transition-all font-light"
                  />
                </div>
              )}

              {/* Organizer-specific fields */}
              {mode === "signup" && role === "organizer" && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1.5 pl-1">
                      Organization Name
                    </label>
                    <div className="relative">
                      <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" />
                      <input
                        type="text"
                        required
                        value={organizationName}
                        onChange={(e) => setOrganizationName(e.target.value)}
                        placeholder="Berlin Arts Collective"
                        className="w-full h-12 pl-11 pr-4 rounded-2xl border border-neutral-200/80 bg-neutral-50/50 focus:outline-none focus:ring-2 focus:ring-[#EA7963]/25 focus:border-[#EA7963] text-sm text-[#2A2A2A] placeholder-neutral-300 transition-all font-light"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1.5 pl-1">
                      Venue Name <span className="text-neutral-300 font-light">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={venueName}
                      onChange={(e) => setVenueName(e.target.value)}
                      placeholder="e.g., Kreuzberg Gallery Hall"
                      className="w-full h-12 px-4 rounded-2xl border border-neutral-200/80 bg-neutral-50/50 focus:outline-none focus:ring-2 focus:ring-[#EA7963]/25 focus:border-[#EA7963] text-sm text-[#2A2A2A] placeholder-neutral-300 transition-all font-light"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 pl-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="chima@kultura.dev"
                  className="w-full h-12 px-4 rounded-2xl border border-neutral-200/80 bg-neutral-50/50 focus:outline-none focus:ring-2 focus:ring-[#358597]/25 focus:border-[#358597] text-sm text-[#2A2A2A] placeholder-neutral-300 transition-all font-light"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 pl-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 px-4 rounded-2xl border border-neutral-200/80 bg-neutral-50/50 focus:outline-none focus:ring-2 focus:ring-[#358597]/25 focus:border-[#358597] text-sm text-[#2A2A2A] placeholder-neutral-300 transition-all font-light"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full h-12 rounded-full font-display font-medium tracking-wide text-white transition-all duration-300 shadow-md flex items-center justify-center gap-2 mt-2 ${
                  loading 
                    ? "bg-neutral-400 cursor-not-allowed" 
                    : mode === "login" 
                      ? "bg-[#358597] hover:bg-[#2C6E7D]" 
                      : "bg-[#EA7963] hover:bg-[#D96853]"
                }`}
              >
                {loading ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white/35 border-t-white animate-spin"></div>
                ) : mode === "login" ? (
                  <>
                    <LogIn size={16} />
                    Log In
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    Create Account
                  </>
                )}
              </button>
            </form>
          )}

          {/* Social Sign In Divider */}
          {!successMessage && (
            <>
              <div className="relative my-6 font-sans">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-100"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[#FDFDFD] px-3.5 text-neutral-400 font-light">or connect with</span>
                </div>
              </div>

              {/* Google Sign In */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full h-12 rounded-full border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 transition-colors font-display text-sm font-medium tracking-wide shadow-sm flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4 mr-1 shrink-0" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google Profile
              </button>
            </>
          )}

          {/* Toggle Mode */}
          {!successMessage && (
            <div className="text-center mt-6 font-sans text-xs font-light text-neutral-400">
              {mode === "login" ? (
                <p>
                  Don't have an account?{" "}
                  <button 
                    onClick={() => { setMode("signup"); setError(null); }}
                    className="font-medium text-[#358597] hover:underline"
                  >
                    Sign Up
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{" "}
                  <button 
                    onClick={() => { setMode("login"); setError(null); }}
                    className="font-medium text-[#EA7963] hover:underline"
                  >
                    Log In
                  </button>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
