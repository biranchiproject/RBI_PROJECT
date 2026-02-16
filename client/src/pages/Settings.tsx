import Layout from "@/components/Layout";
import { Header } from "@/components/Header";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Moon, Sun, Bell, Shield, Key } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

export default function Settings() {
  const { toast } = useToast();

  // State for settings with localStorage persistence initialization
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") !== "light";
  });

  const [notifications, setNotifications] = useState({
    newCirculars: true,
    dailyDigest: false
  });

  const [security, setSecurity] = useState({
    twoFactor: false
  });

  useEffect(() => {
    // Load saved settings
    const savedNotifs = localStorage.getItem("notifications");
    if (savedNotifs) {
      setNotifications(JSON.parse(savedNotifs));
    }

    const savedSec = localStorage.getItem("security");
    if (savedSec) {
      setSecurity(JSON.parse(savedSec));
    }
  }, []);

  // Handlers
  const handleThemeToggle = (checked: boolean) => {
    setDarkMode(checked);
    localStorage.setItem("theme", checked ? "dark" : "light");
    // In a real app, this would toggle a class on the document body or html
    toast({
      title: checked ? "Dark Mode Enabled" : "Light Mode Enabled",
      description: "Preferences have been saved locally.",
    });
  };

  const handleNotificationChange = (key: keyof typeof notifications, checked: boolean) => {
    const newNotifs = { ...notifications, [key]: checked };
    setNotifications(newNotifs);
    localStorage.setItem("notifications", JSON.stringify(newNotifs));
    toast({
      title: "Settings Updated",
      description: `Notifications for ${key === 'newCirculars' ? 'Circulars' : 'Daily Digest'} ${checked ? 'enabled' : 'disabled'}.`
    });
  };

  const handleSecurityChange = (key: keyof typeof security, checked: boolean) => {
    const newSec = { ...security, [key]: checked };
    setSecurity(newSec);
    localStorage.setItem("security", JSON.stringify(newSec));
    toast({
      title: "Security Settings Updated",
      description: `Two-Factor Authentication ${checked ? 'enabled' : 'disabled'}.`
    });
  };

  return (
    <Layout>
      <div className="p-8 overflow-y-auto h-full">
        <Header title="System Settings" />

        <div className="max-w-3xl space-y-8">
          {/* Appearance */}
          <section className="glass-panel p-6 rounded-2xl">
            <h3 className="text-xl font-bold font-rajdhani text-white mb-6 flex items-center gap-2">
              <Moon className="w-5 h-5 text-primary" />
              Appearance & Theme
            </h3>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
              <div>
                <Label className="text-base text-white">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">Enable futuristic neon dark mode.</p>
              </div>
              <Switch
                checked={darkMode}
                onCheckedChange={handleThemeToggle}
              />
            </div>
          </section>

          {/* Notifications */}
          <section className="glass-panel p-6 rounded-2xl">
            <h3 className="text-xl font-bold font-rajdhani text-white mb-6 flex items-center gap-2">
              <Bell className="w-5 h-5 text-secondary" />
              Notifications
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                <div>
                  <Label className="text-base text-white">New Circular Alerts</Label>
                  <p className="text-sm text-muted-foreground">Get notified when new circulars are uploaded.</p>
                </div>
                <Switch
                  checked={notifications.newCirculars}
                  onCheckedChange={(c) => handleNotificationChange("newCirculars", c)}
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                <div>
                  <Label className="text-base text-white">Daily Digest</Label>
                  <p className="text-sm text-muted-foreground">Receive a daily summary of compliance updates.</p>
                </div>
                <Switch
                  checked={notifications.dailyDigest}
                  onCheckedChange={(c) => handleNotificationChange("dailyDigest", c)}
                />
              </div>
            </div>
          </section>

          {/* Security */}
          <section className="glass-panel p-6 rounded-2xl">
            <h3 className="text-xl font-bold font-rajdhani text-white mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-400" />
              Security & Access
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                <div>
                  <Label className="text-base text-white">Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Secure your account with 2FA.</p>
                </div>
                <Switch
                  checked={security.twoFactor}
                  onCheckedChange={(c) => handleSecurityChange("twoFactor", c)}
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                <div>
                  <Label className="text-base text-white">API Keys</Label>
                  <p className="text-sm text-muted-foreground">Manage your API access keys.</p>
                </div>
                <Button variant="ghost" className="text-muted-foreground hover:text-white">Manage Keys</Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
