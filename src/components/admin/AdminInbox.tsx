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
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
      // Mapping data (karena join user mengembalikan object/array)
      const formattedData = data.map((t: any) => ({
        ...t,
        user: t.user || { email: "Unknown" },
      }));
      setTickets(formattedData);
    }
    setLoading(false);
  }

  async function updateStatus(id: string, newStatus: string) {
    // Optimistic Update
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus as any } : t))
    );
    // DB Update
    await supabase.from("Ticket").update({ status: newStatus }).eq("id", id);
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "BARU":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" /> Baru
          </Badge>
        );
      case "DIPROSES":
        return (
          <Badge
            variant="secondary"
            className="gap-1 bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
          >
            <Clock className="h-3 w-3" /> Proses
          </Badge>
        );
      case "SELESAI":
        return (
          <Badge
            variant="outline"
            className="gap-1 text-green-600 border-green-600"
          >
            <CheckCircle2 className="h-3 w-3" /> Selesai
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden h-full flex flex-col">
      <div className="p-4 border-b flex justify-between items-center bg-muted/20">
        <h3 className="font-semibold flex items-center gap-2">
          Inbox Bantuan
          {!loading && (
            <Badge variant="secondary" className="rounded-full px-2">
              {tickets.length}
            </Badge>
          )}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs"
          onClick={fetchTickets}
        >
          Refresh
        </Button>
      </div>

      <div className="divide-y overflow-y-auto flex-1">
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="animate-spin text-muted-foreground" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Tidak ada tiket baru.
          </div>
        ) : (
          tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{ticket.user.email}</span>
                  {getStatusBadge(ticket.status)}
                  <span className="text-[10px] text-muted-foreground ml-2">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 font-medium line-clamp-1">
                  {ticket.summary || "Tanpa ringkasan"}
                </p>
                <Badge variant="outline" className="text-[10px] py-0 h-5">
                  {ticket.category}
                </Badge>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => updateStatus(ticket.id, "BARU")}
                  >
                    Set Baru
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => updateStatus(ticket.id, "DIPROSES")}
                  >
                    Set Proses
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => updateStatus(ticket.id, "SELESAI")}
                  >
                    Set Selesai
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
