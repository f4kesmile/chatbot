import { StatsOverview } from "@/components/admin/StatsOverview";
import { AdminInbox } from "@/components/admin/AdminInbox";
import { QuickSettings } from "@/components/admin/QuickSettings";
import { ThemeTogglerButton } from "@/components/animate-ui/components/buttons/theme-toggler";

// MOCK DATA (Nanti ini diganti hasil fetch DB Prisma)
const mockStats = {
  totalChat: 142,
  adminRequests: 3,
  satisfactionRate: 94,
  visitors: 1205,
  registeredUsers: 340,
};

const mockTickets = [
  {
    id: "1",
    user: "Rudi",
    category: "Teknis",
    summary: "Error saat upload file PDF",
    status: "BARU" as const,
    time: "5m lalu",
  },
  {
    id: "2",
    user: "Siti",
    category: "Billing",
    summary: "Ingin upgrade ke paket Pro",
    status: "DIPROSES" as const,
    time: "1j lalu",
  },
  {
    id: "3",
    user: "Budi",
    category: "Lainnya",
    summary: "Tanya fitur API",
    status: "SELESAI" as const,
    time: "2j lalu",
  },
];

export default function AdminDashboard() {
  return (
    <div className="flex flex-col h-full p-6 space-y-6 overflow-y-auto bg-background">
      {/* Header Dashboard */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-muted-foreground text-sm">
            Monitoring aktivitas bot dan user secara realtime.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeTogglerButton /> {/* Tombol Dark/Light Mode */}
          <span className="text-xs font-medium text-green-600 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20 animate-pulse">
            System Operational
          </span>
        </div>
      </div>

      {/* 1. Stats Cards (Pass Data via Props) */}
      <StatsOverview {...mockStats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. Inbox (Lebar 2 kolom) */}
        <div className="lg:col-span-2 h-125">
          <AdminInbox tickets={mockTickets} />
        </div>

        {/* 3. Settings (Lebar 1 kolom) */}
        <div className="lg:col-span-1 h-full">
          <QuickSettings />
        </div>
      </div>
    </div>
  );
}
