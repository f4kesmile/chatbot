"use client";

import * as React from "react";
import {
  SendHorizontal,
  Paperclip,
  X,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";
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

  // Auto-resize textarea
  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      // Max height 200px sebelum scroll muncul
      const newHeight = Math.min(textarea.scrollHeight, 200);
      textarea.style.height = `${newHeight}px`;
    }
  };

  React.useEffect(() => {
    if (!input && textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [input]);

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
        toast.warning("File terlalu besar (Maks 2MB)");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Format file harus gambar");
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
  };

  const isReadyToSend = input.trim().length > 0 || base64Image !== null;

  return (
    <div className="mx-auto max-w-3xl w-full">
      <div
        className="
        relative flex flex-col gap-2 
        bg-zinc-100 dark:bg-zinc-800/60
        border border-transparent focus-within:border-zinc-300 dark:focus-within:border-zinc-700
        rounded-[26px] 
        p-2 shadow-sm transition-all duration-300
      "
      >
        {/* Preview Gambar */}
        <AnimatePresence>
          {base64Image && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 8 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="relative w-fit mx-2 overflow-hidden"
            >
              <div className="relative group mt-2">
                <img
                  src={base64Image}
                  alt="Preview"
                  className="h-20 w-auto rounded-xl border border-zinc-200 dark:border-zinc-700 object-cover shadow-sm"
                />
                <button
                  onClick={() => setBase64Image(null)}
                  className="absolute -top-2 -right-2 bg-zinc-900 text-white rounded-full p-1 shadow-md hover:bg-red-500 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-2 px-1">
          {/* Tombol Upload (Kiri) */}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={!isVisionModel}
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ rotate: 90 }}
            transition={{ duration: 0.2 }}
            className={`shrink-0 rounded-full w-9 h-9 flex items-center justify-center transition-colors mb-1 ${
              isVisionModel
                ? "text-zinc-500 hover:text-blue-600 bg-transparent hover:bg-blue-100/50 dark:hover:bg-blue-900/20"
                : "text-zinc-300 dark:text-zinc-700 cursor-not-allowed opacity-50"
            }`}
            onClick={() => {
              if (isVisionModel) fileInputRef.current?.click();
              else toast.info("Ganti model ke Gemini untuk kirim gambar.");
            }}
          >
            {isVisionModel ? <Paperclip size={20} /> : <ImageIcon size={20} />}
          </motion.button>

          {/* Text Area - CUSTOM SCROLLBAR */}
          <div className="flex-1 py-2">
            <textarea
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
                w-full min-h-[24px] max-h-[200px] 
                resize-none border-none outline-none bg-transparent p-0 
                text-[15px] placeholder:text-zinc-400 dark:text-zinc-100
                leading-relaxed block
                
                /* --- CUSTOM SCROLLBAR STYLES --- */
                
                /* Lebar scrollbar tipis (6px = 1.5 tailwind) */
                [&::-webkit-scrollbar]:w-1.5
                
                /* Track (background scrollbar) transparan */
                [&::-webkit-scrollbar-track]:bg-transparent
                
                /* Thumb (batang scroll) warna abu-abu & rounded */
                [&::-webkit-scrollbar-thumb]:bg-zinc-300
                dark:[&::-webkit-scrollbar-thumb]:bg-zinc-600
                [&::-webkit-scrollbar-thumb]:rounded-full
                
                /* Hover effect pada thumb */
                hover:[&::-webkit-scrollbar-thumb]:bg-zinc-400
                dark:hover:[&::-webkit-scrollbar-thumb]:bg-zinc-500
              "
              rows={1}
            />
          </div>

          {/* Tombol Kirim */}
          <div className="mb-0.5">
            <Button
              onClick={handleSend}
              disabled={!isReadyToSend || isLoading}
              size="icon"
              className={`
                shrink-0 w-10 h-10 rounded-full transition-all duration-300 relative overflow-hidden
                ${
                  !isReadyToSend && !isLoading
                    ? "bg-transparent text-zinc-300 dark:text-zinc-600 cursor-not-allowed"
                    : isLoading
                    ? "bg-zinc-200 text-zinc-400 dark:bg-zinc-800 cursor-wait"
                    : "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 shadow-lg shadow-blue-500/20"
                }
              `}
            >
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Sparkles size={18} className="animate-pulse" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="send"
                    initial={{ scale: 0, x: -10 }}
                    animate={{ scale: 1, x: 0 }}
                    exit={{ scale: 0, x: 20, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    whileHover={{ x: 2, y: -2 }}
                  >
                    <SendHorizontal size={18} className="ml-0.5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
