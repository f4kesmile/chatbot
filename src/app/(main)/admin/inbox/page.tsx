"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Search,
  Filter,
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Mail,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

interface Ticket {
  id: string;
  category: string;
  summary: string | null;
  content: string;
  status: "BARU" | "DIPROSES" | "SELESAI";
  createdAt: string;
  user: {
    email: string;
    name: string | null;
  };
}

type TicketRow = Omit<Ticket, "user"> & {
  user?: Ticket["user"] | null;
};

type StatusFilter = "ALL" | Ticket["status"];

export default function AdminInboxPage() {
  const [supabase] = useState(() => createClient());

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const isFirstLoadRef = useRef(true);

  const fetchTickets = useCallback(
    async (opts?: { toastOnSuccess?: boolean }) => {
      const toastOnSuccess = Boolean(opts?.toastOnSuccess);

      if (isFirstLoadRef.current) setLoading(true);
      else setIsRefreshing(true);

      const { data, error } = await supabase
        .from("Ticket")
        .select(
          `
          *,
          user:User(email, name)
        `
        )
        .order("createdAt", { ascending: false });

      if (!error && data) {
        const rows = data as unknown as TicketRow[];

        const formattedData: Ticket[] = rows.map((t) => ({
          ...(t as Omit<Ticket, "user">),
          user: t.user ?? { email: "Unknown User", name: "Guest" },
        }));

        setTickets(formattedData);

        if (!isFirstLoadRef.current && toastOnSuccess) {
          toast.success("Data berhasil diperbarui");
        }
      }

      setLoading(false);
      setIsRefreshing(false);
      isFirstLoadRef.current = false;
    },
    [supabase]
  );

  useEffect(() => {
    const t = setTimeout(() => {
      void fetchTickets();
    }, 0);

    return () => clearTimeout(t);
  }, [fetchTickets]);

  const updateStatus = useCallback(
    async (id: string, newStatus: Ticket["status"]) => {
      const originalTickets = [...tickets];

      // Optimistic Update
      setTickets((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
      );

      toast.info("Memperbarui status...", { duration: 1000 });

      const { error } = await supabase
        .from("Ticket")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) {
        toast.error("Gagal update status!");
        setTickets(originalTickets); // Revert jika gagal
      } else {
        toast.success(`Status diubah menjadi ${newStatus}`);
      }
    },
    [supabase, tickets]
  );

  const deleteTicket = useCallback(
    async (id: string) => {
      if (!confirm("Yakin hapus pesan ini selamanya?")) return;

      const previousTickets = [...tickets];
      setTickets((prev) => prev.filter((t) => t.id !== id));

      const { error } = await supabase.from("Ticket").delete().eq("id", id);

      if (error) {
        toast.error("Gagal menghapus pesan.");
        setTickets(previousTickets);
      } else {
        toast.success("Pesan berhasil dihapus.");
      }
    },
    [supabase, tickets]
  );

  const filteredTickets = tickets.filter((ticket) => {
    const matchStatus =
      statusFilter === "ALL" || ticket.status === statusFilter;

    const searchLower = searchQuery.toLowerCase();
    const matchSearch =
      ticket.user.email.toLowerCase().includes(searchLower) ||
      (ticket.summary && ticket.summary.toLowerCase().includes(searchLower)) ||
      ticket.content.toLowerCase().includes(searchLower);

    return matchStatus && matchSearch;
  });

  const getStatusBadge = (status: Ticket["status"]) => {
    switch (status) {
      case "BARU":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="w-3 h-3" /> Baru
          </Badge>
        );
      case "DIPROSES":
        return (
          <Badge
            variant="secondary"
            className="gap-1 bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
          >
            <Clock className="w-3 h-3" /> Proses
          </Badge>
        );
      case "SELESAI":
        return (
          <Badge
            variant="outline"
            className="gap-1 text-green-600 border-green-600/30 bg-green-500/5"
          >
            <CheckCircle2 className="w-3 h-3" /> Selesai
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col h-full p-6 space-y-6 overflow-y-auto bg-background">
      {/* HEADER PAGE */}
      {/* Theme Toggler ditaruh disini agar tidak tumpang tindih */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inbox Pesan</h1>
          <p className="text-muted-foreground text-sm">
            Daftar lengkap pertanyaan dan keluhan user.
          </p>
        </div>
        <div className="flex items-center gap-3"></div>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col md:flex-row gap-4 p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari email atau isi pesan..."
            className="pl-9 bg-transparent border-border"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full md:w-[200px]">
          <Select
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val as StatusFilter)}
          >
            <SelectTrigger className="bg-transparent border-border">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Filter className="w-4 h-4" />
                <SelectValue placeholder="Filter Status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Status</SelectItem>
              <SelectItem value="BARU">Baru</SelectItem>
              <SelectItem value="DIPROSES">Sedang Proses</SelectItem>
              <SelectItem value="SELESAI">Selesai</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* LIST TICKET */}
      <div className="flex-1 rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col">
        {/* HEADER LIST & REFRESH BUTTON */}
        {/* Disini kita sejajarkan teks 'Menampilkan' dengan tombol 'Refresh' */}
        <div className="p-4 border-b border-border bg-muted/5 flex justify-between items-center h-14">
          <span className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            Menampilkan {filteredTickets.length} pesan
          </span>

          {/* Tombol Refresh dipindah kesini agar sejajar */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchTickets({ toastOnSuccess: true })}
            className="gap-2"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Memuat..." : "Refresh"}
          </Button>
        </div>

        {/* ISI LIST */}
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
              <p>Mengambil data inbox...</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                <Mail className="w-8 h-8 opacity-50" />
              </div>
              <p>Tidak ada pesan yang cocok.</p>
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="p-4 hover:bg-muted/5 transition-colors group flex flex-col md:flex-row gap-4 items-start md:items-center justify-between"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-primary">
                      {ticket.user.email}
                    </span>
                    {getStatusBadge(ticket.status)}
                    <span className="text-xs text-muted-foreground hidden md:inline-block">
                      • {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h4 className="font-medium text-sm text-foreground">
                    {ticket.summary || "Tidak ada subjek"}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 md:line-clamp-1 max-w-2xl">
                    {ticket.content}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge
                      variant="outline"
                      className="text-[10px] h-5 px-1 border-dashed text-muted-foreground"
                    >
                      {ticket.category}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => void updateStatus(ticket.id, "BARU")}
                      >
                        <AlertCircle className="w-4 h-4 mr-2" /> Tandai Baru
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => void updateStatus(ticket.id, "DIPROSES")}
                      >
                        <Clock className="w-4 h-4 mr-2" /> Tandai Proses
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => void updateStatus(ticket.id, "SELESAI")}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" /> Tandai Selesai
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => void deleteTicket(ticket.id)}
                        className="text-red-500 focus:text-red-500"
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Hapus Pesan
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
