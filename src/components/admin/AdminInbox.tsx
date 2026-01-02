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
  Calendar,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: "OPEN" | "IN_PROGRESS" | "CLOSED";
  createdAt: string;
  email: string;
  User?: {
    name: string | null;
    avatar: string | null;
  } | null;
}

export function AdminInbox() {
  const [supabase] = useState(() => createClient());
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchTickets = useCallback(
    async (isBackground = false) => {
      if (!isBackground) setLoading(true);

      const { data, error } = await supabase
        .from("SupportTicket")
        .select(
          `
          *,
          User (
            name,
            avatar
          )
        `
        )
        .order("updatedAt", { ascending: false })
        .limit(5);

      if (error) {
        console.error("Error fetching tickets:", error);
        toast.error("Gagal memuat inbox");
      } else if (data) {
        setTickets(data as unknown as SupportTicket[]);
      }

      if (!isBackground) setLoading(false);
    },
    [supabase]
  );

  useEffect(() => {
    fetchTickets();
    const channel = supabase
      .channel("realtime-dashboard-inbox")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "SupportTicket" },
        (payload) => {
          fetchTickets(true);
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
      setTickets((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
      );
      const { error } = await supabase
        .from("SupportTicket")
        .update({ status: newStatus })
        .eq("id", id);
      if (error) {
        toast.error("Gagal mengubah status!");
        fetchTickets(true);
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
          <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
            Baru
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge className="h-5 px-1.5 text-[10px] bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-500">
            Proses
          </Badge>
        );
      case "CLOSED":
        return (
          <Badge
            variant="outline"
            className="h-5 px-1.5 text-[10px] text-green-600 border-green-200 dark:border-green-800 dark:text-green-500"
          >
            Selesai
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900">
      {/* HEADER */}
      <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Inbox className="w-5 h-5 text-blue-600" /> Inbox Terbaru
        </h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-2 text-muted-foreground hover:text-primary rounded-full text-xs"
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
                group relative p-4 transition-all cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50
                ${
                  ticket.status === "OPEN"
                    ? "bg-blue-50/30 dark:bg-blue-900/5"
                    : ""
                }
              `}
              onClick={() => router.push(`/admin/inbox/${ticket.id}`)}
            >
              {/* --- BARIS ATAS: User Info & Actions --- */}
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 min-w-[2.5rem] border border-zinc-200 dark:border-zinc-700 shrink-0">
                  <AvatarImage
                    src={ticket.User?.avatar || ""}
                    className="object-cover w-full h-full"
                  />

                  <AvatarFallback className="flex items-center justify-center text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100 w-full h-full">
                    {(ticket.User?.name
                      ? ticket.User.name.substring(0, 2)
                      : ticket.email.substring(0, 2)
                    ).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span
                        className={`text-sm font-semibold truncate ${
                          ticket.status === "OPEN"
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-foreground"
                        }`}
                      >
                        {ticket.User?.name || ticket.email}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        {ticket.email}
                      </span>
                    </div>

                    {/* --- ACTION BUTTONS (POJOK KANAN ATAS) --- */}
                    <div
                      className="flex items-center gap-1 pl-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Badge Status */}
                      <div className="mr-2">
                        {getStatusBadge(ticket.status)}
                      </div>

                      {/* Dropdown Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full text-muted-foreground hover:bg-zinc-200 dark:hover:bg-zinc-700"
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
                            onClick={() =>
                              updateStatus(ticket.id, "IN_PROGRESS")
                            }
                          >
                            <Clock className="mr-2 h-4 w-4 text-yellow-500" />{" "}
                            Tandai Proses
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateStatus(ticket.id, "CLOSED")}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />{" "}
                            Tandai Selesai
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* --- BARIS BAWAH: Subject & Message --- */}
                  <div className="mt-2 pr-2">
                    <p className="text-sm font-medium text-foreground leading-tight line-clamp-1 mb-0.5">
                      {ticket.subject}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">
                      {ticket.message}
                    </p>
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground/70">
                      <Calendar className="w-3 h-3" />
                      {new Date(ticket.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FOOTER */}
      <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900">
        <Button
          variant="outline"
          className="w-full rounded-full text-xs h-9 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          onClick={() => router.push("/admin/inbox")}
        >
          Lihat Semua Inbox
        </Button>
      </div>
    </div>
  );
}
