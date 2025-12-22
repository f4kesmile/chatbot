"use client";

import * as React from "react";
import { Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  isLoading,
  placeholder = "Ketik pesan...",
}: ChatInputProps) {
  const [value, setValue] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!value.trim() || isLoading) return;
    onSend(value);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <motion.div
        whileHover={{ scale: 1.005 }} // Efek hover: sedikit membesar
        className="relative group z-10"
      >
        {/* CONTAINER UTAMA
            - bg-white (Light) / bg-zinc-950 (Dark)
            - shadow-xl (Efek mengambang di Light mode)
            - hover:shadow-2xl (Bayangan makin tajam saat hover)
        */}
        <div
          className={cn(
            "relative flex items-end gap-2 p-2 rounded-2xl transition-all duration-300",
            // Light Mode Styles: Putih, Border halus, Shadow Floating
            "bg-white border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:border-zinc-300",
            // Dark Mode Styles: Hitam, Border gelap, Shadow minim
            "dark:bg-zinc-950 dark:border-zinc-800 dark:shadow-none dark:hover:border-zinc-700",

            // Focus State
            "focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/50"
          )}
        >
          {/* TEXTAREA */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            className={cn(
              "w-full bg-transparent text-sm px-4 py-3 min-h-[48px] max-h-[200px] resize-none focus:outline-none scrollbar-hide",
              // Text Colors
              "text-zinc-800 placeholder:text-zinc-400",
              "dark:text-zinc-100 dark:placeholder:text-zinc-500"
            )}
            style={{ lineHeight: "1.5" }}
          />

          {/* SEND BUTTON */}
          <button
            onClick={handleSubmit}
            disabled={!value.trim() || isLoading}
            className={cn(
              "mb-1 mr-1 flex items-center justify-center h-10 w-10 shrink-0 rounded-xl transition-all duration-200",
              value.trim() && !isLoading
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 active:scale-95"
                : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <Sparkles className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5 ml-0.5" />
            )}
          </button>
        </div>
      </motion.div>

      {/* FOOTER TEXT */}
      <div className="text-center mt-3">
        <p className="text-[10px] text-zinc-400 dark:text-zinc-600 font-medium">
          AI dapat membuat kesalahan. Mohon periksa informasi penting.
        </p>
      </div>
    </div>
  );
}
