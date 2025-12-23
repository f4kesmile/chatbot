import { StatsOverview } from "@/components/admin/StatsOverview";
import { AdminInbox } from "@/components/admin/AdminInbox";
// import { ThemeTogglerButton } from "@/components/animate-ui/components/buttons/theme-toggler";
import { requireAdmin } from "@/utils/check-role";

export default async function AdminDashboard() {
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
            Monitoring aktivitas bot dan tiket masuk.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsOverview />

      {/* Main Content: Hanya Inbox (Sekarang Full Width) */}
      <div className="grid grid-cols-1 h-[600px]">
        {/* Inbox sekarang mengambil lebar penuh agar lebih lega */}
        <div className="h-full rounded-xl overflow-hidden border bg-card text-card-foreground shadow-sm">
          <AdminInbox />
        </div>
      </div>
    </div>
  );
}
