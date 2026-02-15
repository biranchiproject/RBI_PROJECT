import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Moon, Sun, Bell, Shield, Key } from "lucide-react";

export default function Settings() {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
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
              <Switch checked={true} />
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
                <Switch checked={true} />
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                <div>
                  <Label className="text-base text-white">Daily Digest</Label>
                  <p className="text-sm text-muted-foreground">Receive a daily summary of compliance updates.</p>
                </div>
                <Switch />
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
                <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">Enable</Button>
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
      </main>
    </div>
  );
}
