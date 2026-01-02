"use client";

import { useState, useRef, useEffect } from "react";
import {
  Loader2,
  Sparkles,
  RefreshCw,
  ChevronDown,
  BrainCircuit,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
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

// --- IMPORT UNTUK MARKDOWN & LATEX ---
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
// -------------------------------------

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

// --- KOMPONEN: THINKING PROCESS (ACCORDION) ---
const ThinkingProcess = ({ content }: { content: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!content) return null;

  return (
    <div className="mb-6 group">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg transition-all w-fit select-none border",
          isOpen
            ? "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300"
            : "bg-transparent border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        )}
      >
        <BrainCircuit
          size={14}
          className={cn(
            "transition-colors",
            isOpen ? "text-blue-500" : "text-zinc-400"
          )}
        />
        <span>Proses Berpikir</span>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={12} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="ml-2 pl-4 border-l-2 border-zinc-200 dark:border-zinc-700 py-2 my-1">
              <div className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-mono">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {content}
                </ReactMarkdown>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

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
          // PERUBAHAN: prose-base (font lebih besar 16px) & leading-loose (jarak baris renggang)
          "prose prose-base max-w-none break-words leading-loose",

          // Styling Latex & Warna
          "prose-p:text-zinc-800 dark:prose-p:text-zinc-100",
          "prose-headings:text-zinc-900 dark:prose-headings:text-zinc-50",
          "prose-strong:text-zinc-900 dark:prose-strong:text-zinc-50",
          "prose-code:text-blue-600 dark:prose-code:text-blue-400",
          "prose-li:text-zinc-800 dark:prose-li:text-zinc-100",

          // Latex styling
          "[&_.katex-display]:my-6 [&_.katex]:text-lg",
          isUser ? "prose-invert" : "dark:prose-invert text-foreground"
        )}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            // PERUBAHAN: mb-6 untuk jarak antar paragraf yang lebih lega
            p: ({ children }) => <p className="mb-6 last:mb-0">{children}</p>,
            ul: ({ children }) => (
              <ul className="list-disc pl-8 mb-6 space-y-2">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal pl-8 mb-6 space-y-2">{children}</ol>
            ),
            li: ({ children }) => <li className="pl-1 mb-1">{children}</li>,
            h1: ({ children }) => (
              <h1 className="text-xl font-bold mb-4 mt-8">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-lg font-bold mb-3 mt-6">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-base font-bold mb-2 mt-4">{children}</h3>
            ),
            code: ({ className, children, ...props }: any) => {
              const match = /language-(\w+)/.exec(className || "");
              const isInline = !match;
              return isInline ? (
                <code
                  className="bg-zinc-200/50 dark:bg-zinc-800/50 px-1.5 py-0.5 rounded text-[13px] font-mono text-blue-600 dark:text-blue-400"
                  {...props}
                >
                  {children}
                </code>
              ) : (
                <div className="relative my-4 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-md">
                  <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
                    <span className="text-[11px] text-zinc-400 font-mono uppercase tracking-wider">
                      {match?.[1] || "code"}
                    </span>
                  </div>
                  <pre className="p-4 overflow-x-auto text-[13px] font-mono text-zinc-300 leading-normal">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                </div>
              );
            },
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-blue-500 pl-4 italic text-zinc-500 dark:text-zinc-400 my-4 bg-zinc-50 dark:bg-zinc-900/50 py-2 pr-2 rounded-r-lg">
                {children}
              </blockquote>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto my-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-sm text-left">{children}</table>
              </div>
            ),
            th: ({ children }) => (
              <th className="bg-zinc-100 dark:bg-zinc-900 px-4 py-3 font-semibold border-b border-zinc-200 dark:border-zinc-800 text-sm">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0 text-sm">
                {children}
              </td>
            ),
            img: ({ src, alt }) => (
              <img
                src={src}
                alt={alt}
                className="rounded-2xl max-w-full h-auto my-4 border border-zinc-200 dark:border-zinc-800 shadow-sm"
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
  const hasMessages = messages.length > 0;

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
    if (messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
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

  if (!isMounted) {
    return (
      <div className="flex flex-col h-[100dvh] w-full relative font-sans bg-transparent">
        <BackgroundGrid />
        <div className="flex-1 overflow-hidden relative z-10 pt-24 md:pt-28">
          <div className="flex flex-col items-center justify-center space-y-4 pt-32 text-center opacity-0">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] w-full relative font-sans bg-transparent overflow-hidden">
      <BackgroundGrid />

      {/* --- HEADER: MODEL SELECTOR --- */}
      <div className="shrink-0 z-30 w-full flex items-center justify-start pt-16 md:pt-6 pb-2 px-4 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2">
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-[160px] md:w-[280px] h-9 md:h-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-zinc-200/50 dark:border-zinc-800/50 rounded-xl shadow-sm text-xs font-semibold px-3 md:px-4 transition-all focus:ring-blue-500">
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
              className="dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 w-[280px] md:w-[320px] z-[100] max-h-[400px] rounded-xl shadow-2xl"
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
                              <span className="uppercase">
                                {model.provider}
                              </span>
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
                              <span className="uppercase">
                                {model.provider}
                              </span>
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
      </div>

      {/* --- CHAT AREA --- */}
      <div className="flex-1 overflow-hidden relative z-10 pt-0">
        <ScrollArea className="h-full px-2 md:px-8">
          <div
            className={cn(
              "mx-auto w-full md:max-w-4xl space-y-6 py-4 transition-all duration-300",
              hasMessages ? "pb-32 md:pb-20" : "pb-10"
            )}
          >
            {/* CHAT MESSAGES */}
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex gap-3 md:gap-4",
                  m.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "text-[16px] leading-loose", // FONT BASE 16px & LEADING LOOSE
                    m.role === "user"
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 px-5 py-3 rounded-[24px] max-w-[85%] shadow-sm"
                      : "w-full px-0 py-0 bg-transparent text-zinc-900 dark:text-zinc-100"
                  )}
                >
                  <MessageContent
                    content={m.content}
                    isUser={m.role === "user"}
                  />
                </div>
              </motion.div>
            ))}

            {/* LOADING INDICATOR */}
            {isLoading && (
              <div className="flex gap-4 w-full">
                <div className="w-full">
                  <div className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg bg-zinc-100/50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 w-fit animate-pulse border border-zinc-200/50 dark:border-zinc-700/50">
                    <BrainCircuit
                      size={14}
                      className="animate-pulse text-blue-500"
                    />
                    <span>Sedang menganalisis pertanyaan...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* --- INPUT AREA --- */}
      <div
        className={cn(
          "transition-all duration-500 ease-in-out absolute left-0 right-0 z-40 flex justify-center",
          hasMessages
            ? "bottom-0 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-200/50 dark:border-zinc-800/50 pt-3 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] md:pb-6"
            : "top-1/2 -translate-y-1/2 px-4"
        )}
      >
        <div
          className={cn(
            "w-full transition-all duration-500 flex flex-col items-center",
            hasMessages
              ? "max-w-full md:max-w-4xl"
              : "max-w-full md:max-w-2xl gap-6"
          )}
        >
          {/* SAMBUTAN */}
          <AnimatePresence>
            {!hasMessages && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="text-center space-y-3"
              >
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                  Sugeng Rawuh Ning Takon AI
                </h2>
                <p className="text-muted-foreground text-md max-w-ls mx-auto">
                  Bingung garap tugas utowo coding? Takon AI wae!
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <ChatInput
            onSend={handleSend}
            isLoading={isLoading}
            isVisionModel={isVisionModel}
          />

          {!hasMessages && (
            <p className="text-[10px] text-center text-zinc-400 animate-in fade-in delay-500">
              Takon AI dapat membuat kesalahan. Cek info penting.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
