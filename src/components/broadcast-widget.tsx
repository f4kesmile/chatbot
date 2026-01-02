"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Megaphone, AlertTriangle, ServerCrash, Info, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { AnimatePresence, motion } from "framer-motion";

interface BroadcastItemProps {
  id: string;
  title: string;
  message: string;
  icon: string;
  color: string;
  time: string;
}

const NotificationCard = ({
  item,
  index,
  onClose,
}: {
  item: BroadcastItemProps;
  index: number;
  onClose: (id: string) => void;
}) => {
  const getIcon = () => {
    switch (item.icon) {
      case "danger":
        return <ServerCrash size={20} />;
      case "warning":
        return <AlertTriangle size={20} />;
      case "megaphone":
        return <Megaphone size={20} />;
      default:
        return <Info size={20} />;
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }} // Animasi masuk lebih halus dari atas
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 30,
          delay: index * 0.1,
        },
      }}
      exit={{ opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.2 } }}
      className={cn(
        "relative overflow-hidden mb-2 pointer-events-auto", // mb-2 agar jarak antar kartu rapat
        "flex items-start gap-3 p-3.5 pr-9", // Padding sedikit diperkecil untuk mobile
        "rounded-2xl",

        // --- RESPONSIVE WIDTH FIX ---
        "w-full", // Mobile: Full width container
        "mx-auto", // Center alignment

        // WARNA & BORDER (Glassmorphism Effect)
        "bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md",
        "border border-zinc-200/60 dark:border-zinc-800/60",
        "shadow-xl shadow-zinc-200/20 dark:shadow-black/20"
      )}
    >
      {/* Tombol Close */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose(item.id);
        }}
        className="absolute top-3 right-3 p-1 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors z-20"
      >
        <X size={16} />
      </button>

      {/* Icon Box */}
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full mt-0.5"
        style={{ backgroundColor: `${item.color}15`, color: item.color }}
      >
        {getIcon()}
      </div>

      {/* Content Text */}
      <div className="flex flex-col gap-0.5 w-full min-w-0">
        <div className="flex items-center justify-between pr-2">
          <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100 truncate">
            {item.title}
          </span>
          <span className="text-[10px] font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full whitespace-nowrap">
            {item.time}
          </span>
        </div>
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed break-words">
          {item.message}
        </p>
      </div>
    </motion.div>
  );
};

export function BroadcastWidget({ className }: { className?: string }) {
  const [notifications, setNotifications] = useState<BroadcastItemProps[]>([]);
  const [supabase] = useState(() => createClient());

  const parseConfigToNotifications = (config: any) => {
    const newItems: BroadcastItemProps[] = [];
    if (config?.maintenanceMode) {
      newItems.push({
        id: "maint-mode",
        title: "Maintenance",
        message: "Sistem sedang dalam perbaikan.",
        time: "Now",
        icon: "danger",
        color: "#ef4444",
      });
    }
    if (config?.broadcastMessage) {
      const lines = config.broadcastMessage
        .split("\n")
        .filter((line: string) => line.trim() !== "");
      lines.forEach((line: string, index: number) => {
        newItems.push({
          id: `msg-${index}`,
          title: "Pengumuman",
          message: line,
          time: "Baru Saja",
          icon: config.maintenanceMode ? "warning" : "megaphone",
          color: config.maintenanceMode ? "#f59e0b" : "#2563eb",
        });
      });
    }
    setNotifications(newItems);
  };

  useEffect(() => {
    const fetchConfig = async () => {
      const { data } = await supabase
        .from("SiteConfig")
        .select("*")
        .eq("id", "config")
        .single();
      if (data) parseConfigToNotifications(data);
    };
    fetchConfig();

    const channel = supabase
      .channel("config-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "SiteConfig",
          filter: "id=eq.config",
        },
        (payload) => {
          parseConfigToNotifications(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const handleClose = (id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div
      className={cn(
        "w-full flex flex-col items-center pointer-events-none px-2 sm:px-0",
        className
      )}
    >
      <AnimatePresence mode="popLayout">
        {notifications.map((item, index) => (
          <NotificationCard
            key={item.id}
            item={item}
            index={index}
            onClose={handleClose}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
