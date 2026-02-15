import { useState, useRef, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useQueries, useCreateQuery } from "@/hooks/use-queries";
import { Send, Bot, User, Mic, Sparkles, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function Assistant() {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: history } = useQueries();
  const createQuery = useCreateQuery();
  
  // Local state for immediate UI feedback before refetch
  const [optimisticMessages, setOptimisticMessages] = useState<Array<{type: 'user' | 'ai', text: string}>>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [optimisticMessages, history]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || createQuery.isPending) return;

    const queryText = input;
    setInput("");
    setOptimisticMessages(prev => [...prev, { type: 'user', text: queryText }]);

    createQuery.mutate(queryText, {
      onSuccess: (data) => {
        setOptimisticMessages(prev => [...prev, { type: 'ai', text: data.responseText }]);
      }
    });
  };

  // Combine history and optimistic for display logic (simplified here to just show optimistic session or history)
  // In a real app, we'd sync these better. For now, let's just use a combined list.
  const displayMessages = history ? 
    history.flatMap(h => [
      { type: 'user' as const, text: h.queryText },
      { type: 'ai' as const, text: h.responseText }
    ]) : [];

  const activeMessages = displayMessages.length > 0 ? displayMessages : optimisticMessages;

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 ml-64 flex flex-col h-screen">
        {/* Header */}
        <div className="h-20 px-8 flex items-center justify-between border-b border-white/5 bg-background/80 backdrop-blur z-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center neon-border">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-rajdhani text-white">RBI AI Assistant</h2>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <p className="text-xs text-muted-foreground">Online & Ready</p>
              </div>
            </div>
          </div>
          <Button variant="outline" className="border-white/10 hover:bg-white/5" onClick={() => setOptimisticMessages([])}>
            <RefreshCw className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {activeMessages.length === 0 && optimisticMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
              <Sparkles className="w-16 h-16 text-primary mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2 font-rajdhani">How can I help you today?</h3>
              <p className="text-muted-foreground max-w-md">
                I can analyze circulars, answer compliance questions, and summarize regulations.
              </p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {(activeMessages.length > 0 ? activeMessages : optimisticMessages).map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex gap-4 max-w-3xl",
                    msg.type === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                    msg.type === 'user' ? "bg-secondary/20" : "bg-primary/20"
                  )}>
                    {msg.type === 'user' ? <User className="w-5 h-5 text-secondary" /> : <Bot className="w-5 h-5 text-primary" />}
                  </div>
                  
                  <div className={cn(
                    "p-4 rounded-2xl text-sm leading-relaxed shadow-lg",
                    msg.type === 'user' 
                      ? "bg-secondary/10 border border-secondary/30 text-white rounded-tr-none" 
                      : "bg-card border border-white/10 text-white/90 rounded-tl-none"
                  )}>
                    {msg.text}
                    
                    {msg.type === 'ai' && (
                      <div className="mt-4 pt-4 border-t border-white/5 text-xs text-muted-foreground">
                        <p className="font-semibold mb-1 text-primary">Sources:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Master Direction - KYC (2024 Update)</li>
                          <li>RBI Circular 2023-24/108</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {createQuery.isPending && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  className="flex gap-4 max-w-3xl mr-auto"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                  <div className="bg-card border border-white/10 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-white/5 bg-background/80 backdrop-blur">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative flex gap-3">
            <Button 
              type="button" 
              variant="ghost" 
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary hover:bg-transparent"
            >
              <Mic className="w-5 h-5" />
            </Button>
            
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about RBI regulations..." 
              className="pl-12 pr-12 py-6 bg-white/5 border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 rounded-full text-lg"
            />
            
            <Button 
              type="submit" 
              disabled={!input.trim() || createQuery.isPending}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full w-10 h-10 p-0 bg-primary hover:bg-primary/80 text-black"
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
          <p className="text-center text-xs text-muted-foreground mt-3">
            AI can make mistakes. Verify important information with official circulars.
          </p>
        </div>
      </main>
    </div>
  );
}
