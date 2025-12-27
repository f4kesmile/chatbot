"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Megaphone,
  AlertTriangle,
  CheckCircle2,
  ServerCrash,
  Info,
  X,
} from "lucide-react";
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

// --- KOMPONEN KARTU (ANIMASI 1-PER-1 & RESPONSIF) ---
const NotificationCard = ({
  item,
  index, // Menerima index untuk delay
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
      // ANIMASI: Delay berdasarkan index (item ke-1 delay 0s, ke-2 delay 0.15s, dst)
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          type: "spring",
          stiffness: 180,
          damping: 25,
          delay: index * 0.15,
        },
      }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={cn(
        "relative overflow-hidden mb-3 pointer-events-auto",
        "flex items-start gap-4 p-4 pr-10",
        "rounded-3xl",

        // --- PENGATURAN LEBAR RESPONSIF ---
        "w-[92%]", // HP: Agak pendek (92% layar) agar ada sisa ruang kiri-kanan
        "sm:w-[380px]", // Tablet: Fixed width yang enak dilihat
        "md:w-[450px]", // Desktop: Sedikit lebih lebar

        // WARNA & BORDER
        "bg-white dark:bg-zinc-900",
        "border border-zinc-200 dark:border-zinc-800",

        // EFEK SHADOW (Per Kartu)
        "shadow-lg shadow-zinc-200/40 dark:shadow-black/40"
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
        <X size={18} />
      </button>

      {/* Icon Box */}
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full mt-1"
        style={{ backgroundColor: `${item.color}15`, color: item.color }}
      >
        {getIcon()}
      </div>

      {/* Content Text */}
      <div className="flex flex-col gap-1 w-full min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
            {item.title}
          </span>
          <span className="text-[10px] font-medium text-muted-foreground bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full whitespace-nowrap">
            {item.time}
          </span>
        </div>
        <p className="text-xs font-medium text-muted-foreground leading-relaxed break-words">
          {item.message}
        </p>
      </div>
    </motion.div>
  );
};

// --- WIDGET CONTAINER ---
export function BroadcastWidget({ className }: { className?: string }) {
  const [notifications, setNotifications] = useState<BroadcastItemProps[]>([]);
  const [supabase] = useState(() => createClient());

  const parseConfigToNotifications = (config: any) => {
    const newItems: BroadcastItemProps[] = [];

    // 1. Maintenance
    if (config?.maintenanceMode) {
      newItems.push({
        id: "maint-mode",
        title: "System Maintenance",
        message: "Sistem sedang dalam perbaikan. Akses mungkin terbatas.",
        time: "Penting",
        icon: "danger",
        color: "#ef4444",
      });
    }

    // 2. Broadcast (Multi-line)
    if (config?.broadcastMessage) {
      const lines = config.broadcastMessage
        .split("\n")
        .filter((line: string) => line.trim() !== "");
      lines.forEach((line: string, index: number) => {
        newItems.push({
          id: `msg-${index}`,
          title: "Pengumuman Admin",
          message: line,
          time: "Baru saja",
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
        "w-full flex flex-col items-center gap-3 pointer-events-none",
        className
      )}
    >
      <div className="w-full flex flex-col items-center gap-3">
        <AnimatePresence mode="popLayout">
          {notifications.map((item, index) => (
            // PASS INDEX KE SINI
            <NotificationCard
              key={item.id}
              item={item}
              index={index}
              onClose={handleClose}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
