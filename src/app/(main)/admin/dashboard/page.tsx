import { StatsOverview } from "@/components/admin/StatsOverview";
import { AdminInbox } from "@/components/admin/AdminInbox";
import { requireAdmin } from "@/utils/check-role";

export default async function AdminDashboard() {
  // Pastikan user adalah admin sebelum merender halaman (Server Side Check)
  await requireAdmin();

  return (
    <div className="flex flex-col h-full p-6 space-y-6 overflow-y-auto bg-background">
      {/* Header Dashboard */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-muted-foreground text-sm">
            Monitoring aktivitas pengguna dan tiket bantuan secara real-time.
          </p>
        </div>
      </div>

      {/* Stats Cards (Dinamis dari DB) */}
      <StatsOverview />

      {/* Main Content: Inbox Full Width */}
      <div className="flex-1 min-h-[500px] rounded-xl overflow-hidden border bg-card text-card-foreground shadow-sm">
        <AdminInbox />
      </div>
    </div>
  );
}
