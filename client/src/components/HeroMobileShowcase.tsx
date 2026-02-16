import { motion } from "framer-motion";
import {
    MessageSquare,
    Send,
    Search,
    Menu,
    MoreVertical,
    Activity,
    FileText,
    UploadCloud,
    CheckCircle2,
    BarChart3,
    ShieldCheck,
    TrendingUp
} from "lucide-react";

export function HeroMobileShowcase() {
    return (
        <div className="relative w-full max-w-5xl mx-auto h-[500px] md:h-[600px] flex items-center justify-center perspective-1000">

            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full opacity-30 pointer-events-none" />

            {/* Mobile 2: Analytics (Left, Back) */}
            <motion.div
                className="absolute left-4 md:left-20 top-10 md:top-20 w-[280px] h-[550px] bg-[#0B1220] rounded-[3rem] border-4 border-[#1A2333] shadow-2xl overflow-hidden z-10 hidden md:block"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 0.8, x: 0, y: [0, -15, 0] }}
                transition={{
                    opacity: { duration: 0.8, delay: 0.2 },
                    x: { duration: 0.8, delay: 0.2 },
                    y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }
                }}
            >
                {/* Status Bar */}
                <div className="h-6 w-full bg-black/40 flex justify-between px-6 items-center">
                    <div className="text-[10px] text-white/50">9:41</div>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-full bg-white/20"></div>
                        <div className="w-3 h-3 rounded-full bg-white/20"></div>
                    </div>
                </div>

                {/* Analytics UI */}
                <div className="p-4 space-y-4">
                    <div className="flex justify-between items-center">
                        <Menu className="w-5 h-5 text-white/60" />
                        <span className="text-white font-rajdhani font-bold">Analytics</span>
                        <div className="w-6 h-6 rounded-full bg-white/10" />
                    </div>

                    <div className="bg-[#151b2b] p-3 rounded-2xl border border-white/5">
                        <p className="text-xs text-zinc-400 mb-1">System Accuracy</p>
                        <div className="flex items-end gap-2">
                            <span className="text-2xl font-bold text-[#00F5A0] font-rajdhani">98.2%</span>
                            <span className="text-xs text-[#00F5A0] mb-1">+2.4%</span>
                        </div>
                        <div className="h-20 mt-2 flex items-end gap-1">
                            {[40, 60, 45, 70, 50, 80, 65].map((h, i) => (
                                <div key={i} className="flex-1 bg-gradient-to-t from-primary/10 to-primary/50 rounded-t-sm" style={{ height: `${h}%` }} />
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#151b2b] p-3 rounded-2xl border border-white/5">
                            <ShieldCheck className="w-5 h-5 text-[#00CFFF] mb-2" />
                            <p className="text-xs text-zinc-400">Queries</p>
                            <p className="text-lg font-bold text-white">1,245</p>
                        </div>
                        <div className="bg-[#151b2b] p-3 rounded-2xl border border-white/5">
                            <TrendingUp className="w-5 h-5 text-[#00F5A0] mb-2" />
                            <p className="text-xs text-zinc-400">Uptime</p>
                            <p className="text-lg font-bold text-white">99.9%</p>
                        </div>
                    </div>

                    <div className="bg-[#151b2b] p-3 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                            <Activity className="w-4 h-4 text-primary" />
                            <span className="text-xs text-white">Live Traffic</span>
                        </div>
                        <div className="space-y-2">
                            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full w-3/4 bg-primary rounded-full animate-pulse" />
                            </div>
                            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full w-1/2 bg-[#00CFFF] rounded-full" />
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Mobile 3: PDF Processing (Right, Back) */}
            <motion.div
                className="absolute right-4 md:right-20 top-10 md:top-20 w-[280px] h-[550px] bg-[#0B1220] rounded-[3rem] border-4 border-[#1A2333] shadow-2xl overflow-hidden z-10 hidden md:block"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 0.8, x: 0, y: [0, -15, 0] }}
                transition={{
                    opacity: { duration: 0.8, delay: 0.2 },
                    x: { duration: 0.8, delay: 0.2 },
                    y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }
                }}
            >
                {/* Status Bar */}
                <div className="h-6 w-full bg-black/40 flex justify-between px-6 items-center">
                    <div className="text-[10px] text-white/50">9:41</div>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-full bg-white/20"></div>
                        <div className="w-3 h-3 rounded-full bg-white/20"></div>
                    </div>
                </div>

                {/* PDF UI */}
                <div className="p-4 space-y-4">
                    <div className="flex justify-between items-center">
                        <FileText className="w-5 h-5 text-white/60" />
                        <span className="text-white font-rajdhani font-bold">Circulars</span>
                        <Search className="w-5 h-5 text-white/60" />
                    </div>

                    <div className="border-2 border-dashed border-white/10 rounded-2xl h-32 flex flex-col items-center justify-center bg-white/5">
                        <UploadCloud className="w-8 h-8 text-primary mb-2 opacity-50" />
                        <p className="text-xs text-zinc-500">Processing...</p>
                        <div className="w-32 h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                            <div className="h-full bg-primary w-2/3 animate-[loading_1s_ease-in-out_infinite]" />
                        </div>
                    </div>

                    <div className="bg-[#151b2b] rounded-2xl border border-white/5 overflow-hidden">
                        <div className="p-3 border-b border-white/5 bg-white/5 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-[#00F5A0]" />
                            <span className="text-xs font-medium text-white">Extraction Complete</span>
                        </div>
                        <div className="p-3 space-y-2">
                            <div className="flex justify-between text-[10px] text-zinc-500">
                                <span>Parameter</span>
                                <span>Value</span>
                            </div>
                            <div className="flex justify-between text-xs text-zinc-300 border-b border-white/5 pb-1">
                                <span>CRAR Limit</span>
                                <span className="text-[#00F5A0]">9.0%</span>
                            </div>
                            <div className="flex justify-between text-xs text-zinc-300 border-b border-white/5 pb-1">
                                <span>Tier 1 Capital</span>
                                <span className="text-[#00F5A0]">7.0%</span>
                            </div>
                            <div className="flex justify-between text-xs text-zinc-300">
                                <span>Condition</span>
                                <span className="text-[#00CFFF]">Met</span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Main Mobile: Chat Interface (Center, Front) */}
            <motion.div
                className="relative w-[300px] h-[600px] bg-[#0B1220] rounded-[3rem] border-4 border-primary/30 shadow-[0_0_50px_rgba(0,245,160,0.15)] overflow-hidden z-20"
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                {/* Notch & Status Bar */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#000] rounded-b-xl z-30" />
                <div className="h-8 w-full bg-[#000]/80 flex justify-between px-6 items-center">
                    <div className="text-[10px] text-white/50">9:41</div>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-full bg-white/20"></div>
                        <div className="w-3 h-3 rounded-full bg-white/20"></div>
                    </div>
                </div>

                {/* Chat UI */}
                <div className="flex flex-col h-full pb-8">
                    {/* Header */}
                    <div className="p-4 border-b border-white/5 bg-[#1A2333]/50 backdrop-blur-md flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <img src="/placeholder.png" className="w-full h-full opacity-0" /> {/* Fallback if no image */}
                            <div className="absolute w-2 h-2 bg-[#00F5A0] rounded-full bottom-0 right-0 border border-[#0B1220]" />
                            <span className="text-xs font-bold text-primary">AI</span>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white font-rajdhani">RBI Assistant</h3>
                            <p className="text-[10px] text-[#00F5A0]">Online • v2.4</p>
                        </div>
                        <MoreVertical className="w-4 h-4 text-white/50 ml-auto" />
                    </div>

                    {/* Messages */}
                    <div className="flex-1 p-4 space-y-4 overflow-hidden relative">
                        {/* Background Grid */}
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none" />

                        {/* User Message */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                            className="flex justify-end"
                        >
                            <div className="bg-primary/20 border border-primary/30 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%] text-xs shadow-lg shadow-primary/5">
                                <p>What is the latest risk weight for consumer credit?</p>
                            </div>
                        </motion.div>

                        {/* AI Response */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1.2 }}
                            className="flex justify-start"
                        >
                            <div className="bg-[#1A2333] border border-white/10 text-zinc-300 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[90%] text-xs shadow-lg">
                                <p className="mb-2">According to the <span className="text-[#00F5A0]">Nov 2023 circular</span>, RBI has increased risk weights:</p>
                                <div className="space-y-1 mb-2">
                                    <div className="flex justify-between bg-black/20 p-2 rounded">
                                        <span>Commercial Banks</span>
                                        <span className="text-white font-bold">125%</span>
                                    </div>
                                    <div className="flex justify-between bg-black/20 p-2 rounded">
                                        <span>NBFCs</span>
                                        <span className="text-white font-bold">125%</span>
                                    </div>
                                </div>
                                <p className="text-[10px] opacity-60">Source: RBI/2023-24/85 DOR.STR.REC.57</p>
                            </div>
                        </motion.div>

                        {/* Typing Indicator */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 2.5 }}
                            className="flex justify-start"
                        >
                            <div className="bg-[#1A2333] px-3 py-2 rounded-2xl rounded-tl-sm flex gap-1">
                                <div className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" />
                                <div className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                                <div className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                        </motion.div>
                    </div>

                    {/* Input Area */}
                    <div className="p-3 border-t border-white/5 bg-[#1A2333]/30 backdrop-blur-md">
                        <div className="flex gap-2">
                            <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-white/50">
                                <UploadCloud className="w-4 h-4" />
                            </div>
                            <div className="flex-1 h-10 bg-black/40 rounded-full border border-white/10 flex items-center px-4 text-xs text-zinc-500">
                                Ask about circulars...
                            </div>
                            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-[#0B1220] shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                                <Send className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

        </div>
    );
}
