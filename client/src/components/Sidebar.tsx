import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  UploadCloud, 
  FileText, 
  Bot, 
  BarChart3, 
  Settings, 
  LogOut 
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: UploadCloud, label: "Upload", href: "/upload" },
  { icon: FileText, label: "Library", href: "/library" },
  { icon: Bot, label: "AI Assistant", href: "/assistant" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 h-screen fixed left-0 top-0 glass-panel border-r border-white/10 flex flex-col z-50">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-primary/20 border border-primary flex items-center justify-center">
          <div className="w-4 h-4 bg-primary rotate-45" />
        </div>
        <h1 className="text-xl font-bold font-rajdhani tracking-wider text-white">
          FIN<span className="text-primary">TECH</span>.AI
        </h1>
      </div>

      <div className="flex-1 px-4 py-4 space-y-2">
        <p className="px-4 text-xs font-medium text-muted-foreground mb-4 uppercase tracking-widest">
          Main Menu
        </p>
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer group",
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/30 shadow-[0_0_15px_rgba(0,255,255,0.15)]"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon 
                  className={cn(
                    "w-5 h-5 transition-transform duration-300 group-hover:scale-110", 
                    isActive && "animate-pulse"
                  )} 
                />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(0,255,255,0.8)]" />
                )}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-white/5 space-y-2">
        <Link href="/settings">
          <div className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer text-muted-foreground hover:bg-white/5 hover:text-white",
            location === "/settings" && "text-white bg-white/5"
          )}>
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </div>
        </Link>
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors">
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
