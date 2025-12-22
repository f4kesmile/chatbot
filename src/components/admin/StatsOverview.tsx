"use client";

import { useEffect, useState } from "react";
import {
  MessageCircle,
  AlertCircle,
  ThumbsUp,
  Users,
  ArrowUpRight,
  Activity,
  Loader2,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export function StatsOverview() {
  const [stats, setStats] = useState({
    totalChat: 0,
    adminRequests: 0,
    satisfactionRate: 0,
    visitors: 0,
    registeredUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchStats() {
      // 1. Total Chat
      const { count: totalChat } = await supabase
        .from("Chat")
        .select("*", { count: "exact", head: true });

      // 2. Butuh Admin (Ticket status BARU)
      const { count: adminRequests } = await supabase
        .from("Ticket")
        .select("*", { count: "exact", head: true })
        .eq("status", "BARU");

      // 3. User Terdaftar
      const { count: registeredUsers } = await supabase
        .from("User")
        .select("*", { count: "exact", head: true });

      // 4. Simulasi data lain (karena belum ada tabel tracking visitor/rating spesifik)
      // Anda bisa menambahkan tabel Analytics nanti
      setStats({
        totalChat: totalChat || 0,
        adminRequests: adminRequests || 0,
        satisfactionRate: 95, // Placeholder logic
        visitors: 1205, // Placeholder logic
        registeredUsers: registeredUsers || 0,
      });
      setLoading(false);
    }

    fetchStats();
  }, [supabase]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-muted/50" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Chat */}
      <div className="rounded-xl border bg-card text-card-foreground p-6 shadow-sm">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <span className="text-sm font-medium text-muted-foreground">
            Total Chat
          </span>
          <MessageCircle className="h-4 w-4 text-primary" />
        </div>
        <div className="text-2xl font-bold">{stats.totalChat}</div>
        <div className="flex items-center text-xs text-muted-foreground mt-1">
          <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
          Data Realtime
        </div>
      </div>

      {/* Butuh Admin */}
      <div
        className={`rounded-xl border p-6 shadow-sm ${
          stats.adminRequests > 0
            ? "bg-red-500/10 border-red-500/50"
            : "bg-card"
        }`}
      >
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <span
            className={`text-sm font-medium ${
              stats.adminRequests > 0 ? "text-red-500" : "text-muted-foreground"
            }`}
          >
            Butuh Bantuan
          </span>
          <AlertCircle
            className={`h-4 w-4 ${
              stats.adminRequests > 0 ? "text-red-500" : "text-muted-foreground"
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
        <p className="text-xs text-muted-foreground mt-1">
          Tiket status 'BARU'
        </p>
      </div>

      {/* Kepuasan */}
      <div className="rounded-xl border bg-card text-card-foreground p-6 shadow-sm">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <span className="text-sm font-medium text-muted-foreground">
            Kepuasan User
          </span>
          <ThumbsUp className="h-4 w-4 text-green-500" />
        </div>
        <div className="text-2xl font-bold text-green-600">
          {stats.satisfactionRate}%
        </div>
        <p className="text-xs text-muted-foreground mt-1">Estimasi Sistem</p>
      </div>

      {/* Traffic */}
      <div className="rounded-xl border bg-card text-card-foreground p-6 shadow-sm">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <span className="text-sm font-medium text-muted-foreground">
            User Base
          </span>
          <Activity className="h-4 w-4 text-blue-500" />
        </div>
        <div className="flex justify-between items-end">
          <div>
            <div className="text-xl font-bold">{stats.registeredUsers}</div>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" /> Registered
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
