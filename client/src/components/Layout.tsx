import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Menu, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export default function Layout({ children }: { children: ReactNode }) {
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <TooltipProvider>
            <div className="min-h-screen bg-background relative flex flex-col md:flex-row overflow-x-hidden">
                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between p-4 border-b border-white/10 bg-background/80 backdrop-blur sticky top-0 z-40 w-full">
                    <div className="flex items-center gap-3">
                        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                                    <Menu className="w-6 h-6" />
                                    <span className="sr-only">Toggle menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="p-0 w-64 border-r border-white/10 bg-background border-none">
                                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                                <SheetDescription className="sr-only">Main navigation sidebar</SheetDescription>
                                <Sidebar className="h-full w-full border-none" onClose={() => setIsMobileOpen(false)} />
                            </SheetContent>
                        </Sheet>
                        <h1 className="text-lg font-bold font-rajdhani text-white">
                            FIN<span className="text-primary">TECH</span>.AI
                        </h1>
                    </div>
                </div>

                {/* Desktop Sidebar */}
                <div
                    className={cn(
                        "hidden md:flex fixed inset-y-0 left-0 z-50 h-screen transition-all duration-300 ease-in-out bg-background/60 backdrop-blur-xl border-r border-white/10",
                        isSidebarOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full"
                    )}
                >
                    <Sidebar className="h-full w-full border-none" onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
                </div>

                {/* Main Content */}
                <main
                    className={cn(
                        "flex-1 min-h-[calc(100vh-65px)] md:min-h-screen flex flex-col transition-all duration-300 ease-in-out relative",
                        isSidebarOpen ? "md:ml-64" : "md:ml-0"
                    )}
                >
                    {/* Sidebar Toggle Button (Desktop) - Only show when closed */}
                    {!isSidebarOpen && (
                        <div className="hidden md:block absolute top-4 left-4 z-50">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setIsSidebarOpen(true)}
                                        className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(34,197,94,0.6)] border border-primary/50 h-9 w-9 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(34,197,94,0.8)]"
                                    >
                                        <PanelLeft className="w-5 h-5" />
                                        <span className="sr-only">Open Sidebar</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="bg-zinc-900 border-white/10 text-white">
                                    <p>Open Sidebar</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        <motion.div
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="flex-1 h-full w-full"
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </TooltipProvider>
    );
}
