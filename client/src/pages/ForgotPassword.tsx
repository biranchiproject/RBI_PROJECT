import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Cpu, ArrowLeft, Mail } from "lucide-react";
import { useState } from "react";
import { auth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { useToast } from "@/components/ui/use-toast";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            toast({
                title: "Email Sent",
                description: "Check your inbox for password reset instructions.",
                variant: "default"
            });
        } catch (error: any) {
            toast({
                title: "Request Failed",
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
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 blur-[120px] rounded-full opacity-20 pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                <Link href="/login">
                    <Button variant="ghost" className="mb-6 text-zinc-400 hover:text-white pl-0 hover:bg-transparent">
                        <ArrowLeft className="mr-2 w-4 h-4" /> Back to Login
                    </Button>
                </Link>

                <div className="glass-panel p-8 rounded-2xl border border-white/5 bg-[#0B0F14]/50 backdrop-blur-xl shadow-2xl">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/50 flex items-center justify-center mb-4">
                            <Mail className="w-6 h-6 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold font-rajdhani tracking-wider">
                            Reset Password
                        </h1>
                        <p className="text-zinc-500 text-sm mt-2 text-center">
                            Enter your email address and we'll send you a link to reset your password.
                        </p>
                    </div>

                    <form onSubmit={handleReset} className="space-y-6">
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

                        <Button
                            type="submit"
                            className="w-full bg-primary text-[#0B0F14] hover:bg-primary/90 font-bold shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                            disabled={loading}
                        >
                            {loading ? "Sending Link..." : "Send Reset Link"}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
