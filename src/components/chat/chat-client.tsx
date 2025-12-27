"use client";

import { useState, useRef, useEffect } from "react";
import {
  Loader2,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  BrainCircuit,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { ChatInput } from "@/components/ui/chat-input";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

// --- KONFIGURASI MODEL ---
const VISION_MODELS = [
  "google/gemini-2.0-flash-exp:free",
  "google/gemini-flash-1.5-8b:free",
];

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type AIModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
  context?: string;
};

type ModelGroups = {
  recommended: AIModel[];
  others: AIModel[];
};

interface ChatClientProps {
  initialMessages?: Message[];
  chatId?: string;
}

const BackgroundGrid = () => (
  <div className="absolute inset-0 z-0 h-full w-full pointer-events-none">
    <div className="absolute inset-0 bg-grid-pattern opacity-[0.015]" />
    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
  </div>
);

// --- KOMPONEN: THINKING PROCESS (Implementasi Blue Tone) ---
const ThinkingProcess = ({ content }: { content: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!content) return null;

  return (
    <div className="mb-3 rounded-xl border border-blue-100 bg-blue-50/30 dark:bg-blue-900/10 dark:border-blue-800/20 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full px-4 py-2 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-100/50 dark:hover:bg-blue-900/20 transition-colors"
      >
        <BrainCircuit size={14} />
        <span>Takon AI Mikir Sik...</span>
        {isOpen ? (
          <ChevronDown size={12} className="ml-auto" />
        ) : (
          <ChevronRight size={12} className="ml-auto" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-3 pt-0"
          >
            <div className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-mono whitespace-pre-wrap border-t border-blue-100 dark:border-blue-800/20 pt-2 mt-1 italic">
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- KOMPONEN: MESSAGE BUBBLE (Render Markdown Optimized) ---
const MessageContent = ({
  content,
  isUser,
}: {
  content: string;
  isUser?: boolean;
}) => {
  const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
  const thoughtProcess = thinkMatch ? thinkMatch[1].trim() : null;
  const cleanContent = content.replace(/<think>[\s\S]*?<\/think>/, "").trim();

  return (
    <div className="w-full min-w-0">
      {!isUser && thoughtProcess && (
        <ThinkingProcess content={thoughtProcess} />
      )}

      <div
        className={cn(
          "prose prose-sm max-w-none break-words leading-relaxed",
          isUser ? "prose-invert" : "dark:prose-invert text-foreground"
        )}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            ul: ({ children }) => (
              <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>
            ),
            li: ({ children }) => <li className="pl-1">{children}</li>,
            h1: ({ children }) => (
              <h1 className="text-lg font-bold mb-2 mt-4">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-base font-bold mb-2 mt-3">{children}</h2>
            ),
            code: ({ className, children, ...props }: any) => {
              const match = /language-(\w+)/.exec(className || "");
              const isInline = !match;
              return isInline ? (
                <code
                  className="bg-zinc-200/50 dark:bg-zinc-800/50 px-1.5 py-0.5 rounded text-[12px] font-mono text-blue-600 dark:text-blue-400"
                  {...props}
                >
                  {children}
                </code>
              ) : (
                <div className="relative my-3 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800">
                  <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
                    <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
                      {match?.[1] || "code"}
                    </span>
                  </div>
                  <pre className="p-4 overflow-x-auto text-xs font-mono text-zinc-300">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                </div>
              );
            },
            blockquote: ({ children }) => (
              <blockquote className="border-l-2 border-blue-500 pl-3 italic text-zinc-500 dark:text-zinc-400 my-2">
                {children}
              </blockquote>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto my-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-sm text-left">{children}</table>
              </div>
            ),
            th: ({ children }) => (
              <th className="bg-zinc-100 dark:bg-zinc-900 px-3 py-2 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                {children}
              </td>
            ),
            img: ({ src, alt }) => (
              <img
                src={src}
                alt={alt}
                className="rounded-xl max-w-full h-auto my-2 border border-zinc-200 dark:border-zinc-800"
              />
            ),
          }}
        >
          {cleanContent}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export function ChatClient({
  initialMessages = [],
  chatId: existingChatId,
}: ChatClientProps) {
  // --- STATE UNTUK FIX HYDRATION ERROR ---
  const [isMounted, setIsMounted] = useState(false);

  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [modelGroups, setModelGroups] = useState<ModelGroups>({
    recommended: [],
    others: [],
  });
  const [selectedModel, setSelectedModel] = useState(
    "meta-llama/llama-3.3-70b-instruct:free"
  );
  const [isModelsLoading, setIsModelsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const isVisionModel = VISION_MODELS.includes(selectedModel);

  // --- EFFECT UNTUK MENANDAI MOUNTED ---
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const fetchModels = async () => {
      setIsModelsLoading(true);
      try {
        const res = await fetch("/api/models");
        const data = await res.json();

        if (data.recommended || data.others) {
          setModelGroups(data);
          const allModels = [
            ...(data.recommended || []),
            ...(data.others || []),
          ];
          const isCurrentModelAlive = allModels.some(
            (m: AIModel) => m.id === selectedModel
          );

          if (!isCurrentModelAlive && allModels.length > 0) {
            setSelectedModel(allModels[0].id);
          }
        }
      } catch (error) {
        toast.error("Gagal Memuat Model", {
          description: "Menggunakan model default.",
        });
      } finally {
        setIsModelsLoading(false);
      }
    };
    fetchModels();
  }, [selectedModel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text: string, image?: string) => {
    if ((!text.trim() && !image) || isLoading) return;

    const displayContent = image
      ? text
        ? `${text}\n\n![Gambar User](${image})`
        : `![Gambar User](${image})`
      : text;

    const newMessages: Message[] = [
      ...messages,
      { id: Date.now().toString(), role: "user", content: displayContent },
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          chatId: existingChatId,
          model: selectedModel,
          image: image,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const rawMsg = errorData.error || response.statusText;
        toast.error("Gagal Mengirim", { description: rawMsg });
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: `**Error:** ${rawMsg}\n\nSilakan coba lagi.`,
          },
        ]);
        return;
      }

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

      if (!existingChatId && newChatId) {
        router.refresh();
        window.history.replaceState(null, "", `/chat/${newChatId}`);
      }
    } catch (error: any) {
      toast.error("Error Jaringan", { description: "Cek koneksi internet." });
    } finally {
      setIsLoading(false);
    }
  };

  // --- CEGAH RENDER HTML SEBELUM MOUNT SELESAI ---
  if (!isMounted) {
    return (
      <div className="flex flex-col h-full w-full relative font-sans bg-transparent">
        <BackgroundGrid />
        <div className="flex-1 overflow-hidden relative z-10 pt-24 md:pt-28">
          {/* Skeleton sederhana agar layout tidak jumping */}
          <div className="flex flex-col items-center justify-center space-y-4 pt-32 text-center opacity-0">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full relative font-sans bg-transparent">
      <BackgroundGrid />

      {/* --- MODEL SELECTOR (Adjusted Position) --- */}
      <div className="absolute top-8 left-6 z-30 flex items-center gap-2">
        <Select value={selectedModel} onValueChange={setSelectedModel}>
          <SelectTrigger className="w-[200px] md:w-[280px] h-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-zinc-200/50 dark:border-zinc-800/50 rounded-xl shadow-sm text-xs font-semibold px-4 transition-all focus:ring-blue-500">
            <div className="shrink-0 flex items-center mr-2">
              {isModelsLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-500" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              )}
            </div>
            <span className="truncate text-left flex-1">
              <SelectValue placeholder="Pilih Model" />
            </span>
          </SelectTrigger>

          <SelectContent
            position="popper"
            sideOffset={5}
            align="start"
            className="dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 w-[320px] z-[100] max-h-[400px] rounded-xl shadow-2xl"
          >
            {isModelsLoading ? (
              <div className="p-4 text-xs text-zinc-500 text-center flex flex-col items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Memuat Model...
              </div>
            ) : (
              <>
                {modelGroups.recommended.length > 0 && (
                  <SelectGroup>
                    <SelectLabel className="text-[10px] uppercase tracking-wider text-blue-600 dark:text-blue-400 font-bold bg-zinc-50 dark:bg-zinc-800/50 py-2 px-3 mb-1">
                      Rekomendasi & Stabil
                    </SelectLabel>
                    {modelGroups.recommended.map((model) => (
                      <SelectItem
                        key={model.id}
                        value={model.id}
                        className="text-xs cursor-pointer py-2.5 pl-4 focus:bg-zinc-100 dark:focus:bg-zinc-800 rounded-lg mx-1"
                      >
                        <div className="flex flex-col text-left">
                          <span className="font-bold text-slate-900 dark:text-zinc-200 truncate">
                            {model.name}
                          </span>
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate flex items-center gap-1">
                            <span className="uppercase">{model.provider}</span>
                            <span className="opacity-50">•</span>
                            <span>{model.description || "N/A"}</span>
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}

                {modelGroups.others.length > 0 && (
                  <SelectGroup>
                    <SelectLabel className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold py-2 px-3 bg-zinc-50/30 dark:bg-zinc-800/30 border-t border-zinc-100 dark:border-zinc-800 mt-2">
                      Model Lainnya
                    </SelectLabel>
                    {modelGroups.others.map((model) => (
                      <SelectItem
                        key={model.id}
                        value={model.id}
                        className="text-xs cursor-pointer py-2 pl-4 opacity-90 focus:bg-zinc-100 dark:focus:bg-zinc-800 rounded-lg mx-1"
                      >
                        <div className="flex flex-col text-left">
                          <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate">
                            {model.name}
                          </span>
                          <span className="text-[10px] text-zinc-400 truncate flex items-center gap-1">
                            <span className="uppercase">{model.provider}</span>
                            <span className="opacity-50">•</span>
                            <span>{model.description || "N/A"}</span>
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* --- CHAT AREA (Increased Padding Top to Clear Nav) --- */}
      <div className="flex-1 overflow-hidden relative z-10 pt-24 md:pt-28">
        <ScrollArea className="h-full px-4 md:px-8">
          <div className="mx-auto max-w-3xl space-y-10 py-10 pb-10">
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center space-y-4 pt-32 text-center"
              >
                <div className="space-y-2">
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                    Sugeng Rawuh Ning Takon AI
                  </h2>
                  <p className="text-muted-foreground text-md max-w-ls mx-auto">
                    Bingung garap tugas utowo coding? Takon AI wae!
                  </p>
                </div>
              </motion.div>
            )}

            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex gap-4",
                  m.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {m.role !== "user" && (
                  <Avatar className="h-10 w-10 border border-zinc-200 dark:border-zinc-800 mt-1 shadow-sm shrink-0">
                    <AvatarFallback className="bg-blue-600 text-white text-[10px] font-bold">
                      AI
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={cn(
                    "rounded-2xl px-5 py-4 text-[15px] shadow-sm max-w-[90%] md:max-w-[85%] leading-relaxed",
                    m.role === "user"
                      ? "bg-blue-600 text-white rounded-tr-none shadow-blue-200 dark:shadow-none"
                      : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-foreground rounded-tl-none w-full"
                  )}
                >
                  <MessageContent
                    content={m.content}
                    isUser={m.role === "user"}
                  />
                </div>
              </motion.div>
            ))}

            {isLoading && (
              <div className="flex gap-4">
                <Avatar className="h-10 w-10 border border-zinc-200 dark:border-zinc-800 shrink-0">
                  <AvatarFallback className="bg-blue-600 text-white text-[10px] font-bold">
                    AI
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center space-x-3 bg-white dark:bg-zinc-900 px-5 py-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 rounded-tl-none shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-sm text-muted-foreground font-medium animate-pulse">
                    Sedang berpikir...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* --- INPUT AREA --- */}
      <div className="p-4 md:p-8 pt-0 bg-transparent z-20">
        <div className="max-w-3xl mx-auto">
          <ChatInput
            onSend={handleSend}
            isLoading={isLoading}
            isVisionModel={isVisionModel}
          />
        </div>
      </div>
    </div>
  );
}
