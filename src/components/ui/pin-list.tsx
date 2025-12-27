"use client";

import React, { useMemo } from "react";
import { motion, LayoutGroup, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Pin, PinOff, Trash2 } from "lucide-react";

// --- TIPE DATA ---
export interface PinListItem {
  id: string;
  title: string;
  info?: string;
  pinned: boolean;
}

interface PinListProps {
  items: PinListItem[];
  onPinToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
  className?: string;
}

// --- ITEM KOMPONEN ---
const ListItem = ({
  item,
  isFirstPinned,
  isFirstHistory,
  onPinToggle,
  onDelete,
  onSelect,
}: {
  item: PinListItem;
  isFirstPinned: boolean;
  isFirstHistory: boolean;
  onPinToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 30,
        mass: 1,
      }}
      className="flex flex-col gap-1"
    >
      {/* HEADER DINAMIS */}
      {isFirstPinned && (
        <motion.h3
          layout
          className="mt-2 px-3 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider"
        >
          Pinned
        </motion.h3>
      )}

      {isFirstHistory && (
        <motion.h3
          layout
          className="mt-4 px-3 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider"
        >
          Riwayat
        </motion.h3>
      )}

      {/* ITEM KARTU (CLEAN VERSION - NO ICON) */}
      <div
        onClick={() => onSelect(item.id)}
        className={cn(
          "group relative flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-all",
          "hover:bg-zinc-100 dark:hover:bg-zinc-800/60",
          "cursor-pointer border border-transparent",
          // Indikator visual halus untuk item yang dipin (opsional, background tipis)
          item.pinned ? "bg-blue-50/50 dark:bg-blue-900/10" : "bg-transparent"
        )}
      >
        {/* Text Wrapper */}
        <div className="flex flex-col min-w-0 flex-1 gap-0.5">
          <span
            className={cn(
              "truncate text-sm transition-colors",
              // Jika dipin, teks sedikit lebih tebal/gelap
              item.pinned
                ? "font-semibold text-blue-700 dark:text-blue-100"
                : "font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white"
            )}
          >
            {item.title}
          </span>
          {item.info && (
            <span className="text-[10px] text-muted-foreground truncate opacity-70">
              {item.info}
            </span>
          )}
        </div>

        {/* Action Buttons (Floating on Right) */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPinToggle(item.id);
            }}
            className="p-1.5 rounded-md text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            title={item.pinned ? "Lepas Pin" : "Pin Chat"}
          >
            {item.pinned ? <PinOff size={13} /> : <Pin size={13} />}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            className="p-1.5 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Hapus Chat"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// --- KOMPONEN UTAMA LIST ---
export function PinList({
  items,
  onPinToggle,
  onDelete,
  onSelect,
  className,
}: PinListProps) {
  const sortedItems = useMemo(() => {
    const pinned = items.filter((i) => i.pinned);
    const unpinned = items.filter((i) => !i.pinned);
    return [...pinned, ...unpinned];
  }, [items]);

  return (
    <LayoutGroup>
      <div className={cn("flex flex-col w-full pb-4", className)}>
        <motion.div layout className="flex flex-col gap-0.5">
          <AnimatePresence mode="popLayout" initial={false}>
            {sortedItems.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-4 px-3 py-4 text-center text-xs text-muted-foreground italic"
              >
                Belum ada riwayat chat.
              </motion.div>
            )}

            {sortedItems.map((item, index) => {
              const isFirstPinned = item.pinned && index === 0;
              const isFirstHistory =
                !item.pinned && (index === 0 || sortedItems[index - 1].pinned);

              return (
                <ListItem
                  key={item.id}
                  item={item}
                  isFirstPinned={isFirstPinned}
                  isFirstHistory={isFirstHistory}
                  onPinToggle={onPinToggle}
                  onDelete={onDelete}
                  onSelect={onSelect}
                />
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    </LayoutGroup>
  );
}
