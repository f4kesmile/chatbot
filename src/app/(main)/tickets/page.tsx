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

  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(
    null
  );

  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchTickets = useCallback(
    async (showToast = false) => {
      setIsRefreshing(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setCurrentUserAvatar(user.user_metadata?.avatar_url || null);

      try {
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

        const ticketIds = ticketsData.map((t) => t.id);
        const { data: repliesData, error: replyError } = await supabase
          .from("TicketReply")
          .select(
            "id, ticketId, message, sender, senderName, senderAvatar, createdAt"
          )
          .in("ticketId", ticketIds)
          .order("createdAt", { ascending: true });

        if (replyError) throw replyError;

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

  useEffect(() => {
    if (selectedTicket) {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedTicket?.replies, selectedTicket]);

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
          <Badge
            variant="destructive"
            className="h-5 px-2 rounded-full text-[10px]"
          >
            Baru
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge className="h-5 px-2 rounded-full text-[10px] bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/25">
            Proses
          </Badge>
        );
      case "CLOSED":
        return (
          <Badge
            variant="outline"
            className="h-5 px-2 rounded-full text-[10px] border-green-600/30 text-green-600 dark:text-green-400 bg-green-500/5"
          >
            Selesai
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] w-full bg-background flex overflow-hidden">
      {/* --- SIDEBAR LIST TIKET --- */}
      <div
        className={`w-full md:w-[360px] flex flex-col border-r bg-card z-10 ${
          selectedTicket ? "hidden md:flex" : "flex"
        }`}
      >
        {/* Header Sidebar */}
        <div className="p-4 border-b flex flex-col gap-4 bg-background/50 backdrop-blur-sm">
          <Button
            variant="ghost"
            onClick={() => router.push("/support")}
            // Hidden di mobile agar tidak tabrakan dengan hamburger
            className="self-start gap-2 -ml-2 text-muted-foreground hover:text-primary pl-2 hidden md:inline-flex"
          >
            <ChevronLeft size={18} /> Menu Utama
          </Button>
          <div className="flex justify-between items-center">
            {/* FIX: Tambahkan ml-12 di mobile agar tidak tabrakan dengan Hamburger Menu */}
            <h2 className="font-bold text-xl tracking-tight">Tiket Saya</h2>
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => fetchTickets(true)}
                className="h-9 w-9 rounded-full"
              >
                <RefreshCw
                  size={16}
                  className={isRefreshing ? "animate-spin" : ""}
                />
              </Button>
              <Button
                size="icon"
                onClick={() => router.push("/support")}
                className="h-9 w-9 rounded-full bg-primary text-primary-foreground shadow-sm hover:shadow-md transition-all"
                title="Buat Baru"
              >
                <Plus size={18} />
              </Button>
            </div>
          </div>
        </div>

        {/* List Tiket */}
        <ScrollArea className="flex-1 px-3 py-3">
          {tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
              <MessageCircle size={40} className="opacity-20" />
              <p className="text-sm">Belum ada tiket support.</p>
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => openTicket(ticket)}
                  className={`
                    group relative flex flex-col gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200
                    ${
                      selectedTicket?.id === ticket.id
                        ? "bg-primary/5 border-primary/30 shadow-sm"
                        : !ticket.isReadByUser
                        ? "bg-card border-border shadow-sm ring-1 ring-primary/20"
                        : "bg-card/50 border-border/60 hover:bg-accent/50 hover:border-border"
                    }
                  `}
                >
                  <div className="flex justify-between items-start gap-3">
                    <h4
                      className={`text-sm truncate flex-1 leading-snug ${
                        !ticket.isReadByUser
                          ? "font-bold text-foreground"
                          : "font-semibold text-muted-foreground group-hover:text-foreground/80"
                      }`}
                    >
                      {ticket.subject}
                    </h4>
                    <div className="shrink-0">
                      {getStatusBadge(ticket.status)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <p
                      className={`text-xs line-clamp-1 pr-2 ${
                        !ticket.isReadByUser
                          ? "text-foreground/90 font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      {getLastMessagePreview(ticket)}
                    </p>
                    {!ticket.isReadByUser && (
                      <span className="shrink-0 w-2 h-2 rounded-full bg-primary animate-pulse" />
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-border/30 mt-1">
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {formatDate(ticket.updatedAt)}
                    </span>

                    <div
                      className="flex items-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 transition-all hover:bg-muted"
                          >
                            <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={(e) =>
                              toggleReadStatus(e, ticket, !ticket.isReadByUser)
                            }
                          >
                            {ticket.isReadByUser ? (
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
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* --- DETAIL CHAT CONTENT --- */}
      <div
        className={`flex-1 flex flex-col bg-background
          ${
            !selectedTicket
              ? "hidden md:flex bg-muted/5"
              : "flex fixed inset-0 z-50 md:static bg-background" // z-50 agar menutupi navbar mobile
          }
        `}
      >
        {!selectedTicket ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50 gap-4">
            <div className="p-4 rounded-full bg-muted/20">
              <MessageCircle size={48} />
            </div>
            <p className="font-medium">Pilih tiket untuk melihat percakapan</p>
          </div>
        ) : (
          <div className="flex flex-col h-full bg-background md:bg-transparent">
            {/* Header Chat */}
            <div className="h-16 px-4 border-b bg-card/80 backdrop-blur-md flex items-center gap-3 shadow-sm z-10">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden -ml-2"
                onClick={() => setSelectedTicket(null)}
              >
                <ChevronLeft />
              </Button>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold truncate text-base leading-tight">
                  {selectedTicket.subject}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    #{selectedTicket.id.slice(-5)}
                  </span>
                  {getStatusBadge(selectedTicket.status)}
                </div>
              </div>
            </div>

            {/* Chat Bubble Area */}
            <ScrollArea className="flex-1 p-4 md:p-6 bg-muted/10">
              <div className="max-w-3xl mx-auto flex flex-col gap-6 pb-6">
                {/* Tiket Awal */}
                <div className="flex flex-col items-end gap-1">
                  <div className="bg-primary text-primary-foreground p-4 rounded-[20px] rounded-tr-sm shadow-md max-w-[85%] text-sm">
                    <p className="text-[10px] font-bold uppercase opacity-70 mb-2 border-b border-primary-foreground/20 pb-1 tracking-wider">
                      Tiket Awal
                    </p>
                    <p className="leading-relaxed whitespace-pre-wrap">
                      {selectedTicket.message}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground px-1">
                    {formatDate(selectedTicket.createdAt)}
                  </span>
                </div>

                {chatLoading && (
                  <div className="flex justify-center py-4">
                    <Loader2 className="animate-spin text-muted-foreground w-6 h-6" />
                  </div>
                )}

                {selectedTicket.replies?.map((r) => {
                  const isUser = r.sender === "USER";
                  return (
                    <div
                      key={r.id}
                      className={`flex gap-3 ${
                        isUser ? "flex-row-reverse" : ""
                      }`}
                    >
                      <Avatar
                        className={`w-9 h-9 border shadow-sm mt-auto ${
                          isUser ? "border-primary/20" : "border-border"
                        }`}
                      >
                        <AvatarImage
                          src={
                            isUser
                              ? currentUserAvatar || ""
                              : r.senderAvatar || ""
                          }
                          className="object-cover"
                        />
                        <AvatarFallback
                          className={
                            isUser ? "bg-primary/10 text-primary" : "bg-muted"
                          }
                        >
                          {isUser ? "ME" : "AD"}
                        </AvatarFallback>
                      </Avatar>

                      <div
                        className={`flex flex-col gap-1 max-w-[80%] ${
                          isUser ? "items-end" : "items-start"
                        }`}
                      >
                        <div
                          className={`px-4 py-3 rounded-[20px] text-sm shadow-sm leading-relaxed whitespace-pre-wrap ${
                            isUser
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-card border border-border text-card-foreground rounded-bl-sm"
                          }`}
                        >
                          {!isUser && (
                            <p className="text-[10px] font-bold text-primary mb-1 uppercase tracking-wide">
                              {r.senderName || "Admin Support"}
                            </p>
                          )}
                          {r.message}
                        </div>
                        <span className="text-[10px] text-muted-foreground px-1">
                          {new Date(r.createdAt).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            {/* Input Footer */}
            <div className="p-4 bg-background border-t">
              <div className="max-w-3xl mx-auto">
                <div className="relative flex items-end gap-2 bg-muted/40 border focus-within:border-primary/50 focus-within:bg-background focus-within:ring-2 focus-within:ring-primary/10 rounded-[24px] px-3 py-2 transition-all">
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
                    className="flex-1 min-h-[40px] max-h-[160px] w-full border-none shadow-none focus-visible:ring-0 bg-transparent resize-none py-2.5 px-2 text-sm leading-relaxed"
                    rows={1}
                  />
                  <Button
                    size="icon"
                    onClick={handleReply}
                    disabled={
                      !replyMsg.trim() ||
                      selectedTicket.status === "CLOSED" ||
                      isSendingReply
                    }
                    className={`
                      shrink-0 h-9 w-9 rounded-full transition-all mb-0.5
                      ${
                        !replyMsg.trim() && !isSendingReply
                          ? "bg-muted text-muted-foreground"
                          : "bg-primary text-primary-foreground hover:scale-105 shadow-md"
                      }
                    `}
                  >
                    {isSendingReply ? (
                      <Loader2 className="animate-spin w-4 h-4" />
                    ) : (
                      <Send
                        size={16}
                        className={replyMsg.trim() ? "translate-x-0.5" : ""}
                      />
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
