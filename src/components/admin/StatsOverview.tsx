"use client";

import { useCallback, useEffect, useState } from "react";
import {
  MessageCircle,
  AlertCircle,
  ThumbsUp,
  Users,
  ArrowUpRight,
  Activity,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

export function StatsOverview() {
  const [stats, setStats] = useState({
    totalChat: 0,
    adminRequests: 0,
    satisfactionRate: 0,
    visitors: 0,
    registeredUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [supabase] = useState(() => createClient());

  const fetchStats = useCallback(async () => {
    const { count: totalChat } = await supabase
      .from("Chat")
      .select("*", { count: "exact", head: true });

    const { count: adminRequests } = await supabase
      .from("Ticket")
      .select("*", { count: "exact", head: true })
      .eq("status", "BARU");

    const { count: registeredUsers } = await supabase
      .from("User")
      .select("*", { count: "exact", head: true });

    setStats({
      totalChat: totalChat || 0,
      adminRequests: adminRequests || 0,
      satisfactionRate: 98, // Hardcoded simulasi
      visitors: 1205,
      registeredUsers: registeredUsers || 0,
    });
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const t = setTimeout(() => {
      void fetchStats();
    }, 0);

    return () => clearTimeout(t);
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-xl bg-card border border-border/50"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* CARD 1: TOTAL CHAT */}
      <div className="rounded-xl border bg-card text-card-foreground p-6 shadow-sm hover:border-primary/50 transition-colors">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <span className="text-sm font-medium text-muted-foreground">
            Total Percakapan
          </span>
          <MessageCircle className="h-4 w-4 text-primary" />
        </div>
        <div className="text-2xl font-bold">{stats.totalChat}</div>
        <div className="flex items-center text-xs text-muted-foreground mt-1">
          <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
          +12% bulan ini
        </div>
      </div>

      {/* CARD 2: BUTUH BANTUAN (Bisa Diklik ke Inbox) */}
      <Link href="/admin/inbox" className="block group">
        <div
          className={`rounded-xl border p-6 shadow-sm transition-all cursor-pointer ${
            stats.adminRequests > 0
              ? "bg-red-500/10 border-red-500/50 hover:bg-red-500/20"
              : "bg-card hover:border-primary/50"
          }`}
        >
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span
              className={`text-sm font-medium ${
                stats.adminRequests > 0
                  ? "text-red-500"
                  : "text-muted-foreground"
              }`}
            >
              Tiket Pending
            </span>
            <AlertCircle
              className={`h-4 w-4 ${
                stats.adminRequests > 0
                  ? "text-red-500"
                  : "text-muted-foreground"
              }`}
            />
          </div>
          <div
            className={`text-2xl font-bold ${
              stats.adminRequests > 0 ? "text-red-500" : "text-foreground"
            }`}
          >
            {stats.adminRequests}
          </div>
          <p className="text-xs text-muted-foreground mt-1 group-hover:underline">
            {stats.adminRequests > 0
              ? "Klik untuk proses segera"
              : "Semua aman terkendali"}
          </p>
        </div>
      </Link>

      {/* CARD 3: KEPUASAN */}
      <div className="rounded-xl border bg-card text-card-foreground p-6 shadow-sm hover:border-primary/50 transition-colors">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <span className="text-sm font-medium text-muted-foreground">
            Satisfaction Rate
          </span>
          <ThumbsUp className="h-4 w-4 text-green-500" />
        </div>
        <div className="text-2xl font-bold text-green-500">
          {stats.satisfactionRate}%
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Berdasarkan feedback
        </p>
      </div>

      {/* CARD 4: USER BASE */}
      <div className="rounded-xl border bg-card text-card-foreground p-6 shadow-sm hover:border-primary/50 transition-colors">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <span className="text-sm font-medium text-muted-foreground">
            Total User
          </span>
          <Activity className="h-4 w-4 text-blue-500" />
        </div>
        <div className="text-2xl font-bold">{stats.registeredUsers}</div>
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          <Users className="w-3 h-3" /> Akun terdaftar
        </p>
      </div>
    </div>
  );
}
