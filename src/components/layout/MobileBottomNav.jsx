import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Compass, Ticket, Briefcase, ShieldCheck, User } from "lucide-react";

const MobileBottomNav = ({ onOpenAuth }) => {
  const { user, profile } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  // Determine the role-specific workspace tab
  const getWorkspaceTab = () => {
    if (!user) return null;

    if (profile?.role === "admin" || (user && ["demo-admin-uid", "admin-demo-uid"].includes(user.uid))) {
      return {
        label: "Admin",
        icon: ShieldCheck,
        path: "/admin",
        activeColor: "text-rose-500",
        inactiveColor: "text-neutral-400"
      };
    }

    if (profile?.role === "organizer") {
      return {
        label: "My Events",
        icon: Briefcase,
        path: "/organizer",
        activeColor: "text-[#EA7963]",
        inactiveColor: "text-neutral-400"
      };
    }

    // Default: visitor
    return {
      label: "My Collection",
      icon: Ticket,
      path: "/wallet",
      activeColor: "text-[#358597]",
      inactiveColor: "text-neutral-400"
    };
  };

  const workspaceTab = getWorkspaceTab();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 block sm:hidden">
      <nav className="bg-white/80 backdrop-blur-2xl border-t border-neutral-200/60 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] px-2 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-stretch justify-around h-16">
          {/* Discover Tab */}
          <Link
            to="/"
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 transition-colors duration-200 ${
              isActive("/") ? "text-[#358597]" : "text-neutral-400"
            }`}
          >
            <Compass size={20} strokeWidth={isActive("/") ? 2.5 : 1.5} />
            <span className={`text-[10px] tracking-wide ${isActive("/") ? "font-semibold" : "font-medium"}`}>
              Discover
            </span>
            {isActive("/") && (
              <div className="absolute bottom-1.5 w-5 h-0.5 rounded-full bg-[#358597]" />
            )}
          </Link>

          {/* Role-specific Workspace Tab */}
          {user && workspaceTab ? (
            <Link
              to={workspaceTab.path}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 relative transition-colors duration-200 ${
                isActive(workspaceTab.path) ? workspaceTab.activeColor : workspaceTab.inactiveColor
              }`}
            >
              <workspaceTab.icon size={20} strokeWidth={isActive(workspaceTab.path) ? 2.5 : 1.5} />
              <span className={`text-[10px] tracking-wide truncate max-w-[72px] ${isActive(workspaceTab.path) ? "font-semibold" : "font-medium"}`}>
                {workspaceTab.label}
              </span>
              {isActive(workspaceTab.path) && (
                <div className={`absolute bottom-1.5 w-5 h-0.5 rounded-full ${
                  profile?.role === "organizer" ? "bg-[#EA7963]" : 
                  profile?.role === "admin" ? "bg-rose-500" : "bg-[#358597]"
                }`} />
              )}
            </Link>
          ) : !user ? (
            /* Profile / Sign In tab for unauthenticated users */
            <button
              onClick={onOpenAuth}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 text-neutral-400 transition-colors duration-200"
            >
              <User size={20} strokeWidth={1.5} />
              <span className="text-[10px] tracking-wide font-medium">Sign In</span>
            </button>
          ) : null}

          {/* Profile avatar for authenticated users */}
          {user && (
            <div className="flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0">
              <div className="w-7 h-7 rounded-full bg-[#358597]/10 border border-[#358597]/20 flex items-center justify-center text-[#358597] text-[10px] font-bold font-sans">
                {profile?.displayName
                  ? profile.displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
                  : user.email ? user.email[0].toUpperCase() : "U"
                }
              </div>
              <span className="text-[10px] tracking-wide font-medium text-neutral-400 truncate max-w-[72px]">
                {profile?.displayName?.split(" ")[0] || "Profile"}
              </span>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
};

export default MobileBottomNav;
