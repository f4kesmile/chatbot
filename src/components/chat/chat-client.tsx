"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { ChatInput } from "@/components/ui/chat-input";
import { useRouter } from "next/navigation";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

interface ChatClientProps {
  initialMessages?: Message[];
  chatId?: string; // Optional, kalau null berarti chat baru
}

const BackgroundGrid = () => (
  <div className="absolute inset-0 z-0 h-full w-full pointer-events-none">
    <div className="absolute inset-0 bg-grid-pattern opacity-[0.015]" />
    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
  </div>
);

export function ChatClient({
  initialMessages = [],
  chatId: existingChatId,
}: ChatClientProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Scroll ke bawah saat pesan bertambah
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const newMessages: Message[] = [
      ...messages,
      { id: Date.now().toString(), role: "user", content: text },
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          chatId: existingChatId, // Kirim ID chat jika kita sedang di halaman history
        }),
      });

      if (!response.ok) throw new Error("Network response was not ok");

      const data = await response.json();
      const botReply = data.reply;
      const newChatId = data.chatId;

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: botReply,
        },
      ]);

      // Jika ini chat baru, refresh agar sidebar muncul history baru
      if (!existingChatId && newChatId) {
        router.refresh();
        // Opsional: Pindah URL ke /chat/[id] agar kalau di-refresh tidak hilang
        window.history.replaceState(null, "", `/chat/${newChatId}`);
      }
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
    <div className="flex flex-col h-full w-full relative font-sans bg-transparent">
      <BackgroundGrid />

      {/* CHAT AREA */}
      <div className="flex-1 overflow-hidden relative z-10">
        <ScrollArea className="h-full px-4 md:px-8">
          <div className="mx-auto max-w-3xl space-y-8 py-10 pb-4">
            {/* EMPTY STATE (Hanya muncul jika belum ada pesan sama sekali) */}
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center space-y-4 pt-40 text-center"
              >
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-foreground tracking-tight">
                    Ada yang bisa saya bantu?
                  </h2>
                  <p className="text-muted-foreground text-base max-w-md mx-auto">
                    Saya siap membantu tugasmu, menjawab pertanyaan, atau
                    sekadar mengobrol santai.
                  </p>
                </div>
              </motion.div>
            )}

            {/* MESSAGES */}
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {/* Bot Avatar */}
                {m.role !== "user" && (
                  <Avatar className="h-9 w-9 border border-border mt-1 shadow-sm">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                      VC
                    </AvatarFallback>
                  </Avatar>
                )}

                {/* Bubble Chat */}
                <div
                  className={`rounded-2xl px-5 py-3.5 text-[15px] shadow-sm max-w-[85%] md:max-w-[75%] leading-relaxed ${
                    m.role === "user"
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20 rounded-tr-sm"
                      : "bg-secondary border border-border text-foreground rounded-tl-sm"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>
                </div>
              </motion.div>
            ))}

            {/* LOADING */}
            {isLoading && (
              <div className="flex gap-4">
                <Avatar className="h-9 w-9 border border-border">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                    VC
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center space-x-3 bg-secondary px-5 py-4 rounded-2xl border border-border rounded-tl-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground font-medium">
                    Sedang berpikir...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* INPUT AREA */}
      <div className="p-4 md:p-6 pt-0 bg-transparent z-20">
        <ChatInput onSend={handleSend} isLoading={isLoading} />
      </div>
    </div>
  );
}
