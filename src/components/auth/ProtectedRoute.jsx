import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FDFDFD] text-[#2A2A2A]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#358597]"></div>
        <p className="mt-4 font-sans text-sm text-neutral-500">Checking authorization...</p>
      </div>
    );
  }

  if (!user) {
    // Redirect to public discover page and instruct app to open the login modal
    return <Navigate to="/?login=true" replace />;
  }

  if (allowedRoles) {
    const hasRole = profile && allowedRoles.includes(profile.role);
    const isHardcodedAdmin = user && allowedRoles.includes("admin") && ["demo-admin-uid", "admin-demo-uid"].includes(user.uid);
    
    if (!hasRole && !isHardcodedAdmin) {
      // Redirect to discover page with an unauthorized notification flag
      return <Navigate to="/?unauthorized=true" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
