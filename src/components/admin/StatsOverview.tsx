import {
  MessageCircle,
  AlertCircle,
  ThumbsUp,
  Users,
  ArrowUpRight,
  Activity,
} from "lucide-react";

interface StatsProps {
  totalChat: number;
  adminRequests: number;
  satisfactionRate: number;
  visitors: number;
  registeredUsers: number;
}

export function StatsOverview({
  totalChat,
  adminRequests,
  satisfactionRate,
  visitors,
  registeredUsers,
}: StatsProps) {
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
        <div className="text-2xl font-bold">{totalChat}</div>
        <div className="flex items-center text-xs text-muted-foreground mt-1">
          <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
          +12% dari minggu lalu
        </div>
      </div>

      {/* Butuh Admin */}
      <div
        className={`rounded-xl border p-6 shadow-sm ${
          adminRequests > 0 ? "bg-red-500/10 border-red-500/50" : "bg-card"
        }`}
      >
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <span
            className={`text-sm font-medium ${
              adminRequests > 0 ? "text-red-500" : "text-muted-foreground"
            }`}
          >
            Butuh Bantuan
          </span>
          <AlertCircle
            className={`h-4 w-4 ${
              adminRequests > 0 ? "text-red-500" : "text-muted-foreground"
            }`}
          />
        </div>
        <div
          className={`text-2xl font-bold ${
            adminRequests > 0 ? "text-red-500" : "text-foreground"
          }`}
        >
          {adminRequests}
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
          {satisfactionRate}%
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Berdasarkan feedback
        </p>
      </div>

      {/* Traffic */}
      <div className="rounded-xl border bg-card text-card-foreground p-6 shadow-sm">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <span className="text-sm font-medium text-muted-foreground">
            Traffic
          </span>
          <Activity className="h-4 w-4 text-blue-500" />
        </div>
        <div className="flex justify-between items-end">
          <div>
            <div className="text-xl font-bold">{visitors}</div>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" /> Guest
            </p>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-primary">
              {registeredUsers}
            </div>
            <p className="text-[10px] text-muted-foreground">Registered</p>
          </div>
        </div>
      </div>
    </div>
  );
}
