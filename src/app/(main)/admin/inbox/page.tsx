"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Search,
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Mail,
  RefreshCw,
  Trash2,
  Send,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

// --- IMPORT ALERT DIALOG ---
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Reply {
  id: string;
  ticketId?: string;
  sender: "ADMIN" | "USER";
  senderName?: string;
  senderAvatar?: string | null;
  message: string;
  createdAt: string;
}

interface SupportTicket {
  id: string;
  email: string;
  subject: string;
  message: string;
  status: "OPEN" | "IN_PROGRESS" | "CLOSED";
  createdAt: string;
  updatedAt: string;
  userId?: string | null;
  replies?: Reply[];
  isReadByAdmin: boolean;
}

type StatusFilter = "ALL" | SupportTicket["status"];

export default function AdminInboxPage() {
  const [supabase] = useState(() => createClient());
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(
    null
  );
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // --- STATE UNTUK DELETE DIALOG ---
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);
  const [isDeletingTicket, setIsDeletingTicket] = useState(false);

  // --- FETCH ---
  const fetchTickets = useCallback(
    async (opts?: { toastOnSuccess?: boolean }) => {
      setLoading(true);

      const { data: ticketsData, error: ticketError } = await supabase
        .from("SupportTicket")
        .select("*")
        .order("updatedAt", { ascending: false });

      if (ticketError) {
        toast.error("Gagal memuat inbox");
        setLoading(false);
        return;
      }

      if (!ticketsData || ticketsData.length === 0) {
        setTickets([]);
        setLoading(false);
        return;
      }

      const ticketIds = ticketsData.map((t) => t.id);

      const { data: repliesData } = await supabase
        .from("TicketReply")
        .select(
          "id, ticketId, message, sender, senderName, senderAvatar, createdAt"
        )
        .in("ticketId", ticketIds)
        .order("createdAt", { ascending: true });

      const formatted = ticketsData.map((ticket: any) => {
        const myReplies =
          repliesData?.filter((r: any) => r.ticketId === ticket.id) || [];
        return { ...ticket, replies: myReplies };
      });

      setTickets(formatted as SupportTicket[]);
      if (opts?.toastOnSuccess) toast.success("Inbox diperbarui");

      setLoading(false);
      setIsRefreshing(false);
    },
    [supabase]
  );

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // --- ACTIONS ---
  const toggleReadStatus = async (ticket: SupportTicket, status: boolean) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticket.id ? { ...t, isReadByAdmin: status } : t
      )
    );
    await fetch(`/api/support/${ticket.id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isReadByAdmin: status }),
    });
    toast.success(status ? "Ditandai sudah dibaca" : "Ditandai belum dibaca");
  };

  const updateStatus = async (
    id: string,
    newStatus: SupportTicket["status"]
  ) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );
    if (selectedTicket?.id === id)
      setSelectedTicket((prev) =>
        prev ? { ...prev, status: newStatus } : null
      );
    await fetch(`/api/support/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: newStatus }),
    });
    toast.success(`Status tiket diubah: ${newStatus}`);
  };

  // --- REFACTOR: EKSEKUSI HAPUS SETELAH KONFIRMASI ---
  const executeDeleteTicket = async () => {
    if (!ticketToDelete) return;

    setIsDeletingTicket(true);
    // Optimistic Update
    setTickets((prev) => prev.filter((t) => t.id !== ticketToDelete));

    // Jika tiket yang dihapus sedang dibuka di Sheet, tutup sheetnya
    if (selectedTicket?.id === ticketToDelete) setIsSheetOpen(false);

    const { error } = await supabase
      .from("SupportTicket")
      .delete()
      .eq("id", ticketToDelete);

    if (error) {
      toast.error("Gagal menghapus tiket dari database");
      fetchTickets(); // Refresh jika gagal agar data kembali
    } else {
      toast.success("Tiket dihapus.");
    }

    setIsDeletingTicket(false);
    setTicketToDelete(null);
  };

  const openChat = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setIsSheetOpen(true);

    if (!ticket.isReadByAdmin) toggleReadStatus(ticket, true);

    const res = await fetch(`/api/support/${ticket.id}`);
    if (res.ok) {
      const data = await res.json();
      setSelectedTicket(data);
    }
  };

  const sendReply = async () => {
    if (!replyMessage.trim() || !selectedTicket) return;
    setIsSending(true);
    try {
      const res = await fetch(`/api/support/${selectedTicket.id}`, {
        method: "POST",
        body: JSON.stringify({ message: replyMessage, senderRole: "ADMIN" }),
      });

      if (res.ok) {
        const newReply = await res.json();
        setSelectedTicket((prev) =>
          prev
            ? {
                ...prev,
                replies: [...(prev.replies || []), newReply],
                status: "IN_PROGRESS",
              }
            : null
        );
        setReplyMessage("");
        fetchTickets();
      }
    } catch (e) {
      toast.error("Gagal kirim.");
    } finally {
      setIsSending(false);
    }
  };

  const getLastMessagePreview = (ticket: SupportTicket) => {
    if (ticket.replies && ticket.replies.length > 0) {
      const last = ticket.replies[ticket.replies.length - 1];
      const sender =
        last.sender === "ADMIN" ? "Anda" : last.senderName || "User";
      return `${sender}: ${last.message}`;
    }
    return ticket.message;
  };

  const filteredTickets = tickets.filter((t) => {
    const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
    const matchSearch =
      t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const adjustTextareaHeight = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const getStatusBadge = (status: SupportTicket["status"]) => {
    switch (status) {
      case "OPEN":
        return (
          <Badge variant="destructive" className="gap-1 rounded-full px-2">
            <AlertCircle className="w-3 h-3" /> Baru
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge
            variant="secondary"
            className="gap-1 bg-yellow-100 text-yellow-700 rounded-full px-2"
          >
            <Clock className="w-3 h-3" /> Diproses
          </Badge>
        );
      case "CLOSED":
        return (
          <Badge
            variant="outline"
            className="gap-1 text-green-600 bg-green-50 border-green-200 rounded-full px-2"
          >
            <CheckCircle2 className="w-3 h-3" /> Selesai
          </Badge>
        );
      default:
        return <Badge className="rounded-full">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col h-full p-6 space-y-6 overflow-y-auto bg-background">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inbox Support</h1>
          <p className="text-muted-foreground text-sm">
            Kelola tiket bantuan user.
          </p>
        </div>
      </div>

      {/* --- FILTER BAR --- */}
      <div className="flex items-center w-full rounded-full border bg-card shadow-sm pl-4 pr-1 h-12 transition-all focus-within:ring-2 focus-within:ring-blue-500/20">
        <Search className="w-4 h-4 text-muted-foreground shrink-0 mr-3" />
        <input
          type="text"
          placeholder="Cari tiket (email/subjek)..."
          className="flex-1 w-full bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/70 h-full py-2"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="h-6 w-px bg-border mx-2 shrink-0" />
        <div className="shrink-0">
          <Select
            value={statusFilter}
            onValueChange={(v: any) => setStatusFilter(v)}
          >
            <SelectTrigger className="w-[140px] h-10 border-none shadow-none bg-transparent hover:bg-muted/50 focus:ring-0 rounded-full px-3 text-sm font-medium justify-between">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent
              position="popper"
              align="end"
              sideOffset={5}
              className="rounded-xl min-w-[140px]"
            >
              <SelectItem value="ALL">Semua</SelectItem>
              <SelectItem value="OPEN">Baru</SelectItem>
              <SelectItem value="IN_PROGRESS">Diproses</SelectItem>
              <SelectItem value="CLOSED">Selesai</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 rounded-3xl border bg-card shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b bg-muted/5 flex justify-between items-center h-14">
          <span className="text-sm font-semibold text-muted-foreground ml-2">
            Total {filteredTickets.length} tiket
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchTickets({ toastOnSuccess: true })}
            className="gap-2 rounded-full h-8"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />{" "}
            Refresh
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-50/50 dark:bg-black/20">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-muted-foreground" />
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                className={`
                  flex flex-col md:flex-row gap-4 items-center justify-between 
                  p-4 rounded-2xl border transition-all duration-200
                  ${
                    !ticket.isReadByAdmin
                      ? "bg-white dark:bg-zinc-900 border-blue-300 dark:border-blue-900 shadow-md ring-1 ring-blue-100 dark:ring-blue-900/30"
                      : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-800 opacity-90 hover:opacity-100"
                  }
                `}
              >
                <div
                  className="flex-1 min-w-0 cursor-pointer w-full"
                  onClick={() => openChat(ticket)}
                >
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    {!ticket.isReadByAdmin && (
                      <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0 animate-pulse" />
                    )}
                    <span
                      className={`text-sm ${
                        !ticket.isReadByAdmin
                          ? "font-bold text-foreground"
                          : "font-medium text-muted-foreground"
                      }`}
                    >
                      {ticket.email}
                    </span>
                    {getStatusBadge(ticket.status)}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {formatDate(ticket.updatedAt)}
                    </span>
                  </div>
                  <h4
                    className={`text-sm truncate ${
                      !ticket.isReadByAdmin
                        ? "font-bold text-foreground"
                        : "font-medium text-foreground/90"
                    }`}
                  >
                    {ticket.subject}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    {getLastMessagePreview(ticket)}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full h-8 w-8 hover:bg-muted"
                      >
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                      <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() =>
                          toggleReadStatus(ticket, !ticket.isReadByAdmin)
                        }
                      >
                        {ticket.isReadByAdmin ? (
                          <>
                            <Mail className="w-4 h-4 mr-2" /> Tandai Belum
                            Dibaca
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-2" /> Tandai Sudah
                            Dibaca
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => updateStatus(ticket.id, "OPEN")}
                      >
                        Set: Baru
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => updateStatus(ticket.id, "IN_PROGRESS")}
                      >
                        Set: Proses
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => updateStatus(ticket.id, "CLOSED")}
                      >
                        Set: Selesai
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        // --- TRIGGER DIALOG ---
                        onClick={() => setTicketToDelete(ticket.id)}
                        className="text-red-500 focus:text-red-500"
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] flex flex-col h-full p-0 gap-0 border-l border-zinc-200 dark:border-zinc-800 sm:rounded-l-3xl shadow-2xl overflow-hidden">
          <SheetHeader className="p-6 border-b bg-muted/5">
            <div className="flex justify-between items-start mr-6">
              <div>
                <SheetTitle className="text-lg font-bold leading-tight mb-1">
                  {selectedTicket?.subject}
                </SheetTitle>
                <SheetDescription className="line-clamp-1">
                  {selectedTicket?.email}
                </SheetDescription>
              </div>
              {selectedTicket && getStatusBadge(selectedTicket.status)}
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1 p-6 bg-zinc-50/50 dark:bg-black/20">
            <div className="flex flex-col gap-6">
              {/* TIKET AWAL */}
              <div className="flex gap-3">
                <Avatar className="w-8 h-8 mt-1 border border-zinc-200 dark:border-zinc-800">
                  <AvatarFallback className="bg-zinc-200 dark:bg-zinc-800 text-xs">
                    US
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start gap-1 max-w-[85%]">
                  <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-4 rounded-3xl rounded-tl-none shadow-sm text-sm">
                    <p className="text-xs font-bold text-primary mb-1 border-b border-zinc-100 dark:border-zinc-700 pb-1">
                      Tiket Awal
                    </p>
                    {selectedTicket?.message}
                  </div>
                  <span className="text-[10px] text-muted-foreground ml-1">
                    {selectedTicket && formatDate(selectedTicket.createdAt)}
                  </span>
                </div>
              </div>

              {/* REPLIES LIST */}
              {selectedTicket?.replies?.map((r) => (
                <div
                  key={r.id}
                  className={`flex gap-3 ${
                    r.sender === "ADMIN" ? "flex-row-reverse" : ""
                  }`}
                >
                  <Avatar
                    className={`w-8 h-8 mt-1 border border-zinc-200 dark:border-zinc-700 ${
                      r.sender === "ADMIN" ? "order-1" : ""
                    }`}
                  >
                    <AvatarImage
                      src={r.senderAvatar || ""}
                      className="object-cover"
                    />
                    <AvatarFallback
                      className={
                        r.sender === "ADMIN"
                          ? "bg-blue-600 text-white text-xs"
                          : "bg-zinc-200 dark:bg-zinc-800 text-xs"
                      }
                    >
                      {r.sender === "ADMIN" ? "AD" : "US"}
                    </AvatarFallback>
                  </Avatar>

                  <div
                    className={`flex flex-col gap-1 max-w-[85%] ${
                      r.sender === "ADMIN" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`px-4 py-3 rounded-3xl text-sm shadow-sm ${
                        r.sender === "ADMIN"
                          ? "bg-blue-600 text-white rounded-tr-none"
                          : "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-tl-none"
                      }`}
                    >
                      <p
                        className={`text-[10px] font-bold mb-1 ${
                          r.sender === "ADMIN"
                            ? "text-blue-100"
                            : "text-blue-600 dark:text-blue-400"
                        }`}
                      >
                        {r.senderName ||
                          (r.sender === "ADMIN" ? "Admin" : "User")}
                      </p>
                      {r.message}
                    </div>
                    <span className="text-[10px] text-muted-foreground mx-1">
                      {formatDate(r.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* INPUT CHAT AREA */}
          <div className="p-4 bg-background border-t">
            <div className="relative flex items-end gap-2 bg-muted/50 border border-input rounded-[26px] px-2 py-2 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all shadow-sm">
              <Textarea
                value={replyMessage}
                onChange={(e) => {
                  setReplyMessage(e.target.value);
                  adjustTextareaHeight(e);
                }}
                placeholder={
                  selectedTicket?.status === "CLOSED"
                    ? "Tiket ditutup."
                    : "Ketik balasan..."
                }
                className="flex-1 min-h-[24px] max-h-[150px] w-full border-none shadow-none focus-visible:ring-0 bg-transparent resize-none py-2.5 px-3 text-sm leading-relaxed"
                rows={1}
                disabled={selectedTicket?.status === "CLOSED" || isSending}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendReply();
                  }
                }}
              />
              <Button
                size="icon"
                onClick={sendReply}
                disabled={
                  !replyMessage.trim() ||
                  isSending ||
                  selectedTicket?.status === "CLOSED"
                }
                className={`
                    mb-0.5 rounded-full h-9 w-9 shrink-0 transition-all
                    ${
                      !replyMessage.trim()
                        ? "bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600"
                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5"
                    }
                  `}
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 translate-x-0.5 translate-y-0.5" />
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* --- ALERT DIALOG --- */}
      <AlertDialog
        open={!!ticketToDelete}
        onOpenChange={(open) => !open && setTicketToDelete(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Tiket Support?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus tiket dan seluruh riwayat
              percakapannya secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeletingTicket}
              className="rounded-xl"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                executeDeleteTicket();
              }}
              disabled={isDeletingTicket}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
            >
              {isDeletingTicket ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Hapus Permanen"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
