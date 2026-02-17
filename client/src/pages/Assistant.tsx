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
// State Types
interface Message {
  type: 'user' | 'ai';
  text: string;
  fileName?: string;
  previewUrl?: string;
  citations?: any[];
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

import { Trash2, Plus, PanelLeftClose, PanelLeftOpen, Search } from "lucide-react"; // Updated imports

export default function Assistant() {
  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Chat Data State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // Search State

  // Active Conversation Messages (derived or state synced)
  // We'll keep messages in state for immediate UI feedback, but sync to conversations array
  const [messages, setMessages] = useState<Message[]>([]);

  // Attachments & Tools
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  // Refs
  const chatRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const shouldAutoScrollRef = useRef(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Filtered Conversations
  const filteredConversations = conversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 1️⃣ Initialize / Load from LocalStorage
  useEffect(() => {
    const stored = localStorage.getItem("fintech_conversations");
    const storedActiveId = localStorage.getItem("fintech_active_id");

    if (stored) {
      const parsed: Conversation[] = JSON.parse(stored);
      setConversations(parsed);

      if (parsed.length > 0) {
        // If we have an active ID saved and it exists, use it.
        // Otherwise default to the first one.
        const validId = parsed.find(c => c.id === storedActiveId)?.id || parsed[0].id;
        setActiveId(validId);
        setMessages(parsed.find(c => c.id === validId)?.messages || []);
      } else {
        createNewChat(false); // Create empty if list is empty but valid array
      }
    } else {
      createNewChat(false); // New user
    }
  }, []);

  // 2️⃣ Sync Active Messages to Conversation List
  useEffect(() => {
    if (!activeId) return;

    setConversations(prev => {
      const updated = prev.map(c =>
        c.id === activeId ? { ...c, messages: messages, updatedAt: Date.now() } : c
      );
      // Save to LS
      localStorage.setItem("fintech_conversations", JSON.stringify(updated));
      return updated;
    });
  }, [messages, activeId]);

  // 3️⃣ Helpers
  const createNewChat = (shouldSetActive = true) => {
    const newId = crypto.randomUUID();
    const newConvo: Conversation = {
      id: newId,
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    setConversations(prev => {
      const updated = [newConvo, ...prev];
      localStorage.setItem("fintech_conversations", JSON.stringify(updated));
      return updated;
    });

    if (shouldSetActive) {
      setActiveId(newId);
      setMessages([]);
      localStorage.setItem("fintech_active_id", newId);
      setSearchQuery(""); // Clear search on new chat
    }
  };

  const switchChat = (id: string) => {
    const target = conversations.find(c => c.id === id);
    if (target) {
      setActiveId(id);
      setMessages(target.messages);
      localStorage.setItem("fintech_active_id", id);
      // Reset scroll on switch
      shouldAutoScrollRef.current = true;
      if (window.innerWidth < 768) setIsSidebarOpen(false); // Close mobile sidebar
    }
  };

  const deleteChat = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent accidentally switching chat when deleting

    const updated = conversations.filter(c => c.id !== id);
    setConversations(updated);
    localStorage.setItem("fintech_conversations", JSON.stringify(updated));

    // If we deleted the active chat, switch to another one or create new
    if (id === activeId) {
      if (updated.length > 0) {
        switchChat(updated[0].id);
      } else {
        createNewChat(true);
      }
    }
  };

  // 4️⃣ Auto-Title Logic
  const generateTitle = (text: string) => {
    // Simple heuristic: Take first 5-6 words
    const words = text.split(" ").slice(0, 5).join(" ");
    return words.length > 30 ? words.slice(0, 30) + "..." : words;
  };

  // Handle Scroll
  const handleScroll = () => {
    const el = chatRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    shouldAutoScrollRef.current = isAtBottom;
    setShowScrollButton(!isAtBottom);
  };

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (chatRef.current) {
      chatRef.current.scrollTo({ top: chatRef.current.scrollHeight, behavior });
    }
  };

  // Scroll effects
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];

