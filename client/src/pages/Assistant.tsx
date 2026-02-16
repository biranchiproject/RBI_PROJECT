import { useState, useRef, useEffect } from "react";
import Layout from "@/components/Layout";
import { Send, Bot, User, Mic, Sparkles, RefreshCw, Copy, Check, Paperclip, FileText, X, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, API_BASE_URL } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Types
interface Message {
  type: 'user' | 'ai';
  text: string;
  fileName?: string;
  previewUrl?: string;
}

export default function Assistant() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  // Ref definitions
  const chatRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Scroll Logic State
  // We use a Ref for auto-scroll usage to avoid re-renders impacting the scroll handler
  // Scroll Logic State
  // We use a Ref for auto-scroll usage to avoid re-renders impacting the scroll handler
  const shouldAutoScrollRef = useRef(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // 1️⃣ Handle User Scroll
  // We strictly track if the user has manually moved away from the bottom
  const handleScroll = () => {
    const el = chatRef.current;
    if (!el) return;

    // Check if user is near bottom (within 50px)
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;

    // If user scrolls up, disable auto-scroll. 
    // If they scroll back to bottom, re-enable it.
    shouldAutoScrollRef.current = isAtBottom;

    // Toggle Scroll Button visibility (Show if NOT at bottom)
    setShowScrollButton(!isAtBottom);
  };

  // 2️⃣ Scroll Helpers
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (chatRef.current) {
      chatRef.current.scrollTo({ top: chatRef.current.scrollHeight, behavior });
    }
  };

  // 3️⃣ Effect: Handle NEW messages (User sent or AI started)
  useEffect(() => {
    if (messages.length === 0) return;

    const lastMsg = messages[messages.length - 1];

    if (lastMsg.type === 'user') {
      // User sent a message: ALWAYS force scroll to bottom to see it
      // We also reset auto-scroll to true because the user clearly wants to see the convo
      shouldAutoScrollRef.current = true;
      scrollToBottom("smooth");
    } else {
      // AI started responding: Only scroll if we were already at bottom
      if (shouldAutoScrollRef.current) {
        scrollToBottom("smooth");
      }
    }
  }, [messages.length]);

  // 4️⃣ Effect: Handle STREAMING updates (Text changes)
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];

    // Only relevant for AI streaming
    if (lastMsg.type === 'ai' && shouldAutoScrollRef.current) {
      // For streaming, use "instant" or fast smooth scroll to prevent jitter
      // "smooth" is fine if updates aren't too fast, otherwise use "auto"
      chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages[messages.length - 1]?.text]);

  // File Handling
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Voice Input Logic
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // alert or toast
      console.warn("Voice input not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results as any[])
        .map((result: any) => result[0].transcript)
        .join("");
      setInput(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognition.start();
    setIsListening(true);
    recognitionRef.current = recognition;
  };

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // 2️⃣ Streaming Fetch Implementation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedFile) || isLoading) return;

    const userQuery = input;
    const currentFile = selectedFile;

    // Reset UI state
    setInput("");
    setSelectedFile(null);
    setIsLoading(true);

    // Optimistic Update
    let previewUrl: string | undefined;
    if (currentFile && currentFile.type.startsWith("image/")) {
      previewUrl = URL.createObjectURL(currentFile);
    }

    setMessages(prev => [
      ...prev,
      { type: 'user', text: userQuery, fileName: currentFile?.name, previewUrl },
      { type: 'ai', text: "" } // Placeholder
    ]);

    try {
      let response;

      // Check if file is selected (Multimedia/RAG specific logic not yet fully migrated to /api/ask)
      if (currentFile) {
        // For now, keep using /api/chat or mock for files as /api/ask only takes 'question' string
        // The user only requested fixing /api/ask response display.
        // We'll fallback to the old endpoint for files or alert.
        // But to be safe lets use /api/chat which returns the mock for now to avoid breaking file upload.
        const formData = new FormData();
        formData.append("query", userQuery);
        formData.append("file", currentFile);

        response = await fetch(`${API_BASE_URL}/api/chat`, {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        setMessages(prev => {
          const newMsg = [...prev];
          newMsg[newMsg.length - 1].text = data.reply || "File analysis not yet implemented.";
          return newMsg;
        });

      } else {
        // Step 2 Compliance: Use /api/ask for questions
        response = await fetch(`${API_BASE_URL}/api/ask`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: userQuery }) // Changed key to 'question'
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || "Server error");
        }

        const data = await response.json();

        // Update UI with the reply
        setMessages(prev => {
          const newMsg = [...prev];
          newMsg[newMsg.length - 1].text = data.reply;
          return newMsg;
        });
      }


    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => {
        const newMsg = [...prev];
        newMsg[newMsg.length - 1].text = "**Error:** Something went wrong. Please check your connection or try again.";
        return newMsg;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-65px)] md:h-screen w-full bg-[#09090b]">
        {/* Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-white/10 bg-[#09090b]/95 backdrop-blur z-10 sticky top-0">
          <div className="flex items-center gap-3">
            <Bot className="w-6 h-6 text-green-500" />
            <span className="text-white font-bold text-lg tracking-tight">Financial Assistant</span>
            <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-[10px] text-green-500 font-medium border border-green-500/20">
              Pro
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setMessages([])} className="text-zinc-400 hover:text-white hover:bg-white/5">
            <RefreshCw className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative scroll-smooth" ref={chatRef} onScroll={handleScroll}>
          <div className="max-w-3xl mx-auto flex flex-col pt-10 pb-40 px-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center mt-20 opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500/20 to-blue-500/20 flex items-center justify-center mb-8 border border-white/5 shadow-2xl shadow-green-900/20">
                  <Sparkles className="w-10 h-10 text-green-400" />
                </div>
                <h3 className="text-3xl font-bold mb-4 text-white tracking-tight">How can I help you today?</h3>
                <p className="text-zinc-400 max-w-md text-lg leading-relaxed">
                  I can analyze RBI circulars, explain compliance rules, or summarize financial documents for you.
                </p>
              </div>
            ) : (
              <div className="space-y-12">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "w-full flex gap-6 fade-in",
                      msg.type === 'user' ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    {/* Avatar */}
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg mt-1",
                      msg.type === 'user'
                        ? "bg-zinc-800 border border-white/10"
                        : "bg-green-600 border border-green-500/30"
                    )}>
                      {msg.type === 'user' ? <User className="w-5 h-5 text-zinc-300" /> : <Bot className="w-6 h-6 text-white" />}
                    </div>

                    {/* Content */}
                    <div className={cn("flex-1 overflow-hidden", msg.type === 'user' ? "text-right" : "text-left")}>
                      {/* Name Label */}
                      <div className={cn("text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wider", msg.type === 'user' ? "pr-1" : "pl-1")}>
                        {msg.type === 'user' ? "You" : "Assistant"}
                      </div>

                      {msg.type === 'user' ? (
                        <div className="inline-block text-left">
                          {msg.previewUrl && (
                            <div className="mb-2 rounded-lg overflow-hidden border border-white/10 shadow-lg">
                              <img src={msg.previewUrl} alt="Upload preview" className="max-w-xs max-h-60 object-cover" />
                            </div>
                          )}
                          {msg.fileName && !msg.previewUrl && (
                            <div className="mb-2 flex items-center gap-2 bg-zinc-800/80 rounded-md px-3 py-2 text-xs text-zinc-300 border border-white/5 w-fit ml-auto">
                              <FileText className="w-3.5 h-3.5 text-blue-400" />
                              {msg.fileName}
                            </div>
                          )}
                          {msg.text && (
                            <div className="bg-zinc-800 text-zinc-100 px-6 py-3.5 rounded-2xl rounded-tr-sm text-[16px] leading-7 border border-white/5 shadow-sm inline-block max-w-[90%]">
                              {msg.text}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="relative group max-w-none w-full">
                          {/* 3️⃣ ReactMarkdown with specific Prose fixes */}
                          <div className="prose prose-invert prose-lg max-w-none 
                            prose-p:leading-8 prose-p:text-zinc-300 prose-p:mb-4 
                            prose-headings:text-zinc-100 prose-headings:font-semibold prose-headings:mb-4 prose-headings:mt-6
                            prose-ul:my-4 prose-li:text-zinc-300 prose-li:my-1.5
                            prose-strong:text-green-400 prose-strong:font-bold
                            prose-code:text-orange-300 prose-code:bg-orange-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none
                            prose-pre:bg-[#1a1a1a] prose-pre:border prose-pre:border-white/10 prose-pre:rounded-lg prose-pre:p-4
                          ">
                            {!msg.text ? (
                              <div className="flex items-center gap-1.5 h-8">
                                <div className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <div className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <div className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" />
                              </div>
                            ) : (
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  code({ node, className, children, ...props }) {
                                    const match = /language-(\w+)/.exec(className || '')
                                    // @ts-ignore
                                    const codeId = String(children).slice(0, 10);
                                    return match ? (
                                      <div className="relative group/code my-6 rounded-lg overflow-hidden border border-white/10 bg-[#121212]">
                                        <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                                          <span className="text-xs text-zinc-500 font-mono">{match[1]}</span>
                                          <button
                                            onClick={() => copyToClipboard(String(children), `code-${codeId}`)}
                                            className="text-xs flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors"
                                          >
                                            {copiedId === `code-${codeId}` ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                            {copiedId === `code-${codeId}` ? "Copied" : "Copy"}
                                          </button>
                                        </div>
                                        <div className="custom-scrollbar overflow-x-auto p-4">
                                          <code className={className} {...props}>
                                            {children}
                                          </code>
                                        </div>
                                      </div>
                                    ) : (
                                      <code className={className} {...props}>{children}</code>
                                    )
                                  }
                                }}
                              >
                                {msg.text}
                              </ReactMarkdown>
                            )}
                          </div>

                          {/* Action Buttons */}
                          {msg.text && (
                            <div className="mt-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(msg.text, `msg-${idx}`)} className="h-8 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-white/5">
                                {copiedId === `msg-${idx}` ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                                Copy
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div ref={chatRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-6 bg-[#09090b] z-20 sticky bottom-0 border-t border-white/5">
          <div className="max-w-3xl mx-auto relative">
            {/* File Preview */}
            {selectedFile && (
              <div className="absolute -top-12 left-0 flex items-center gap-2 bg-zinc-800 px-3 py-1.5 rounded-full border border-white/10 shadow-lg animate-in fade-in slide-in-from-bottom-2">
                <div className="p-1 rounded-full bg-blue-500/20">
                  <FileText className="w-3 h-3 text-blue-400" />
                </div>
                <span className="text-xs text-zinc-200 max-w-[150px] truncate">{selectedFile.name}</span>
                <button onClick={() => setSelectedFile(null)} className="ml-1 p-0.5 hover:bg-white/10 rounded-full text-zinc-500 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Scroll to Bottom Button */}
            {showScrollButton && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollToBottom("smooth")}
                className="absolute -top-16 left-1/2 -translate-x-1/2 rounded-full w-8 h-8 bg-zinc-800 border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-700 shadow-lg animate-in fade-in slide-in-from-bottom-2 z-30"
              >
                <ArrowDown className="w-4 h-4" />
              </Button>
            )}

            <form onSubmit={handleSubmit} className="relative flex gap-3 items-end bg-zinc-900/50 rounded-2xl p-2 border border-white/10 focus-within:border-green-500/50 focus-within:ring-1 focus-within:ring-green-500/20 transition-all shadow-xl">
              <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,application/pdf"
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl h-10 w-10 shrink-0 text-zinc-400 hover:text-white hover:bg-white/5"
              >
                <Paperclip className="w-5 h-5" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={toggleListening}
                className={cn(
                  "rounded-xl h-10 w-10 shrink-0",
                  isListening ? "text-red-500 animate-pulse bg-red-500/10" : "text-zinc-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Mic className="w-5 h-5" />
              </Button>

              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message Financial Assistant..."
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent py-3 text-lg placeholder:text-zinc-600 text-zinc-100 h-auto max-h-32 min-h-[44px]"
              />

              <Button
                type="submit"
                disabled={(!input.trim() && !selectedFile) || isLoading}
                className={cn(
                  "rounded-xl h-10 w-10 p-0 shrink-0 transition-all duration-200",
                  (!input.trim() && !selectedFile) ? "bg-zinc-800 text-zinc-600" : "bg-green-600 text-white hover:bg-green-500 shadow-lg shadow-green-900/20"
                )}
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
            <p className="text-center text-[11px] text-zinc-600 mt-3 font-medium">
              AI can make mistakes. Please verify important information.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
