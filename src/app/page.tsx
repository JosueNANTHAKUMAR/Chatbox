'use client';

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { Send, Paperclip, Bot, User, Plus, MessageSquare, Menu, X, Sparkles, ChevronRight, StopCircle, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatHistoryItem {
  id: string;
  title: string;
  date: string;
  messages: any[];
}

export default function Chat() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, stop, setInput, append } = useChat({
    api: '/api/chat',
    onError: (error: any) => {
      console.error("Chat error:", error);
    },
    onFinish: (message: any) => {
      saveChatToHistory();
    }
  } as any) as any;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('chat_history');
    if (savedHistory) {
      setChatHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save history whenever it changes
  useEffect(() => {
    if (chatHistory.length > 0) {
      localStorage.setItem('chat_history', JSON.stringify(chatHistory));
    }
  }, [chatHistory]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const saveChatToHistory = () => {
    if (messages.length === 0) return;

    const title = messages[0].content.slice(0, 30) + (messages[0].content.length > 30 ? "..." : "");
    const newHistoryItem: ChatHistoryItem = {
      id: currentChatId || crypto.randomUUID(),
      title,
      date: new Date().toISOString(),
      messages: messages
    };

    setChatHistory(prev => {
      const existingIndex = prev.findIndex(item => item.id === newHistoryItem.id);
      if (existingIndex >= 0) {
        const newHistory = [...prev];
        newHistory[existingIndex] = { ...newHistory[existingIndex], messages: messages };
        return newHistory;
      } else {
        return [newHistoryItem, ...prev];
      }
    });

    if (!currentChatId) {
      setCurrentChatId(newHistoryItem.id);
    }
  };

  const handleNewChat = () => {
    saveChatToHistory();
    setMessages([]);
    setCurrentChatId(null);
    setIsSidebarOpen(false);
    inputRef.current?.focus();
  };

  const loadChat = (chat: ChatHistoryItem) => {
    saveChatToHistory(); // Save current before switching
    setMessages(chat.messages);
    setCurrentChatId(chat.id);
    setIsSidebarOpen(false);
  };

  const handleSuggestionClick = async (suggestion: string) => {
    setInput(suggestion);
    // Trigger submit after state update
    setTimeout(() => {
      const formEvent = { preventDefault: () => { } } as React.FormEvent;
      handleSubmit(formEvent);
    }, 0);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-gray-100 font-sans antialiased overflow-hidden selection:bg-emerald-500/30">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed md:relative z-50 w-72 h-full bg-[#0f0f0f]/90 backdrop-blur-xl border-r border-white/5 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-4 border-b border-white/5">
          <button
            onClick={handleNewChat}
            className="group flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl w-full transition-all duration-200 border border-white/5 hover:border-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.1)]"
          >
            <div className="p-1.5 bg-emerald-500/20 rounded-lg text-emerald-400 group-hover:scale-110 transition-transform">
              <Plus className="w-4 h-4" />
            </div>
            <span className="font-medium text-sm">Nouvelle discussion</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="w-3 h-3" />
            Historique
          </div>
          {chatHistory.length === 0 && (
            <div className="px-3 py-4 text-sm text-gray-600 text-center italic">
              Aucune conversation récente
            </div>
          )}
          {chatHistory.map((chat) => (
            <button
              key={chat.id}
              onClick={() => loadChat(chat)}
              className={cn(
                "group w-full text-left px-3 py-3 rounded-lg transition-all duration-200 text-sm flex items-center gap-3 border border-transparent",
                currentChatId === chat.id
                  ? "bg-white/10 text-white border-white/10"
                  : "hover:bg-white/5 text-gray-400 hover:text-gray-200 hover:border-white/5"
              )}
            >
              <div className={cn(
                "w-1 h-1 rounded-full transition-colors",
                currentChatId === chat.id ? "bg-emerald-400" : "bg-gray-600 group-hover:bg-emerald-400"
              )} />
              <span className="truncate flex-1">{chat.title}</span>
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500" />
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-white/5 bg-black/20">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-lg">
              JN
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-white truncate">Josué Nanthakumar</div>
              <div className="text-xs text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Personal Assistant
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative w-full">
        {/* Header */}
        <header className="h-16 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="font-semibold text-sm tracking-wide text-gray-200">ASSISTANT PERSONNEL</h1>
            </div>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth custom-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-600/20 flex items-center justify-center mb-6 ring-1 ring-white/10 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                <Bot className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-3">
                Bonjour, je suis Josué AI.
              </h2>
              <p className="text-gray-500 max-w-md text-sm leading-relaxed">
                Je peux vous aider à gérer vos tâches, répondre à vos questions techniques ou simplement discuter.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8 w-full max-w-2xl">
                {[
                  "Analyser mon code React",
                  "Idées de projet Next.js",
                  "Expliquer le Server Side Rendering",
                  "Optimiser mes composants"
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="p-3 text-sm text-gray-400 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-emerald-500/30 rounded-xl transition-all text-left hover:text-emerald-400"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-3xl mx-auto pb-4">
              {messages.map((m: any) => (
                <div
                  key={m.id}
                  className={cn(
                    "flex gap-4 animate-in slide-in-from-bottom-2 duration-300",
                    m.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {m.role !== "user" && (
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 border border-emerald-500/20 mt-1">
                      <Bot className="w-5 h-5 text-emerald-400" />
                    </div>
                  )}

                  <div className="relative group/message max-w-[85%]">
                    <div
                      className={cn(
                        "px-5 py-3.5 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap",
                        m.role === "user"
                          ? "bg-blue-600 text-white rounded-br-none shadow-blue-900/20"
                          : "bg-[#1a1a1a] border border-white/5 text-gray-200 rounded-bl-none shadow-black/20"
                      )}
                    >
                      {m.content}
                    </div>

                    {m.role !== "user" && (
                      <button
                        onClick={() => copyToClipboard(m.content, m.id)}
                        className="absolute -bottom-6 left-0 p-1 text-gray-500 hover:text-emerald-400 transition-colors opacity-0 group-hover/message:opacity-100"
                        title="Copier"
                      >
                        {copiedId === m.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    )}
                  </div>

                  {m.role === "user" && (
                    <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center flex-shrink-0 border border-blue-500/30 mt-1">
                      <User className="w-5 h-5 text-blue-400" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex gap-4 justify-start animate-in fade-in duration-300">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 border border-emerald-500/20 mt-1">
                    <Bot className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="bg-[#1a1a1a] border border-white/5 px-5 py-4 rounded-2xl rounded-bl-none flex items-center gap-1.5 h-12">
                    <span className="w-1.5 h-1.5 bg-emerald-500/50 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-emerald-500/50 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-emerald-500/50 rounded-full animate-bounce"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-[#0a0a0a]/80 backdrop-blur-md border-t border-white/5 sticky bottom-0 z-20">
          <div className="max-w-3xl mx-auto relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-blue-600/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />

            <form onSubmit={handleSubmit} className="relative flex items-end gap-2 bg-[#151515] border border-white/10 rounded-xl p-2 shadow-xl">
              <button
                type="button"
                className="p-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                title="Joindre un fichier"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              <input
                ref={inputRef}
                className="flex-1 bg-transparent border-none focus:ring-0 text-gray-100 placeholder-gray-500 py-2.5 min-h-[44px] max-h-32 resize-none"
                value={input}
                onChange={handleInputChange}
                placeholder="Posez une question..."
                autoComplete="off"
              />

              {isLoading ? (
                <button
                  type="button"
                  onClick={() => stop()}
                  className="p-2.5 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-all duration-200 shadow-lg border border-red-500/20"
                  title="Arrêter la génération"
                >
                  <StopCircle className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input?.trim()}
                  className={cn(
                    "p-2.5 rounded-lg transition-all duration-200 shadow-lg",
                    input?.trim()
                      ? "bg-emerald-600 text-white hover:bg-emerald-500 hover:scale-105"
                      : "bg-white/5 text-gray-500 cursor-not-allowed"
                  )}
                >
                  <Send className="w-5 h-5" />
                </button>
              )}
            </form>

            <div className="text-center mt-3">
              <p className="text-[10px] text-gray-600 uppercase tracking-widest font-medium">
                Propulsé par Gemini 2.5 Flash • Josué Nanthakumar
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
