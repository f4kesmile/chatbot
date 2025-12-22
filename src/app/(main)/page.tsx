"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";

// Tipe data pesan manual
type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

// Ubah fixed jadi absolute agar tidak menutupi sidebar
const BackgroundGrid = () => (
  <div className="absolute inset-0 z-0 h-full w-full pointer-events-none">
    <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
    <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent" />
  </div>
);

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fungsi Kirim Pesan Manual
  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput("");

    const newMessages: Message[] = [
      ...messages,
      { id: Date.now().toString(), role: "user", content: userText },
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) throw new Error("Network response was not ok");

      const botReply = await response.text();

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: botReply,
        },
      ]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Maaf, terjadi kesalahan koneksi.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // PENTING: Gunakan h-full, bukan h-screen. Dan relative agar background grid pas.
    <div className="flex flex-col h-full w-full relative font-sans">
      <BackgroundGrid />

      {/* Area Chat Scrollable */}
      <div className="flex-1 overflow-hidden relative z-10">
        <ScrollArea className="h-full px-4 md:px-6">
          <div className="mx-auto max-w-3xl space-y-6 py-10 pb-4">
            {/* Empty State */}
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center space-y-4 pt-20 text-center"
              >
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full bg-linear-to-r from-indigo-500 to-purple-600 opacity-20 blur-lg transition duration-1000 animate-pulse"></div>
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl">
                    <Bot className="h-10 w-10 text-indigo-400" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  How can I help you?
                </h2>
                <p className="text-zinc-500 max-w-md text-sm">
                  Mode Manual Aktif. Jawaban akan muncul sekaligus.
                </p>
              </motion.div>
            )}

            {/* Message List */}
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {m.role !== "user" && (
                  <Avatar className="h-8 w-8 border border-white/10 bg-black mt-1">
                    <AvatarFallback className="bg-black text-indigo-400">
                      <Bot size={16} />
                    </AvatarFallback>
                    <AvatarImage src="/bot-avatar.png" />
                  </Avatar>
                )}

                <div
                  className={`rounded-2xl px-4 py-3 text-sm shadow-sm max-w-[85%] md:max-w-[75%] leading-relaxed ${
                    m.role === "user"
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10"
                      : "bg-zinc-900/80 border border-white/10 text-zinc-100 backdrop-blur-sm"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>
                </div>

                {m.role === "user" && (
                  <Avatar className="h-8 w-8 border border-white/10 bg-black mt-1">
                    <AvatarFallback className="bg-zinc-800 text-white">
                      <User size={16} />
                    </AvatarFallback>
                  </Avatar>
                )}
              </motion.div>
            ))}

            {isLoading && (
              <div className="flex gap-4">
                <Avatar className="h-8 w-8 border border-white/10 bg-black">
                  <AvatarFallback className="bg-black text-indigo-400">
                    <Bot size={16} />
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center space-x-2 bg-zinc-900/50 px-4 py-3 rounded-2xl border border-white/10">
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                  <span className="text-xs text-zinc-400">
                    AI sedang berpikir...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Input Area (Sticky Bottom) */}
      <div className="p-4 bg-black/80 backdrop-blur-md border-t border-white/5 z-20">
        <div className="mx-auto max-w-3xl">
          <form
            onSubmit={handleSend}
            className="relative flex items-center gap-2 rounded-xl bg-zinc-900/80 p-1.5 border border-white/10 focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all shadow-xl"
          >
            <Input
              value={input}
              onChange={(e: any) => setInput(e.target.value)}
              placeholder="Tanyakan sesuatu..."
              className="flex-1 bg-transparent border-0 focus-visible:ring-0 text-white placeholder:text-zinc-600 h-11 px-4"
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="h-9 w-9 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <div className="text-center mt-2">
            <p className="text-[10px] text-zinc-600">
              AI dapat membuat kesalahan. Mohon periksa informasi penting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
