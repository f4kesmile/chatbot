"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { MessageSquare, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { usePathname, useRouter } from "next/navigation";

type ChatRow = {
  id: string;
  title: string | null;
  createdAt: string;
};

export function ChatHistoryList() {
  const [supabase] = useState(() => createClient());
  const [chats, setChats] = useState<ChatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const fetchHistory = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("Chat")
      .select("id, title, createdAt")
      .eq("userId", user.id)
      .order("createdAt", { ascending: false });

    if (data) setChats(data as unknown as ChatRow[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const t = setTimeout(() => {
      void fetchHistory();
    }, 0);

    return () => clearTimeout(t);
  }, [fetchHistory]);

  function confirmDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    toast("Hapus riwayat percakapan ini?", {
      description: "Data tidak bisa dikembalikan.",
      action: {
        label: "Hapus",
        onClick: () => void deleteChat(id),
      },
      cancel: {
        label: "Batal",
        onClick: () => {},
      },
      duration: 4000,
    });
  }

  async function deleteChat(id: string) {
    // Optimistic UI update
    const previousChats = [...chats];
    setChats((prev) => prev.filter((c) => c.id !== id));

    const { error } = await supabase.from("Chat").delete().eq("id", id);

    if (error) {
      toast.error("Gagal menghapus chat");
      setChats(previousChats);
    } else {
      toast.success("Chat berhasil dihapus");
      if (pathname === `/chat/${id}`) {
        router.push("/");
      }
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="text-center p-4 text-xs text-muted-foreground">
        Belum ada riwayat.
      </div>
    );
  }

  return (
    <div className="space-y-1 p-2">
      {chats.map((chat) => (
        <Link
          key={chat.id}
          href={`/chat/${chat.id}`}
          className={`
                group flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors
                ${
                  pathname === `/chat/${chat.id}`
                    ? "bg-secondary text-secondary-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }
            `}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <MessageSquare className="h-4 w-4 shrink-0" />
            <span className="truncate">{chat.title || "Percakapan Baru"}</span>
          </div>

          {/* Tombol Hapus */}
          <button
            onClick={(e) => confirmDelete(chat.id, e)}
            className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity focus:opacity-100"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </Link>
      ))}
    </div>
  );
}