    if (lastMsg.type === 'user') {
      shouldAutoScrollRef.current = true;
      scrollToBottom("smooth");
    } else if (shouldAutoScrollRef.current) {
      scrollToBottom("smooth");
    }
  }, [messages.length]);

  // Update title on first user message
  useEffect(() => {
    if (!activeId || messages.length === 0) return;

    const currentConvo = conversations.find(c => c.id === activeId);
    // Only if currently titled "New Chat" and user sends first message
    if (currentConvo && currentConvo.title === "New Chat" && messages[0].type === 'user') {
      const newTitle = generateTitle(messages[0].text);
      setConversations(prev => {
        const updated = prev.map(c =>
          c.id === activeId ? { ...c, title: newTitle } : c
        );
        localStorage.setItem("fintech_conversations", JSON.stringify(updated));
        return updated;
      });
    }
  }, [messages, activeId]); // Dependent on messages update

  // File Handling
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]);
  };

  // Voice
  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Voice input not supported");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results as any[])
        .map((result: any) => result[0].transcript).join("");
      setInput(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
    setIsListening(true);
    recognitionRef.current = recognition;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedFile) || isLoading) return;

    const userQuery = input;
    const currentFile = selectedFile;

    setInput("");
    setSelectedFile(null);
    setIsLoading(true);

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
      if (currentFile) {
        const formData = new FormData();
        formData.append("query", userQuery);
        formData.append("file", currentFile);
        response = await fetch(`${API_BASE_URL}/api/chat`, { method: "POST", body: formData });
        const data = await response.json();
        setMessages(prev => {
          const newMsg = [...prev];
          const lastIndex = newMsg.length - 1;
          newMsg[lastIndex].text = data.answer || data.reply || "File analysis not yet implemented.";
          newMsg[lastIndex].citations = data.citations || [];
          return newMsg;
        });
      } else {
        response = await fetch(`${API_BASE_URL}/api/ask`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: userQuery })
        });
        if (!response.ok) throw new Error("Server error");
        const data = await response.json();
        setMessages(prev => {
          const newMsg = [...prev];
          const lastIndex = newMsg.length - 1;
          newMsg[lastIndex].text = data.answer || data.reply || "No response received.";
          newMsg[lastIndex].citations = data.citations || [];
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
      {/* Main Container - Full Height, Hidden Overflow to manage scrolls internally */}
      <div className="flex h-[calc(100vh-65px)] md:h-screen w-full bg-[#09090b] overflow-hidden">

        {/* LEFT SIDEBAR - INTERNAL */}
        <div className={cn(
          "flex-shrink-0 bg-[#0c0c0e] border-r border-white/5 transition-all duration-300 ease-in-out flex flex-col",
          isSidebarOpen ? "w-64" : "w-[72px]"
        )}>

          {/* Logo Section */}
          <div className={cn("flex items-center gap-3 transition-all duration-300", isSidebarOpen ? "p-4 pl-5 pt-6 mb-2" : "p-0 pt-6 justify-center mb-4")}>
            <div className="w-8 h-8 rounded bg-primary/20 border border-primary flex items-center justify-center flex-shrink-0">
              <div className="w-4 h-4 bg-primary rotate-45" />
            </div>
            {isSidebarOpen && (
              <h1 className="text-lg font-bold font-rajdhani tracking-wider text-white whitespace-nowrap animate-in fade-in zoom-in duration-300">
                FIN<span className="text-primary">TECH</span>.AI
              </h1>
            )}
          </div>

          {/* Search Chat Area */}
          <div className={cn("px-4 pb-2", !isSidebarOpen && "px-3")}>
            {isSidebarOpen ? (
              <div className="relative group mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Chat..."
                  className="w-full bg-transparent hover:bg-white/5 border-none rounded-lg py-2 pl-9 pr-2 text-sm text-white focus:bg-white/5 focus:ring-0 placeholder:text-zinc-500 transition-colors h-10"
                />
              </div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(true)}
                className="w-10 h-10 p-0 justify-center rounded-lg mb-2 text-green-500 hover:bg-white/5 hover:text-green-400"
                title="Search Chat"
              >
                <Search className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* New Chat Button Area */}
          <div className={cn("px-4 pb-2", !isSidebarOpen && "px-3")}>
            <Button
              onClick={() => createNewChat(true)}
              className={cn(
                "transition-all shadow-none hover:bg-white/5 group border-0 h-10 px-3 rounded-lg justify-start", // Removed border and bg, added hover
                isSidebarOpen ? "w-full gap-3" : "w-10 p-0 justify-center"
              )}
              title="New Chat"
              variant="ghost" // Use ghost variant to remove default button styles if any default bg exists
            >
              <div className={cn("transition-colors text-green-500", isSidebarOpen && "p-0.5")}>
                <Plus className="w-5 h-5" />
              </div>
              {isSidebarOpen && (
                <span className="text-sm font-bold animate-in fade-in zoom-in">
                  <span className="text-white">New</span> <span className="text-green-500">Chat</span>
                </span>
              )}
            </Button>
          </div>

          {/* History List */}
          <div className="flex-1 overflow-y-auto px-2 custom-scrollbar mt-2">
            {isSidebarOpen && (
              <>
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-3 mb-2 mt-2 animate-in fade-in">History</div>
                <div className="space-y-1">
                  {filteredConversations.map(chat => (
                    <div
                      key={chat.id}
                      onClick={() => switchChat(chat.id)}
                      className={cn(
                        "group relative flex items-center w-full px-3 py-2.5 rounded-lg text-sm transition-all cursor-pointer",
                        activeId === chat.id
                          ? "bg-white/10 text-white"
                          : "text-zinc-400 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <span className="truncate flex-1 pr-6">{chat.title}</span>

                      {/* Delete Button - Visible on Hover (or if active?) */}
                      <button
                        onClick={(e) => deleteChat(e, chat.id)}
                        className={cn(
                          "absolute right-2 p-1.5 rounded-md text-zinc-500 hover:text-red-400 hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100",
                          activeId === chat.id && "text-zinc-400"
                        )}
                        title="Delete Chat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {filteredConversations.length === 0 && conversations.length > 0 && (
                    <div className="px-3 text-xs text-zinc-500 mt-4 text-center">No chats found</div>
                  )}
                </div>
              </>
            )}
            {!isSidebarOpen && (
              <div className="flex flex-col items-center gap-2 mt-2">
                {/* Optionally show recent chats as tooltips or dots later */}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT CHAT AREA */}
        <div className="flex-1 flex flex-col relative min-w-0">

          {/* Header / Top Bar */}
          <div className="h-14 px-4 flex items-center justify-between border-b border-white/5 bg-[#09090b]/95 backdrop-blur z-10">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-zinc-400 hover:text-white -ml-2">
                {/* Toggle Icon Changes based on state */}
                {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
              </Button>
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-green-500" />
                <span className="text-white font-bold tracking-tight">Financial Assistant</span>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setMessages([])} className="text-zinc-400 hover:text-white hover:bg-white/5 text-xs h-8">
              <RefreshCw className="w-3.5 h-3.5 mr-2" />
              Clear
            </Button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar relative scroll-smooth p-4" ref={chatRef} onScroll={handleScroll}>
            <div className="max-w-3xl mx-auto flex flex-col min-h-full pb-20">
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-blue-500/20 flex items-center justify-center mb-6 border border-white/5 shadow-2xl shadow-green-900/20">
                    <Sparkles className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-white tracking-tight">How can I help you today?</h3>
                  <p className="text-zinc-500 max-w-sm text-sm leading-relaxed">
                    Analyze RBI circulars, explain compliance rules, or summarize documents.
                  </p>
                </div>
              ) : (
                <div className="space-y-8 py-6">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={cn("w-full flex gap-4 fade-in", msg.type === 'user' ? "flex-row-reverse" : "flex-row")}>
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg mt-1",
                        msg.type === 'user' ? "bg-zinc-800 border border-white/10" : "bg-green-600 border border-green-500/30"
                      )}>
                        {msg.type === 'user' ? <User className="w-4 h-4 text-zinc-300" /> : <Bot className="w-5 h-5 text-white" />}
                      </div>
                      <div className={cn("flex-1 overflow-hidden min-w-0", msg.type === 'user' ? "text-right" : "text-left")}>
                        <div className={cn("text-xs font-medium text-zinc-500 mb-1 uppercase tracking-wider", msg.type === 'user' ? "pr-1" : "pl-1")}>
                          {msg.type === 'user' ? "You" : "Assistant"}
                        </div>
                        {msg.type === 'user' ? (
                          <div className="inline-block text-left max-w-full">
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
                              <div className="bg-zinc-800 text-zinc-100 px-5 py-3 rounded-2xl rounded-tr-sm text-[15px] leading-7 border border-white/5 shadow-sm inline-block max-w-full break-words">
                                {msg.text}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="prose prose-invert prose-sm max-w-none
                                prose-p:leading-7 prose-p:text-zinc-300 prose-p:mb-3
                                prose-headings:text-zinc-100 prose-headings:font-semibold prose-headings:mb-3 prose-headings:mt-4
                                prose-ul:my-3 prose-li:text-zinc-300 prose-li:my-1
                                prose-strong:text-green-400 prose-strong:font-bold
                                prose-code:text-orange-300 prose-code:bg-orange-500/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none
                                prose-pre:bg-[#1a1a1a] prose-pre:border prose-pre:border-white/10 prose-pre:rounded-lg prose-pre:p-3
                              ">
                            <div className="flex flex-col gap-6">
                              {!msg.text ? (
                                <div className="flex items-center gap-1.5 h-6">
                                  <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                  <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                  <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce" />
                                </div>
                              ) : (
                                <>
                                  {/* 1️⃣ & 2️⃣ Answer Section */}
                                  <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 shadow-sm">
                                    <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-3">
                                      <span className="text-lg">📘</span>
                                      <h4 className="text-[15px] font-bold text-zinc-100 mt-0 mb-0 uppercase tracking-wider">Answer</h4>
                                    </div>
                                    <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-p:text-zinc-300">
                                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {msg.text.split(/⚖️ Legal Context|Legal Context:/)[0].trim()}
                                      </ReactMarkdown>
                                    </div>
                                  </div>

                                  {/* 4️⃣ Legal Context Section (if present) */}
                                  {(msg.text.includes("⚖️ Legal Context") || msg.text.includes("Legal Context:")) && (
                                    <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 shadow-sm mb-4">
                                      <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-3">
                                        <span className="text-lg">⚖️</span>
                                        <h4 className="text-[15px] font-bold text-zinc-100 mt-0 mb-0 uppercase tracking-wider">Legal Context</h4>
                                      </div>
                                      <div className="text-zinc-300 text-[14px] leading-relaxed italic">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                          {msg.text.split(/⚖️ Legal Context|Legal Context:/)[1]?.split("Source:")[0]?.trim() || ""}
                                        </ReactMarkdown>
                                      </div>
                                    </div>
                                  )}

                                  {/* 5️⃣ Source Metadata Card */}
                                  {msg.citations && msg.citations.length > 0 && (
                                    <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 shadow-sm">
                                      <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-3">
                                        <span className="text-lg">📎</span>
                                        <h4 className="text-[15px] font-bold text-zinc-100 mt-0 mb-0 uppercase tracking-wider">Source Details</h4>
                                      </div>
                                      <div className="flex flex-col gap-4">
                                        {msg.citations.slice(0, 1).map((cite, cidx) => (
                                          <div key={cidx} className="flex flex-col gap-4">
                                            {/* Relevant Extract Section */}
                                            {cite.extract && (
                                              <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-zinc-100 font-bold text-[14px]">
                                                  <span>📌</span>
                                                  <span>Relevant Extract:</span>
                                                </div>
                                                <div className="text-zinc-400 text-[13px] leading-relaxed italic bg-black/20 p-3 rounded-lg border-l-2 border-green-500/50">
                                                  "{cite.extract}"
                                                </div>
                                              </div>
                                            )}

                                            {/* Metadata Grid */}
                                            <div className="grid grid-cols-1 gap-2 text-[13px]">
                                              <div className="flex items-start gap-2">
                                                <span className="text-zinc-500 shrink-0 font-medium">📄 Document Title:</span>
                                                <span className="text-zinc-100 font-bold">{cite.title}</span>
                                              </div>
                                              <div className="flex items-start gap-2">
                                                <span className="text-zinc-500 shrink-0 font-medium">📁 Filename:</span>
                                                <span className="text-zinc-300 whitespace-pre-wrap break-all">{cite.filename}</span>
                                              </div>
                                              <div className="flex items-start gap-2">
                                                <span className="text-zinc-500 shrink-0 font-medium">🏷 Category:</span>
                                                <span className="text-zinc-300">{cite.category}</span>
                                              </div>
                                              <div className="flex items-start gap-2">
                                                <span className="text-zinc-500 shrink-0 font-medium">📅 Uploaded:</span>
                                                <span className="text-zinc-300">{cite.upload_date}</span>
                                              </div>
                                              <div className="flex items-start gap-2">
                                                <span className="text-zinc-500 shrink-0 font-medium">📑 Page Number:</span>
                                                <span className="text-zinc-300">{cite.page_number}</span>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
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
          <div className="p-4 bg-[#09090b] z-20 sticky bottom-0 border-t border-white/5">
            <div className="max-w-3xl mx-auto relative">
              {selectedFile && (
                <div className="absolute -top-10 left-0 flex items-center gap-2 bg-zinc-800 px-3 py-1.5 rounded-full border border-white/10 shadow-lg animate-in fade-in slide-in-from-bottom-2">
                  <div className="p-1 rounded-full bg-blue-500/20">
                    <FileText className="w-3 h-3 text-blue-400" />
                  </div>
                  <span className="text-xs text-zinc-200 max-w-[150px] truncate">{selectedFile.name}</span>
                  <button onClick={() => setSelectedFile(null)} className="ml-1 p-0.5 hover:bg-white/10 rounded-full text-zinc-500 hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              {showScrollButton && (
                <Button variant="outline" size="icon" onClick={() => scrollToBottom("smooth")} className="absolute -top-14 left-1/2 -translate-x-1/2 rounded-full w-8 h-8 bg-zinc-800 border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-700 shadow-lg animate-in fade-in slide-in-from-bottom-2 z-30">
                  <ArrowDown className="w-4 h-4" />
                </Button>
              )}
              <form onSubmit={handleSubmit} className="relative flex gap-2 items-end bg-zinc-900/50 rounded-xl p-2 border border-white/10 focus-within:border-green-500/50 focus-within:ring-1 focus-within:ring-green-500/20 transition-all shadow-xl">
                <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileSelect} accept="image/*,application/pdf" />
                <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="rounded-lg h-9 w-9 shrink-0 text-zinc-400 hover:text-white hover:bg-white/5">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" onClick={toggleListening} className={cn("rounded-lg h-9 w-9 shrink-0", isListening ? "text-red-500 animate-pulse bg-red-500/10" : "text-zinc-400 hover:text-white hover:bg-white/5")}>
                  <Mic className="w-4 h-4" />
                </Button>
                <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Message Financial Assistant..." className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent py-2.5 text-base placeholder:text-zinc-600 text-zinc-100 h-auto max-h-32 min-h-[40px]" />
                <Button type="submit" disabled={(!input.trim() && !selectedFile) || isLoading} className={cn("rounded-lg h-9 w-9 p-0 shrink-0 transition-all duration-200", (!input.trim() && !selectedFile) ? "bg-zinc-800 text-zinc-600" : "bg-green-600 text-white hover:bg-green-500 shadow-lg shadow-green-900/20")}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
              <p className="text-center text-[10px] text-zinc-600 mt-2 font-medium">AI can make mistakes. Please verify important information.</p>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}

