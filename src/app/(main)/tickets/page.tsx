"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import {
  Loader2,
  MessageCircle,
  Send,
  Plus,
  ChevronLeft,
  RefreshCw,
  MoreVertical,
  Mail,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

// --- TIPE DATA ---
interface Reply {
  id: string;
  ticketId?: string;
  sender: "USER" | "ADMIN";
  senderName?: string;
  senderAvatar?: string | null;
  message: string;
  createdAt: string;
}

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: "OPEN" | "IN_PROGRESS" | "CLOSED";
  createdAt: string;
  updatedAt: string;
  replies?: Reply[];
  isReadByUser: boolean;
}

export default function TicketDashboardPage() {
  const [supabase] = useState(() => createClient());
  const router = useRouter();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [replyMsg, setReplyMsg] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // --- FETCH TICKETS (MANUAL JOIN) ---
  const fetchTickets = useCallback(
    async (showToast = false) => {
      setIsRefreshing(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      try {
        // 1. Ambil Tiket
        const { data: ticketsData, error: ticketError } = await supabase
          .from("SupportTicket")
          .select("*")
          .eq("userId", user.id)
          .order("updatedAt", { ascending: false });

        if (ticketError) throw ticketError;

        if (!ticketsData || ticketsData.length === 0) {
          setTickets([]);
          setLoadingList(false);
          setIsRefreshing(false);
          return;
        }

        // 2. Ambil Reply (TERMASUK senderName & senderAvatar)
        const ticketIds = ticketsData.map((t) => t.id);
        const { data: repliesData, error: replyError } = await supabase
          .from("TicketReply")
          .select(
            "id, ticketId, message, sender, senderName, senderAvatar, createdAt"
          ) // <--- Ambil Avatar
          .in("ticketId", ticketIds)
          .order("createdAt", { ascending: true });

        if (replyError) throw replyError;

        // 3. Mapping
        const formatted = ticketsData.map((ticket) => {
          const ticketReplies =
            repliesData?.filter((r) => r.ticketId === ticket.id) || [];
          return { ...ticket, replies: ticketReplies };
        });

        setTickets(formatted as Ticket[]);
        if (showToast) toast.success("Data diperbarui");
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingList(false);
        setIsRefreshing(false);
      }
    },
    [supabase]
  );

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Auto Scroll Bawah
  useEffect(() => {
    if (selectedTicket) {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedTicket?.replies, selectedTicket]);

  // --- ACTIONS ---

  const toggleReadStatus = async (
    e: React.MouseEvent,
    ticket: Ticket,
    status: boolean
  ) => {
    e.stopPropagation();
    setTickets((prev) =>
      prev.map((t) => (t.id === ticket.id ? { ...t, isReadByUser: status } : t))
    );
    await fetch(`/api/support/${ticket.id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isReadByUser: status }),
    });
    toast.success(status ? "Ditandai sudah dibaca" : "Ditandai belum dibaca");
  };

  const openTicket = async (ticket: Ticket) => {
    setSelectedTicket(ticket);

    // Auto Read saat dibuka
    if (!ticket.isReadByUser) {
      setTickets((prev) =>
        prev.map((t) => (t.id === ticket.id ? { ...t, isReadByUser: true } : t))
      );
      fetch(`/api/support/${ticket.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isReadByUser: true }),
      });
    }

    setChatLoading(true);
    try {
      const res = await fetch(`/api/support/${ticket.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedTicket(data);
        // Sync local list
        setTickets((prev) =>
          prev.map((t) =>
            t.id === ticket.id
              ? { ...t, isReadByUser: true, replies: data.replies }
              : t
          )
        );
      }
    } catch (e) {
      toast.error("Gagal sinkronisasi chat.");
    } finally {
      setChatLoading(false);
    }
  };

  const handleReply = async () => {
    if (!replyMsg.trim() || !selectedTicket) return;
    setIsSendingReply(true);
    try {
      const res = await fetch(`/api/support/${selectedTicket.id}`, {
        method: "POST",
        body: JSON.stringify({ message: replyMsg, senderRole: "USER" }),
      });

      if (res.ok) {
        const newReply = await res.json();
        setSelectedTicket((prev) =>
          prev
            ? { ...prev, replies: [...(prev.replies || []), newReply] }
            : null
        );
        setReplyMsg("");

        // Update List (Naikkan ke atas)
        setTickets((prev) => {
          const updated = prev.map((t) =>
            t.id === selectedTicket.id
              ? {
                  ...t,
                  updatedAt: new Date().toISOString(),
                  replies: [...(t.replies || []), newReply],
                }
              : t
          );
          return updated.sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        });
      }
    } catch (e) {
      toast.error("Gagal kirim pesan.");
    } finally {
      setIsSendingReply(false);
    }
  };

  const getLastMessagePreview = (ticket: Ticket) => {
    if (ticket.replies && ticket.replies.length > 0) {
      const last = ticket.replies[ticket.replies.length - 1];
      const sender =
        last.sender === "USER" ? "Anda" : last.senderName || "Admin";
      return `${sender}: ${last.message}`;
    }
    return ticket.message;
  };

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
    setReplyMsg(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return (
          <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
            Baru
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge
            variant="secondary"
            className="h-5 px-1.5 text-[10px] bg-yellow-100 text-yellow-700"
          >
            Proses
          </Badge>
        );
      case "CLOSED":
        return (
          <Badge
            variant="outline"
            className="h-5 px-1.5 text-[10px] text-green-600 border-green-600 bg-green-50"
          >
            Selesai
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] w-full bg-zinc-50 dark:bg-zinc-950 flex overflow-hidden">
      {/* --- SIDEBAR LIST TIKET --- */}
      <div
        className={`w-full md:w-[320px] lg:w-[380px] flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 z-10 ${
          selectedTicket ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col gap-4 bg-zinc-50/50 dark:bg-zinc-900">
          <Button
            variant="ghost"
            onClick={() => router.push("/support")}
            className="self-start gap-2 -ml-2 text-muted-foreground hover:text-primary"
          >
            <ChevronLeft size={18} /> Menu Utama
          </Button>
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-lg">Tiket Saya</h2>
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => fetchTickets(true)}
                className="h-8 w-8 rounded-full"
              >
                <RefreshCw
                  size={16}
                  className={isRefreshing ? "animate-spin" : ""}
                />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => router.push("/support")}
                className="h-8 w-8 rounded-full"
                title="Buat Baru"
              >
                <Plus size={16} />
              </Button>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 px-3 py-2">
          {tickets.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              Belum ada tiket.
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => openTicket(ticket)}
                  className={`
                    p-4 rounded-xl cursor-pointer transition-all flex flex-col gap-1 group relative
                    ${
                      selectedTicket?.id === ticket.id
                        ? "bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 shadow-sm"
                        : !ticket.isReadByUser
                        ? "bg-white border-zinc-300 shadow-md ring-1 ring-blue-50/50"
                        : "bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 hover:border-blue-200 opacity-90"
                    }
                  `}
                >
                  <div className="flex justify-between items-start">
                    <h4
                      className={`text-sm truncate pr-2 ${
                        !ticket.isReadByUser
                          ? "font-bold text-black"
                          : "font-semibold text-zinc-700"
                      }`}
                    >
                      {ticket.subject}
                    </h4>
                    {getStatusBadge(ticket.status)}
                  </div>
                  <div className="flex justify-between items-end mt-1">
                    <p
                      className={`text-xs line-clamp-1 ${
                        !ticket.isReadByUser
                          ? "text-zinc-900 font-bold"
                          : "text-muted-foreground"
                      }`}
                    >
                      {getLastMessagePreview(ticket)}
                    </p>
                    {!ticket.isReadByUser && (
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 ml-2 animate-pulse"></div>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 block">
                    {formatDate(ticket.updatedAt)}
                  </span>

                  {/* Context Menu Toggle Read */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) =>
                            toggleReadStatus(e, ticket, !ticket.isReadByUser)
                          }
                        >
                          {ticket.isReadByUser ? (
                            <>
                              <Mail className="w-3 h-3 mr-2" /> Tandai Belum
                              Dibaca
                            </>
                          ) : (
                            <>
                              <Check className="w-3 h-3 mr-2" /> Tandai Sudah
                              Dibaca
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* --- CHAT CONTENT --- */}
      <div
        className={`flex-1 flex flex-col bg-zinc-50/50 dark:bg-zinc-950/50 ${
          !selectedTicket
            ? "hidden md:flex"
            : "flex fixed inset-0 md:static z-20 bg-background md:bg-transparent"
        }`}
      >
        {!selectedTicket ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <MessageCircle className="w-12 h-12 opacity-20 mb-4" />
            <p>Pilih tiket untuk melihat percakapan</p>
          </div>
        ) : (
          <div className="flex flex-col h-full bg-white dark:bg-zinc-900 md:bg-transparent">
            {/* Header */}
            <div className="h-16 px-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-3 shadow-sm z-10">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setSelectedTicket(null)}
              >
                <ChevronLeft />
              </Button>
              <div className="min-w-0">
                <h3 className="font-bold truncate text-base">
                  {selectedTicket.subject}
                </h3>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <span>#{selectedTicket.id.slice(-5)}</span>
                  <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
                  {getStatusBadge(selectedTicket.status)}
                </div>
              </div>
            </div>

            {/* Chat Area */}
            <ScrollArea className="flex-1 p-4 md:p-8 bg-zinc-50/30 dark:bg-zinc-950/30">
              <div className="max-w-3xl mx-auto flex flex-col gap-6">
                {/* Bubble Tiket Awal */}
                <div className="flex flex-col items-end gap-1">
                  <div className="bg-blue-600 text-white p-4 rounded-2xl rounded-tr-none shadow-sm max-w-[85%] text-sm">
                    <p className="font-semibold text-xs opacity-70 mb-1 border-b border-blue-400/30 pb-1">
                      Tiket Awal
                    </p>
                    {selectedTicket.message}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDate(selectedTicket.createdAt)}
                  </span>
                </div>

                {/* Bubble Balasan */}
                {chatLoading ? (
                  <div className="flex justify-center">
                    <Loader2 className="animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  selectedTicket.replies?.map((r) => (
                    <div
                      key={r.id}
                      className={`flex gap-3 ${
                        r.sender === "USER" ? "flex-row-reverse" : ""
                      }`}
                    >
                      <Avatar
                        className={`w-8 h-8 ${
                          r.sender === "USER" ? "bg-blue-600 text-white" : ""
                        }`}
                      >
                        <AvatarImage
                          src={r.senderAvatar || ""}
                          className="object-cover"
                        />
                        <AvatarFallback>
                          {r.sender === "USER" ? "ME" : "AD"}
                        </AvatarFallback>
                      </Avatar>

                      <div
                        className={`flex flex-col gap-1 max-w-[85%] ${
                          r.sender === "USER" ? "items-end" : "items-start"
                        }`}
                      >
                        <div
                          className={`p-3 rounded-2xl text-sm shadow-sm ${
                            r.sender === "USER"
                              ? "bg-blue-600 text-white rounded-tr-none"
                              : "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-tl-none"
                          }`}
                        >
                          {/* FITUR: TAMPILKAN NAMA PENGIRIM DINAMIS */}
                          {r.sender === "ADMIN" && (
                            <p className="text-[10px] font-bold text-blue-600 mb-1">
                              {r.senderName || "Admin Support"}
                            </p>
                          )}
                          {r.message}
                        </div>
                        <span className="text-[10px] text-muted-foreground mx-1">
                          {new Date(r.createdAt).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
              <div className="max-w-3xl mx-auto">
                <div className="flex items-end gap-2 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all shadow-sm">
                  <Textarea
                    placeholder={
                      selectedTicket.status === "CLOSED"
                        ? "Tiket telah ditutup."
                        : "Tulis balasan..."
                    }
                    value={replyMsg}
                    onChange={adjustTextareaHeight}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleReply();
                      }
                    }}
                    disabled={
                      selectedTicket.status === "CLOSED" || isSendingReply
                    }
                    className="flex-1 min-h-[44px] max-h-[150px] w-full border-none shadow-none focus-visible:ring-0 bg-transparent resize-none py-3 px-2 text-sm leading-relaxed"
                  />
                  <Button
                    size="icon"
                    onClick={handleReply}
                    disabled={
                      !replyMsg.trim() ||
                      selectedTicket.status === "CLOSED" ||
                      isSendingReply
                    }
                    className={`mb-1 shrink-0 h-9 w-9 rounded-lg transition-all flex items-center justify-center ${
                      !replyMsg.trim() || isSendingReply
                        ? "bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                    }`}
                  >
                    {isSendingReply ? (
                      <Loader2 className="animate-spin w-4 h-4" />
                    ) : (
                      <Send size={18} className="ml-0.5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
