import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Cpu, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { useToast } from "@/components/ui/use-toast";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [, setLocation] = useLocation();
    const { toast } = useToast();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            toast({ title: "Login Successful", description: "Welcome back to Fintech AI." });
            setLocation("/dashboard");
        } catch (error: any) {
            toast({
                title: "Login Failed",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0B0F14] text-white flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/10 blur-[120px] rounded-full opacity-20 pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                <Link href="/">
                    <Button variant="ghost" className="mb-6 text-zinc-400 hover:text-white pl-0 hover:bg-transparent">
                        <ArrowLeft className="mr-2 w-4 h-4" /> Back to Home
                    </Button>
                </Link>

                <div className="glass-panel p-8 rounded-2xl border border-white/5 bg-[#0B0F14]/50 backdrop-blur-xl shadow-2xl">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/50 flex items-center justify-center mb-4">
                            <Cpu className="w-7 h-7 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold font-rajdhani tracking-wider">
                            Welcome Back
                        </h1>
                        <p className="text-zinc-500 text-sm mt-2">
                            Sign in to access your regulatory dashboard
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@company.com"
                                className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus:border-primary/50"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <Link href="/forgot-password">
                                    <span className="text-xs text-primary hover:underline cursor-pointer">Forgot password?</span>
                                </Link>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus:border-primary/50"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-primary text-[#0B0F14] hover:bg-primary/90 font-bold shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                            disabled={loading}
                        >
                            {loading ? "Signing in..." : "Sign In"}
                        </Button>
                    </form>

                    <div className="my-6 flex items-center gap-4">
                        <div className="h-px bg-white/10 flex-1" />
                        <span className="text-xs text-zinc-500 font-medium">OR CONTINUE WITH</span>
                        <div className="h-px bg-white/10 flex-1" />
                    </div>

                    <Button
                        variant="outline"
                        className="w-full border-white/10 hover:bg-white/5 text-white hover:text-primary"
                        onClick={async () => {
                            try {
                                await signInWithPopup(auth, googleProvider);
                                toast({ title: "Login Successful", description: "Welcome back!" });
                                setLocation("/dashboard");
                            } catch (error: any) {
                                toast({
                                    title: "Google Login Failed",
                                    description: error.message,
                                    variant: "destructive"
                                });
                            }
                        }}
                    >
                        <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                        Google
                    </Button>

                    <div className="mt-8 text-center text-sm text-zinc-500">
                        Don't have an account? {" "}
                        <Link href="/signup">
                            <span className="text-white hover:text-primary cursor-pointer font-medium transition-colors">
                                Sign up
                            </span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
