"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MoreHorizontal,
  RefreshCw,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner"; // <--- IMPORT SONNER

interface Ticket {
  id: string;
  category: string;
  summary: string | null;
  status: "BARU" | "DIPROSES" | "SELESAI";
  createdAt: string;
  user: {
    email: string;
  };
}

export function AdminInbox() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchTickets();
  }, []);

  async function fetchTickets() {
    setLoading(true);
    const { data, error } = await supabase
      .from("Ticket")
      .select(
        `
        id, category, summary, status, createdAt,
        user:User(email)
      `
      )
      .order("createdAt", { ascending: false });

    if (!error && data) {
      const formattedData = data.map((t: any) => ({
        ...t,
        user: t.user || { email: "Unknown" },
      }));
      setTickets(formattedData);
    }
    setLoading(false);
  }

  async function updateStatus(id: string, newStatus: string) {
    // Simpan data lama untuk revert jika gagal
    const previousTickets = [...tickets];

    // Optimistic Update
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus as any } : t))
    );

    // Toast Info
    toast.info("Mengupdate status...", { duration: 1000 });

    const { error } = await supabase
      .from("Ticket")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      toast.error("Gagal mengubah status!");
      setTickets(previousTickets); // Kembalikan ke state awal
    } else {
      toast.success(`Tiket ditandai ${newStatus}`);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "BARU":
        return (
          <Badge variant="destructive" className="gap-1 px-2">
            <AlertCircle className="h-3 w-3" /> Baru
          </Badge>
        );
      case "DIPROSES":
        return (
          <Badge
            variant="secondary"
            className="gap-1 bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border border-yellow-500/20"
          >
            <Clock className="h-3 w-3" /> Proses
          </Badge>
        );
      case "SELESAI":
        return (
          <Badge
            variant="outline"
            className="gap-1 text-green-600 border-green-600/30 bg-green-500/5"
          >
            <CheckCircle2 className="h-3 w-3" /> Selesai
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* HEADER */}
      <div className="p-4 border-b border-border flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-lg">Inbox Bantuan</h3>
          {!loading && tickets.length > 0 && (
            <Badge
              variant="secondary"
              className="rounded-full px-2 h-5 text-xs"
            >
              {tickets.length}
            </Badge>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-2 text-muted-foreground hover:text-primary"
          onClick={() => {
            fetchTickets();
            toast.success("Data di-refresh");
          }}
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* LIST AREA */}
      <div className="flex-1 overflow-y-auto divide-y divide-border">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mb-2" />
            <span className="text-xs">Memuat data...</span>
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
            <div className="h-12 w-12 rounded-full bg-muted/20 flex items-center justify-center mb-3">
              <CheckCircle2 className="h-6 w-6 opacity-50" />
            </div>
            <p className="text-sm">Semua aman, tidak ada tiket baru.</p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-muted/5 transition-colors gap-4 group"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-primary">
                    {ticket.user.email}
                  </span>
                  {getStatusBadge(ticket.status)}
                  <span className="text-[10px] text-muted-foreground">
                    • {new Date(ticket.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-sm text-foreground/90 leading-snug">
                  {ticket.summary || ticket.category}
                </p>

                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="text-[10px] py-0 h-5 border-dashed text-muted-foreground"
                  >
                    {ticket.category}
                  </Badge>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => updateStatus(ticket.id, "BARU")}
                  >
                    Tandai Baru
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => updateStatus(ticket.id, "DIPROSES")}
                  >
                    Tandai Sedang Proses
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => updateStatus(ticket.id, "SELESAI")}
                  >
                    Tandai Selesai
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
