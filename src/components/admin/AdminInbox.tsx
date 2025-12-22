import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, AlertCircle } from "lucide-react";

// Interface agar strict type
interface Ticket {
  id: string;
  user: string;
  category: string;
  summary: string;
  status: "BARU" | "DIPROSES" | "SELESAI";
  time: string;
}

interface AdminInboxProps {
  tickets: Ticket[];
}

export function AdminInbox({ tickets }: AdminInboxProps) {
  // Helper untuk warna badge status
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
          <Badge variant="secondary" className="gap-1">
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
          <Badge variant="secondary" className="rounded-full px-2">
            {tickets.length}
          </Badge>
        </h3>
        <Button variant="ghost" size="sm" className="h-8 text-xs">
          Lihat Semua
        </Button>
      </div>

      <div className="divide-y overflow-y-auto flex-1">
        {tickets.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Tidak ada tiket baru.
          </div>
        ) : (
          tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <div className="flex gap-4 items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{ticket.user}</span>
                    {getStatusBadge(ticket.status)}
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {ticket.time}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80 font-medium">
                    {ticket.summary}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Kategori: {ticket.category}
                  </p>
                </div>
              </div>
              <Button size="sm" variant="secondary">
                Detail
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
