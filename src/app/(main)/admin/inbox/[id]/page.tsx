"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  ArrowLeft,
  Send,
  Loader2,
  Bot,
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Reply {
  id: string;
  sender: "ADMIN" | "USER";
  message: string;
  createdAt: string;
}

interface TicketDetail {
  id: string;
  subject: string;
  message: string;
  status: "OPEN" | "IN_PROGRESS" | "CLOSED";
  createdAt: string;
  email: string;
  User?: { name: string | null; avatar: string | null } | null;
  TicketReply?: Reply[];
}

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState("");
  const [sending, setSending] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const ticketId = params.id as string;

  const fetchTicketDetail = useCallback(async () => {
    if (!ticketId) return;

    const { data, error } = await supabase
      .from("SupportTicket")
      .select(`*, User (name, avatar), TicketReply (*)`)
      .eq("id", ticketId)
      .single();

    if (error) {
      console.error(error);
      const { data: fallbackData } = await supabase
        .from("SupportTicket")
        .select(`*, TicketReply (*)`)
        .eq("id", ticketId)
        .single();

      if (fallbackData) {
        setTicket(fallbackData as unknown as TicketDetail);
        setReplies(fallbackData.TicketReply || []);
      } else {
        toast.error("Gagal memuat tiket.");
        router.push("/admin/inbox");
      }
    } else {
      setTicket(data as unknown as TicketDetail);
      const sorted = (data.TicketReply || []).sort(
        (a: any, b: any) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setReplies(sorted);
    }
    setLoading(false);
  }, [ticketId, supabase, router]);

  const updateStatus = async (newStatus: "OPEN" | "IN_PROGRESS" | "CLOSED") => {
    if (!ticket) return;

    setTicket({ ...ticket, status: newStatus });

    const { error } = await supabase
      .from("SupportTicket")
      .update({ status: newStatus })
      .eq("id", ticketId);

    if (error) {
      toast.error("Gagal update status");
      fetchTicketDetail();
    } else {
      toast.success(`Status diubah: ${newStatus}`);
    }
  };

  useEffect(() => {
    fetchTicketDetail();
    const channel = supabase
      .channel("chat-room")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "TicketReply",
          filter: `ticketId=eq.${ticketId}`,
        },
        (payload) => setReplies((curr) => [...curr, payload.new as Reply])
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, supabase, fetchTicketDetail]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [replies, loading]);

  const handleSendReply = async () => {
    if (!replyMessage.trim()) return;
    setSending(true);
    const { error } = await supabase.from("TicketReply").insert({
      ticketId: ticketId,
      sender: "ADMIN",
      message: replyMessage,
      senderName: "Admin Support",
    });

    if (error) toast.error("Gagal kirim");
    else setReplyMessage("");
    setSending(false);
  };

  if (loading)
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <Loader2 className="animate-spin" />
      </div>
    );
  if (!ticket) return null;

  return (
    <div className="flex flex-col w-full h-full bg-background overflow-hidden relative">
      <header className="shrink-0 h-16 border-b bg-card flex items-center justify-between px-4 z-50 relative shadow-sm">
        <div className="flex items-center gap-3 overflow-hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/dashboard")}
            className="rounded-full shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="flex items-center gap-3 overflow-hidden">
            <Avatar className="h-9 w-9 min-w-[2.25rem] border shrink-0">
              <AvatarImage
                src={ticket.User?.avatar || ""}
                className="object-cover"
              />
              <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100 font-bold text-xs">
                {(ticket.User?.name
                  ? ticket.User.name.substring(0, 2)
                  : ticket.email.substring(0, 2)
                ).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <h1 className="font-bold text-sm leading-tight mb-0.5 truncate">
                {ticket.User?.name || ticket.email}
              </h1>
              <div className="flex items-center gap-2">
                <Badge
                  variant={ticket.status === "OPEN" ? "destructive" : "outline"}
                  className="text-[10px] h-4 px-1 rounded-sm"
                >
                  {ticket.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full shrink-0"
            >
              <MoreVertical className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 rounded-xl shadow-xl z-[60]"
          >
            <DropdownMenuItem onClick={() => updateStatus("OPEN")}>
              <AlertCircle className="mr-2 h-4 w-4 text-red-500" /> Tandai Baru
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateStatus("IN_PROGRESS")}>
              <Clock className="mr-2 h-4 w-4 text-yellow-500" /> Tandai Proses
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateStatus("CLOSED")}>
              <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> Tandai
              Selesai
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="flex-1 w-full overflow-y-auto bg-zinc-50/50 dark:bg-zinc-950/50 p-4 scroll-smooth">
        <div className="flex flex-col gap-4 max-w-3xl mx-auto min-h-full justify-end pb-2">
          <div className="w-full flex justify-center my-4">
            <span className="text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-500 px-3 py-1 rounded-full shadow-sm">
              {new Date(ticket.createdAt).toLocaleDateString("id-ID", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>

          <div className="flex gap-3">
            <Avatar className="h-8 w-8 mt-1 border shrink-0">
              <AvatarImage src={ticket.User?.avatar || ""} />
              <AvatarFallback className="bg-zinc-200 dark:bg-zinc-800 text-xs">
                U
              </AvatarFallback>
            </Avatar>
            <div className="max-w-[85%]">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-2xl rounded-tl-none shadow-sm">
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1.5 border-b border-dashed pb-1.5 border-zinc-100 dark:border-zinc-800">
                  {ticket.subject}
                </p>
                <p className="text-sm whitespace-pre-wrap leading-relaxed text-zinc-800 dark:text-zinc-200">
                  {ticket.message}
                </p>
              </div>
              <span className="text-[10px] text-muted-foreground ml-2 mt-1">
                {new Date(ticket.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>

          {replies.map((reply) => {
            const isAdmin = reply.sender === "ADMIN";
            return (
              <div
                key={reply.id}
                className={cn(
                  "flex gap-3",
                  isAdmin ? "flex-row-reverse" : "flex-row"
                )}
              >
                <Avatar className="h-8 w-8 mt-1 border shrink-0">
                  {isAdmin ? (
                    <AvatarFallback className="bg-blue-600 text-white">
                      <Bot size={14} />
                    </AvatarFallback>
                  ) : (
                    <>
                      <AvatarImage src={ticket.User?.avatar || ""} />
                      <AvatarFallback className="bg-zinc-200 dark:bg-zinc-800 text-xs">
                        U
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>

                <div
                  className={cn(
                    "max-w-[80%]",
                    isAdmin ? "items-end flex flex-col" : ""
                  )}
                >
                  <div
                    className={cn(
                      "p-3 rounded-2xl shadow-sm text-sm whitespace-pre-wrap leading-relaxed",
                      isAdmin
                        ? "bg-blue-600 text-white rounded-tr-none"
                        : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-tl-none text-zinc-800 dark:text-zinc-200"
                    )}
                  >
                    {reply.message}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 px-1">
                    {new Date(reply.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          })}

          <div ref={bottomRef} className="h-1" />
        </div>
      </div>

      <div className="shrink-0 bg-background border-t p-3 z-40">
        <div className="max-w-3xl mx-auto flex items-end gap-2 bg-zinc-100 dark:bg-zinc-900 p-2 rounded-[1.5rem] border border-transparent focus-within:border-zinc-300 dark:focus-within:border-zinc-700 transition-all">
          <Textarea
            placeholder="Ketik balasan..."
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            className="min-h-[40px] max-h-[120px] w-full resize-none border-none bg-transparent focus-visible:ring-0 px-3 py-2.5 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendReply();
              }
            }}
          />
          <Button
            size="icon"
            onClick={handleSendReply}
            disabled={sending || !replyMessage.trim()}
            className="rounded-full h-10 w-10 shrink-0 mb-0.5 bg-blue-600 hover:bg-blue-700 text-white transition-all active:scale-95"
          >
            {sending ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <Send className="w-5 h-5 pl-0.5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
