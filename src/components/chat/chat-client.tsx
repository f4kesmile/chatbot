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
    // Gunakan h-[100dvh] untuk tinggi dinamis browser HP
    <div className="flex flex-col h-full w-full relative font-sans bg-transparent">
      <BackgroundGrid />

      {/* CHAT AREA */}
      <div className="flex-1 overflow-hidden relative z-10">
        <ScrollArea className="h-full">
          {/* Padding horizontal dikurangi di mobile (px-4) agar space lebih luas */}
          {/* Padding bottom (pb-32) diperbesar agar chat terakhir tidak ketutup input */}
          <div className="flex flex-col w-full max-w-3xl mx-auto px-4 md:px-8 py-4 pb-32 space-y-6">
            {/* EMPTY STATE */}
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center space-y-4 pt-20 md:pt-40 text-center px-4"
              >
                <div className="space-y-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                    Ada yang bisa saya bantu?
                  </h2>
                  <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto">
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
                className={`flex gap-3 md:gap-4 ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {/* Bot Avatar - Hide on tiny mobile screens if needed, but keeping generally ok */}
                {m.role !== "user" && (
                  <Avatar className="h-8 w-8 md:h-9 md:w-9 border border-border mt-1 shrink-0 shadow-sm">
                    <AvatarFallback className="bg-primary text-primary-foreground text-[10px] md:text-xs font-bold">
                      VC
                    </AvatarFallback>
                  </Avatar>
                )}

                {/* Bubble Chat - Max width adjusted for mobile */}
                <div
                  className={`rounded-2xl px-4 py-2.5 md:px-5 md:py-3.5 text-sm md:text-[15px] shadow-sm max-w-[85%] md:max-w-[75%] leading-relaxed break-words ${
                    m.role === "user"
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20 rounded-tr-sm"
                      : "bg-secondary border border-border text-foreground rounded-tl-sm"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>
                </div>
              </motion.div>
            ))}

            {/* LOADING INDICATOR */}
            {isLoading && (
              <div className="flex gap-3 md:gap-4">
                <Avatar className="h-8 w-8 md:h-9 md:w-9 border border-border shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-bold">
                    VC
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center space-x-3 bg-secondary px-4 py-3 rounded-2xl border border-border rounded-tl-sm">
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

      {/* INPUT AREA FIX */}
      {/* Position sticky atau fixed di mobile kadang buggy, structure flex-col + flex-1 di atas lebih aman */}
      <div className="p-3 md:p-6 pt-0 bg-transparent z-20 w-full max-w-3xl mx-auto">
        <ChatInput onSend={handleSend} isLoading={isLoading} />
      </div>
    </div>
  );
}
