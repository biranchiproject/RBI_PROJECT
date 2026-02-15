import { Bell, Search, UserCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

export function Header({ title }: { title: string }) {
  return (
    <header className="h-20 flex items-center justify-between px-8 mb-8">
      <div>
        <h2 className="text-3xl font-bold font-rajdhani text-white tracking-wide">
          {title}
        </h2>
        <p className="text-muted-foreground text-sm">
          RBI Circular Intelligence System
        </p>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative hidden md:block w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            className="pl-10 bg-black/20 border-white/10 focus:border-primary/50 focus:ring-primary/20 rounded-full" 
            placeholder="Global search..." 
          />
        </div>

        <div className="flex items-center gap-4">
          <button className="relative p-2 rounded-full hover:bg-white/5 transition-colors text-muted-foreground hover:text-white">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(0,255,255,0.8)]" />
          </button>
          
          <div className="h-8 w-[1px] bg-white/10" />
          
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-white">Admin User</p>
              <p className="text-xs text-primary">System Online</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary p-[2px]">
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                <UserCircle className="w-full h-full text-white/80" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
