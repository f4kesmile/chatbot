"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Inbox,
  ArrowRight,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Sesuaikan Interface dengan Schema Database SupportTicket
interface SupportTicket {
  id: string;
  subject: string; // Dulu 'category', sekarang kita pakai subject agar konsisten
  message: string; // Dulu 'summary'
  status: "OPEN" | "IN_PROGRESS" | "CLOSED"; // Sesuaikan enum
  createdAt: string;
  email: string; // Email user langsung ada di tabel SupportTicket
}

export function AdminInbox() {
  const [supabase] = useState(() => createClient());
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fungsi Fetch Data
  const fetchTickets = useCallback(
    async (isBackground = false) => {
      if (!isBackground) setLoading(true);

      const { data, error } = await supabase
        .from("SupportTicket") // <--- NAMA TABEL YANG BENAR
        .select("*")
        .order("updatedAt", { ascending: false }) // Urutkan dari yang baru diupdate
        .limit(5); // Ambil 5 terbaru saja untuk dashboard

      if (error) {
        console.error("Error fetching tickets:", error);
        toast.error("Gagal memuat inbox");
      } else if (data) {
        setTickets(data as SupportTicket[]);
      }

      if (!isBackground) setLoading(false);
    },
    [supabase]
  );

  // Initial Load & Realtime Subscription
  useEffect(() => {
    fetchTickets();

    // Subscribe ke perubahan tabel SupportTicket
    const channel = supabase
      .channel("realtime-dashboard-inbox")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "SupportTicket" },
        (payload) => {
          fetchTickets(true); // Refresh diam-diam
          if (payload.eventType === "INSERT") {
            toast.info("Tiket baru masuk!");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTickets, supabase]);

  const updateStatus = useCallback(
    async (id: string, newStatus: SupportTicket["status"]) => {
      // Optimistic UI Update
      setTickets((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
      );

      const { error } = await supabase
        .from("SupportTicket")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) {
        toast.error("Gagal mengubah status!");
        fetchTickets(true); // Revert jika gagal
      } else {
        toast.success(`Status tiket diperbarui`);
      }
    },
    [supabase, fetchTickets]
  );

  const getStatusBadge = (status: SupportTicket["status"]) => {
    switch (status) {
      case "OPEN":
        return (
          <Badge variant="destructive" className="rounded-full px-2 gap-1">
            <AlertCircle className="h-3 w-3" /> Baru
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge
            variant="secondary"
            className="rounded-full px-2 gap-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
          >
            <Clock className="h-3 w-3" /> Proses
          </Badge>
        );
      case "CLOSED":
        return (
          <Badge
            variant="outline"
            className="rounded-full px-2 gap-1 text-green-600 bg-green-50 border-green-200"
          >
            <CheckCircle2 className="h-3 w-3" /> Selesai
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="rounded-full">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900">
      {/* HEADER */}
      <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Inbox className="w-5 h-5 text-blue-600" /> Inbox Terbaru
          </h3>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-2 text-muted-foreground hover:text-primary rounded-full"
          onClick={() => fetchTickets()}
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* LIST AREA */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mb-2" />
            <span className="text-xs">Memuat data...</span>
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
            <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
              <CheckCircle2 className="h-6 w-6 opacity-30" />
            </div>
            <p className="text-sm">Tidak ada tiket terbaru.</p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <div
              key={ticket.id}
              className={`
                p-4 flex flex-col sm:flex-row sm:items-center justify-between transition-all gap-4 group 
                hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer
                ${
                  ticket.status === "OPEN"
                    ? "bg-red-50/30 dark:bg-red-900/10"
                    : ""
                }
              `}
              onClick={() => router.push("/admin/inbox")} // Klik lari ke halaman Inbox Penuh
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-sm font-semibold truncate ${
                      ticket.status === "OPEN"
                        ? "text-red-600 dark:text-red-400"
                        : "text-foreground"
                    }`}
                  >
                    {ticket.email}
                  </span>
                  {getStatusBadge(ticket.status)}
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {new Date(ticket.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground leading-snug line-clamp-1">
                  <span className="font-medium text-foreground">
                    {ticket.subject}
                  </span>{" "}
                  — {ticket.message}
                </p>
              </div>

              <div
                className="flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl">
                    <DropdownMenuItem
                      onClick={() => updateStatus(ticket.id, "OPEN")}
                    >
                      <AlertCircle className="mr-2 h-4 w-4 text-red-500" />{" "}
                      Tandai Baru
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => updateStatus(ticket.id, "IN_PROGRESS")}
                    >
                      <Clock className="mr-2 h-4 w-4 text-yellow-500" /> Tandai
                      Proses
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => updateStatus(ticket.id, "CLOSED")}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />{" "}
                      Tandai Selesai
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Tombol Panah ke Detail */}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full text-muted-foreground"
                  onClick={() => router.push("/admin/inbox")}
                >
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900">
        <Button
          variant="outline"
          className="w-full rounded-full text-xs h-9"
          onClick={() => router.push("/admin/inbox")}
        >
          Lihat Semua Inbox
        </Button>
      </div>
    </div>
  );
}
