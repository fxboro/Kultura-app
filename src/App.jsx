import React, { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useSearchParams } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/layout/Navbar";
import AuthModal from "./components/auth/AuthModal";
import ProtectedRoute from "./components/auth/ProtectedRoute";

// Views (Lazy Loaded for performance & code splitting)
const Discover = lazy(() => import("./views/visitor/Discover"));
const Wallet = lazy(() => import("./views/visitor/Wallet"));
const OrganizerDashboard = lazy(() => import("./views/organizer/Dashboard"));
const Admin = lazy(() => import("./views/admin/Admin"));

const AppContent = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("login") === "true") {
      setAuthModalOpen(true);
      // Remove query param to clean URL
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("login");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleDismissAlert = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("unauthorized");
    setSearchParams(newParams, { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-[#2A2A2A] font-sans flex flex-col">
      <Navbar onOpenAuth={() => setAuthModalOpen(true)} />
      
      {/* Unauthorized Redirection Alert Banner */}
      {searchParams.get("unauthorized") === "true" && (
        <div className="bg-rose-50 border-b border-rose-100 px-6 py-3 text-rose-600 text-center text-xs font-semibold flex items-center justify-center gap-4 transition-all duration-300">
          <span>You do not have access rights to the requested workspace view.</span>
          <button 
            onClick={handleDismissAlert} 
            className="underline hover:text-rose-800 transition-colors uppercase tracking-wider text-[10px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Primary Route Switcher */}
      <main className="flex-grow">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center min-h-[50vh] bg-[#FDFDFD]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#358597]"></div>
            <p className="mt-4 font-sans text-xs text-neutral-400 font-light">Loading view...</p>
          </div>
        }>
          <Routes>
            <Route path="/" element={<Discover />} />
            <Route 
              path="/wallet" 
              element={
                <ProtectedRoute allowedRoles={["visitor"]}>
                  <Wallet />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/organizer" 
              element={
                <ProtectedRoute allowedRoles={["organizer"]}>
                  <OrganizerDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Admin />
                </ProtectedRoute>
              } 
            />
            {/* Fallback back to discover feed */}
            <Route path="*" element={<Discover />} />
          </Routes>
        </Suspense>
      </main>

      {/* Global Portal modal */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        defaultMode="login"
      />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
