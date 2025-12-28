"use client";

import * as React from "react";
import { SendHorizontal, Paperclip, X, Image as ImageIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface ChatInputProps {
  onSend: (message: string, image?: string) => void;
  isLoading: boolean;
  isVisionModel: boolean;
}

export function ChatInput({
  onSend,
  isLoading,
  isVisionModel,
}: ChatInputProps) {
  const [input, setInput] = React.useState("");
  const [base64Image, setBase64Image] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.warning("Ukuran File Terlalu Besar", {
          description: "Maksimal ukuran gambar adalah 2MB.",
        });
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Format File Salah", {
          description: "Harap upload file gambar (JPG, PNG, WEBP).",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setBase64Image(reader.result as string);
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const handleSend = () => {
    if ((!input.trim() && !base64Image) || isLoading) return;
    onSend(input, base64Image || undefined);
    setInput("");
    setBase64Image(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  return (
    <div className="mx-auto max-w-3xl w-full">
      <div
        className="
        relative flex flex-col gap-2 
        bg-white dark:bg-zinc-900 
        border border-zinc-200 dark:border-zinc-800 
        rounded-xl /* <--- STYLE BARU: BOXY ROUNDED */
        p-2 shadow-sm transition-all 
        focus-within:ring-1 focus-within:ring-blue-500/50
      "
      >
        {/* Preview Gambar */}
        <AnimatePresence>
          {base64Image && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-fit mx-2 mt-2 group"
            >
              <img
                src={base64Image}
                alt="Preview"
                className="h-20 w-auto rounded-lg border border-zinc-200 dark:border-zinc-700 object-cover shadow-sm"
              />
              <button
                onClick={() => setBase64Image(null)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition scale-0 group-hover:scale-100"
              >
                <X size={12} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-2">
          {/* Tombol Upload */}
          <div className="pb-1 pl-1">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={!isVisionModel}
            />
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-lg w-9 h-9 transition-colors ${
                isVisionModel
                  ? "text-zinc-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  : "text-zinc-300 dark:text-zinc-700 cursor-not-allowed opacity-50"
              }`}
              onClick={() => {
                if (isVisionModel) fileInputRef.current?.click();
                else
                  toast.info("Fitur Gambar Tidak Tersedia", {
                    description: "Ganti model ke Gemini untuk upload gambar.",
                  });
              }}
            >
              {isVisionModel ? (
                <Paperclip size={20} />
              ) : (
                <ImageIcon size={20} />
              )}
            </Button>
          </div>

          {/* Text Area */}
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              adjustHeight();
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              isVisionModel
                ? "Ketik pesan atau lampirkan gambar..."
                : "Ketik pesan..."
            }
            className="
              flex-1 min-h-[44px] max-h-[200px] w-full 
              resize-none border-0 bg-transparent 
              focus-visible:ring-0 focus-visible:ring-offset-0 
              py-3 px-2 text-sm placeholder:text-zinc-400 font-sans leading-relaxed
            "
            rows={1}
          />

          {/* Tombol Kirim */}
          <div className="pb-1 pr-1">
            <Button
              onClick={handleSend}
              disabled={(!input.trim() && !base64Image) || isLoading}
              size="icon"
              className={`
                w-9 h-9 rounded-lg transition-all
                ${
                  (!input.trim() && !base64Image) || isLoading
                    ? "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed" // Abu-abu
                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                }
              `}
            >
              <SendHorizontal size={18} className="ml-0.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
