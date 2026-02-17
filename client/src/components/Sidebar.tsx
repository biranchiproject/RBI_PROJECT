import { Link, useLocation } from "wouter";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  UploadCloud,
  FileText,
  Bot,
  BarChart3,
  Settings,
  LogOut,
  Home,
  UserCircle,
  ChevronUp,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

// Navigation Items
const NAV_ITEMS = [
  { icon: Home, label: "Home", href: "/" },
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: UploadCloud, label: "Upload", href: "/upload" },
  { icon: FileText, label: "Library", href: "/library" },
  { icon: Bot, label: "AI Assistant", href: "/assistant" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
];

interface SidebarProps {
  className?: string;
  onClose?: () => void;
  onToggle?: () => void;
}

export function Sidebar({ className, onClose, onToggle }: SidebarProps) {
  const [location] = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    await signOut(auth);
    setLocation("/login");
  };

  return (
    <div className={cn("glass-panel border-r border-white/10 flex flex-col h-full bg-card/60 backdrop-blur-md", className)}>
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary/20 border border-primary flex items-center justify-center">
            <div className="w-4 h-4 bg-primary rotate-45" />
          </div>
          <h1 className="text-xl font-bold font-rajdhani tracking-wider text-white">
            FIN<span className="text-primary">TECH</span>.AI
          </h1>
        </div>
        {onToggle && (
          <button
            onClick={onToggle}
            className="bg-primary/10 text-primary hover:bg-primary/20 p-2 rounded-lg transition-colors"
            title="Collapse Sidebar"
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-panel-left-close"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><path d="M9 3v18" /><path d="m16 15-3-3 3-3" /></svg>
            </div>
          </button>
        )}
      </div>

      <div className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        <p className="px-4 text-xs font-medium text-muted-foreground mb-4 uppercase tracking-widest">
          Main Menu
        </p>
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} onClick={onClose}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer group relative overflow-hidden",
                  isActive
                    ? "bg-primary/20 text-primary border border-primary/40 shadow-[0_0_20px_rgba(0,255,136,0.25)]"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none"
                    initial={{ x: -100 }}
                    animate={{ x: 0 }}
                  />
                )}
                <item.icon
                  className={cn(
                    "w-5 h-5 transition-transform duration-300 group-hover:scale-110 relative z-10",
                    isActive && "text-primary filter drop-shadow-[0_0_8px_rgba(0,255,136,0.6)]"
                  )}
                />
                <span className="font-medium relative z-10">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_12px_rgba(0,255,136,1)] relative z-10" />
                )}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-white/5 mt-auto relative">
        {showUserMenu && (
          <div className="absolute bottom-full left-4 right-4 mb-2 bg-[#1A1F2B] border border-white/10 rounded-xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-2 fade-in duration-200">
            <div className="px-4 py-3 border-b border-white/5 bg-white/5">
              <p className="text-xs text-zinc-400 uppercase tracking-wider font-bold mb-1">Signed in as</p>
              <p className="text-sm font-medium text-white truncate">{user?.displayName || "User"}</p>
              <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
            </div>

            <Link href="/history" onClick={onClose}>
              <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 cursor-pointer text-muted-foreground hover:text-white border-b border-white/5 transition-colors">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">History</span>
              </div>
            </Link>

            <Link href="/settings" onClick={onClose}>
              <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 cursor-pointer text-muted-foreground hover:text-white border-b border-white/5 transition-colors">
                <Settings className="w-4 h-4" />
                <span className="text-sm font-medium">Settings</span>
              </div>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors text-left"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        )}

        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className={cn(
            "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group border border-transparent",
            showUserMenu ? "bg-white/5 border-white/10" : "hover:bg-white/5"
          )}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary p-[2px] flex-shrink-0">
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
              ) : (
                <UserCircle className="w-full h-full text-white/80" />
              )}
            </div>
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate font-rajdhani">{user?.displayName || "Admin User"}</p>
          </div>
          <ChevronUp className={cn("w-4 h-4 text-muted-foreground transition-transform duration-300", showUserMenu && "rotate-180")} />
        </button>
      </div>
    </div>
  );
}
