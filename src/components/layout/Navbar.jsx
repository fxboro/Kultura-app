import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { LogOut, User, Compass, Ticket, ShieldCheck, Briefcase } from "lucide-react";

const Navbar = ({ onOpenAuth }) => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const getProfileInitials = () => {
    if (!user) return "";
    if (user.displayName) {
      return user.displayName.split(" ").map(n => n[0]).join("").toUpperCase();
    }
    return user.email ? user.email[0].toUpperCase() : "U";
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#FDFDFD]/70 backdrop-blur-xl border-b border-neutral-100/80 px-4 md:px-8 py-3.5 flex items-center justify-between">
      {/* Brand Logo */}
      <Link to="/" className="flex items-center gap-2">
        <span className="font-display font-bold text-2xl tracking-tight text-[#2A2A2A] hover:opacity-90 transition-opacity">
          Kultura
        </span>
      </Link>

      {/* Dynamic Route Navigation Items */}
      <div className="flex items-center gap-2 md:gap-4">
        {user && profile && (
          <div className="hidden sm:flex items-center gap-2 mr-2">
            {profile.role === "admin" && (
              <Link 
                to="/admin" 
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100/50 transition-colors"
              >
                <ShieldCheck size={14} />
                Admin Panel
              </Link>
            )}
            {profile.role === "organizer" && (
              <Link 
                to="/organizer" 
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium text-[#EA7963] bg-[#EA7963]/10 border border-[#EA7963]/20 hover:bg-[#EA7963]/25 transition-colors"
              >
                <Briefcase size={14} />
                Organizer Portal
              </Link>
            )}
            {profile.role === "visitor" && (
              <Link 
                to="/wallet" 
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium text-[#358597] bg-[#358597]/10 border border-[#358597]/20 hover:bg-[#358597]/25 transition-colors"
              >
                <Ticket size={14} />
                My Collection
              </Link>
            )}
          </div>
        )}

        {/* Global Discover Link */}
        <Link 
          to="/" 
          className="flex items-center gap-1.5 text-neutral-500 hover:text-[#2A2A2A] px-3.5 py-2 rounded-full text-sm font-medium transition-colors"
        >
          <Compass size={16} />
          <span className="hidden md:inline">Discover</span>
        </Link>

        {/* Auth Actions / Avatar */}
        {user ? (
          <div className="flex items-center gap-3">
            {/* User Profile Thumbnail */}
            <div className="flex items-center gap-2 pl-2 border-l border-neutral-100">
              <div className="w-9 h-9 rounded-full bg-[#358597]/10 border border-[#358597]/20 flex items-center justify-center text-[#358597] text-xs font-bold font-sans shadow-inner">
                {getProfileInitials()}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-medium text-[#2A2A2A] truncate max-w-[120px]">
                  {user.displayName || user.email}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-semibold leading-none mt-0.5">
                  {profile?.role || "Visitor"}
                </span>
              </div>
            </div>
            
            {/* Logout Button */}
            <button 
              onClick={handleLogout}
              className="w-10 h-10 rounded-full border border-neutral-200 text-neutral-500 hover:text-rose-600 hover:border-rose-200 flex items-center justify-center transition-all duration-300 shadow-sm"
              title="Log Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => onOpenAuth()}
            className="h-10 px-5 rounded-full bg-[#2A2A2A] text-white hover:bg-neutral-800 transition-colors duration-300 font-display text-sm font-medium tracking-wide shadow-md flex items-center gap-2"
          >
            <User size={15} />
            Log In
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
