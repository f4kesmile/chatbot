"use client";

import { useCallback, useEffect, useState } from "react";
import {
  MessageCircle,
  AlertCircle,
  CheckCircle2,
  Users,
  Activity,
  ArrowUpRight,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

export function StatsOverview() {
  const [stats, setStats] = useState({
    totalTickets: 0,
    pendingTickets: 0,
    resolutionRate: 0,
    resolvedTickets: 0,
    totalReplies: 0,
  });
  const [loading, setLoading] = useState(true);
  const [supabase] = useState(() => createClient());

  const fetchStats = useCallback(async () => {
    try {
      // 1. Hitung Total Tiket Masuk (Tabel: SupportTicket)
      const { count: totalTickets } = await supabase
        .from("SupportTicket")
        .select("*", { count: "exact", head: true });

      // 2. Hitung Tiket Pending (Status: OPEN atau IN_PROGRESS)
      const { count: pending } = await supabase
        .from("SupportTicket")
        .select("*", { count: "exact", head: true })
        .neq("status", "CLOSED"); // Ambil yang BUKAN closed

      // 3. Hitung Tiket Selesai (Status: CLOSED)
      const { count: resolved } = await supabase
        .from("SupportTicket")
        .select("*", { count: "exact", head: true })
        .eq("status", "CLOSED");

      // 4. Hitung Total Aktivitas Chat (Tabel: TicketReply)
      // Ini menggantikan "Total User" jika tabel User belum siap,
      // atau bisa diganti ke tabel User jika mau.
      const { count: replies } = await supabase
        .from("TicketReply")
        .select("*", { count: "exact", head: true });

      // Kalkulasi Persentase Penyelesaian
      const total = totalTickets || 0;
      const rate = total > 0 ? Math.round(((resolved || 0) / total) * 100) : 0;

      setStats({
        totalTickets: total,
        pendingTickets: pending || 0,
        resolutionRate: rate,
        resolvedTickets: resolved || 0,
        totalReplies: replies || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Realtime Subscription agar angka berubah tanpa refresh
  useEffect(() => {
    fetchStats();

    // Subscribe ke perubahan tabel SupportTicket & TicketReply
    const channel = supabase
      .channel("admin-stats-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "SupportTicket" },
        () => fetchStats()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "TicketReply" },
        () => fetchStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStats, supabase]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-3xl bg-zinc-100 dark:bg-zinc-800 border border-transparent"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* CARD 1: TOTAL TIKET */}
      <div className="rounded-3xl border bg-card text-card-foreground p-6 shadow-sm">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <span className="text-sm font-medium text-muted-foreground">
            Total Tiket Masuk
          </span>
          <MessageCircle className="h-4 w-4 text-blue-500" />
        </div>
        <div className="text-2xl font-bold">{stats.totalTickets}</div>
        <p className="text-xs text-muted-foreground mt-1 flex items-center">
          <Activity className="mr-1 h-3 w-3" /> Tiket tercatat sistem
        </p>
      </div>

      {/* CARD 2: TIKET PENDING (Urgent) */}
      <Link href="/admin/inbox" className="block group">
        <div
          className={`rounded-3xl border p-6 shadow-sm transition-all cursor-pointer ${
            stats.pendingTickets > 0
              ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900 hover:bg-red-100 dark:hover:bg-red-900/30"
              : "bg-card hover:border-blue-500/50"
          }`}
        >
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span
              className={`text-sm font-bold ${
                stats.pendingTickets > 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-muted-foreground"
              }`}
            >
              Perlu Tindakan
            </span>
            <AlertCircle
              className={`h-4 w-4 ${
                stats.pendingTickets > 0
                  ? "text-red-500"
                  : "text-muted-foreground"
              }`}
            />
          </div>
          <div
            className={`text-2xl font-bold ${
              stats.pendingTickets > 0
                ? "text-red-600 dark:text-red-400"
                : "text-foreground"
            }`}
          >
            {stats.pendingTickets}
          </div>
          <p className="text-xs text-muted-foreground mt-1 group-hover:underline">
            {stats.pendingTickets > 0
              ? "Tiket menunggu respon Anda"
              : "Semua aman terkendali"}
          </p>
        </div>
      </Link>

      {/* CARD 3: RESOLUTION RATE */}
      <div className="rounded-3xl border bg-card text-card-foreground p-6 shadow-sm">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <span className="text-sm font-medium text-muted-foreground">
            Tingkat Penyelesaian
          </span>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </div>
        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
          {stats.resolutionRate}%
        </div>
        <div className="text-xs text-muted-foreground mt-1 flex items-center">
          <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
          {stats.resolvedTickets} Tiket Selesai
        </div>
      </div>

      {/* CARD 4: TOTAL AKTIVITAS CHAT */}
      <div className="rounded-3xl border bg-card text-card-foreground p-6 shadow-sm">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <span className="text-sm font-medium text-muted-foreground">
            Total Balasan Chat
          </span>
          <Users className="h-4 w-4 text-purple-500" />
        </div>
        <div className="text-2xl font-bold">{stats.totalReplies}</div>
        <p className="text-xs text-muted-foreground mt-1">
          Interaksi User & Admin
        </p>
      </div>
    </div>
  );
}
