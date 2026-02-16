import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
    ShieldCheck,
    FileText,
    Cpu,
    Database,
    Search,
    ArrowRight,
    CheckCircle2,
    Brain
} from "lucide-react";
import { HeroMobileShowcase } from "@/components/HeroMobileShowcase";
import ParticleBackground from "@/components/ParticleBackground";
import CircuitBackground from "@/components/CircuitBackground";

export default function Landing() {
    const { user } = useAuth();
    return (
        <div className="min-h-screen bg-[#0B0F14] text-white selection:bg-primary/30 selection:text-primary overflow-x-hidden">
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#0B0F14]/80 backdrop-blur-md">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/50 flex items-center justify-center">
                            <Cpu className="w-6 h-6 text-primary animate-pulse" />
                        </div>
                        <span className="text-2xl font-bold font-rajdhani tracking-wider">
                            FIN<span className="text-primary">TECH</span>.AI
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        {user ? (
                            <Link href="/dashboard">
                                <Button className="bg-primary text-[#0B0F14] hover:bg-primary/90 font-bold shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all hover:scale-105">
                                    Go to Dashboard
                                </Button>
                            </Link>
                        ) : (
                            <>
                                <Link href="/login">
                                    <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-white/5">
                                        Login
                                    </Button>
                                </Link>
                                <Link href="/signup">
                                    <Button className="bg-primary text-[#0B0F14] hover:bg-primary/90 font-bold shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all hover:scale-105">
                                        Get Started
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
                {/* Dynamic Particle Background - The "Connected Dots" effect requested */}
                <ParticleBackground />

                {/* Subtle base gradient underlay for better text contrast */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#0B0F14]/80 via-transparent to-[#0B0F14] pointer-events-none z-0" />

                <div className="container mx-auto px-6 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        <span className="text-sm font-medium tracking-wide">RBI REGULATORY INTELLIGENCE</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold font-rajdhani leading-tight mb-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
                        AI-Powered <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Compliance</span> <br />
                        Question Answering System
                    </h1>

                    <p className="text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                        Secure RAG system designed for extracting regulatory data from complex RBI circular PDFs including nested tables and conditional financial limits.
                    </p>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                        {user ? (
                            <Link href="/dashboard">
                                <Button size="lg" className="h-14 px-8 text-lg bg-primary text-[#0B0F14] hover:bg-primary/90 font-bold shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all hover:scale-105 group">
                                    Go to Dashboard
                                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                        ) : (
                            <>
                                <Link href="/signup">
                                    <Button size="lg" className="h-14 px-8 text-lg bg-primary text-[#0B0F14] hover:bg-primary/90 font-bold shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all hover:scale-105 group">
                                        Start Free Trial
                                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </Link>
                                <Link href="#features">
                                    <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-white/10 text-white hover:bg-white/5 hover:text-primary hover:border-primary/50 transition-all">
                                        View Demo
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>

                    {/* MacBook Frame Container */}
                    <div className="mt-20 relative mx-auto max-w-6xl animate-in fade-in zoom-in-95 duration-1000 delay-500 perspective-[2000px]">
                        {/* Laptop Lid/Screen */}
                        <div className="relative bg-[#0d1117] rounded-[2rem] border-[8px] border-[#2b2b2b] shadow-2xl overflow-hidden aspect-[16/10] md:aspect-[16/9]">
                            {/* Camera Notch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-[#2b2b2b] rounded-b-xl z-50 flex justify-center items-center">
                                <div className="w-2 h-2 rounded-full bg-[#1a1a1a] border border-[#333]" />
                            </div>

                            {/* Screen Content */}
                            <div className="absolute inset-0 bg-[#0B1220] overflow-hidden">
                                {/* Background Effects inside Screen - GREEN NEON as requested */}
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(0,245,160,0.15),transparent_70%)] pointer-events-none" />
                                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(0,245,160,0.05))] pointer-events-none" />

                                {/* Floating Orbs */}
                                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full opacity-40 animate-pulse pointer-events-none" />
                                <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#00F5A0]/10 blur-[100px] rounded-full opacity-30 pointer-events-none" />

                                {/* The Floating Mobile Showcase inside the Laptop Screen */}
                                <div className="relative w-full h-full flex items-center justify-center scale-90 md:scale-100 origin-center pt-10">
                                    <HeroMobileShowcase />
                                </div>
                            </div>
                        </div>

                        {/* Laptop Base */}
                        <div className="relative mx-auto w-full max-w-[120%] -mt-1 h-4 bg-[#3a3a3a] rounded-b-3xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] z-0">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-2 bg-[#2b2b2b] rounded-b-lg" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 relative bg-[#0B0F14] overflow-hidden">
                {/* Circuit Lines Background - Center is clear */}
                <CircuitBackground />

                <div className="absolute inset-0 bg-gradient-to-b from-[#0B0F14] via-transparent to-[#0B0F14] pointer-events-none" />

                <div className="container mx-auto px-6 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold font-rajdhani mb-4">
                            Enterprise-Grade <span className="text-primary">Compliance AI</span>
                        </h2>
                        <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                            Built for financial institutions requiring strict data security and high-precision extraction.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={FileText}
                            title="Complex Table Extraction"
                            description="Advanced OCR & parsing logic to correctly interpret nested tables and financial limits in circulars."
                        />
                        <FeatureCard
                            icon={ShieldCheck}
                            title="Secure On-Prem RAG"
                            description="Your data never leaves your secure environment. Enterprise-ready security and role-based access."
                        />
                        <FeatureCard
                            icon={Search}
                            title="Source-Cited Answers"
                            description="Every answer includes direct citations to the specific circular paragraph and page number."
                        />
                        <FeatureCard
                            icon={Cpu}
                            title="Natural Language Query"
                            description="Ask complex regulatory questions in plain English and get instant, accurate compliance advice."
                        />
                        <FeatureCard
                            icon={Database}
                            title="Historical Analysis"
                            description="Track changes in regulations over time with our version-controlled document knowledge base."
                        />
                        <FeatureCard
                            icon={CheckCircle2}
                            title="Audit Ready"
                            description="Full logs of all AI interactions and document access for internal and external audits."
                        />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-white/5 bg-[#080a0e] relative z-10">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                        <div className="col-span-1 md:col-span-2">
                            <span className="text-2xl font-bold font-rajdhani tracking-wider block mb-4">
                                FIN<span className="text-primary">TECH</span>.AI
                            </span>
                            <p className="text-zinc-500 max-w-sm mb-6">
                                The definitive AI platform for Indian Banking Regulation analysis and compliance automation.
                            </p>
                            <div className="flex gap-4">
                                {/* Social Placeholders */}
                                <div className="w-10 h-10 rounded-full bg-white/5 hover:bg-primary/20 hover:text-primary flex items-center justify-center transition-colors cursor-pointer">
                                    <span className="font-bold">X</span>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-white/5 hover:bg-primary/20 hover:text-primary flex items-center justify-center transition-colors cursor-pointer">
                                    <span className="font-bold">in</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-6">Platform</h4>
                            <ul className="space-y-3 text-zinc-500">
                                <li className="hover:text-primary cursor-pointer transition-colors">Features</li>
                                <li className="hover:text-primary cursor-pointer transition-colors">Security</li>
                                <li className="hover:text-primary cursor-pointer transition-colors">Enterprise</li>
                                <li className="hover:text-primary cursor-pointer transition-colors">Pricing</li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-6">Support</h4>
                            <ul className="space-y-3 text-zinc-500">
                                <li className="hover:text-primary cursor-pointer transition-colors">Documentation</li>
                                <li className="hover:text-primary cursor-pointer transition-colors">API Reference</li>
                                <li className="hover:text-primary cursor-pointer transition-colors">Contact Us</li>
                                <li className="hover:text-primary cursor-pointer transition-colors">Status</li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-zinc-600 text-sm">
                            © 2026 Fintech AI. All rights reserved. Not affiliated with RBI.
                        </p>
                        <div className="flex gap-6 text-sm text-zinc-600">
                            <span className="hover:text-white cursor-pointer">Privacy Policy</span>
                            <span className="hover:text-white cursor-pointer">Terms of Service</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
    return (
        <div className="group p-8 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/50 hover:bg-white/[0.07] transition-all duration-300 hover:-translate-y-1">
            <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                <Icon className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 font-rajdhani">{title}</h3>
            <p className="text-zinc-400 leading-relaxed">
                {description}
            </p>
        </div>
    );
}
