import { useState, useEffect, useRef } from "react";
import { API_BASE_URL } from "@/lib/utils";
import { Bell, Search, Check, Clock, AlertCircle, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: number;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export function Header({ title }: { title: string }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Poll for unread count every 10 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isDropdownOpen) {
      fetchNotifications();
    }
  }, [isDropdownOpen]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/unread-count`);
      const data = await res.json();
      setUnreadCount(data.count);
    } catch (e) {
      console.error("Failed to fetch unread count", e);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications`);
      const data = await res.json();
      setNotifications(data);
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await fetch(`${API_BASE_URL}/api/notifications/${id}/mark-read`, { method: "POST" });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error("Failed to mark as read", e);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/notifications/mark-all-read`, { method: "POST" });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error("Failed to mark all as read", e);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'upload': return <FileText className="w-4 h-4 text-blue-400" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-400" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <header className="h-20 flex items-center justify-between px-8 mb-8 relative z-50">
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

        {/* Notification Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="relative p-2 rounded-full hover:bg-white/5 transition-colors text-muted-foreground hover:text-white"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(255,50,50,0.8)] animate-pulse" />
            )}
          </button>

          {/* Dropdown */}
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 top-12 w-80 bg-[#0e0e1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl"
              >
                <div className="p-3 border-b border-white/5 flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground text-sm">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => !notif.is_read && markAsRead(notif.id)}
                        className={`p-3 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${!notif.is_read ? 'bg-primary/5' : ''}`}
                      >
                        <div className="flex gap-3">
                          <div className={`mt-1 p-1.5 rounded-full ${!notif.is_read ? 'bg-primary/10' : 'bg-white/5'}`}>
                            {getIcon(notif.type)}
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm ${!notif.is_read ? 'text-white font-medium' : 'text-muted-foreground'}`}>
                              {notif.message}
                            </p>
                            <p className="text-xs text-white/40 mt-1">
                              {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
