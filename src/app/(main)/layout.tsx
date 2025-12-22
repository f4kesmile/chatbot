import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButton } from "@/components/auth-button"; // Avatar untuk kanan atas

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // CONTAINER UTAMA (Padding & Gap untuk efek floating)
    <div className="flex h-screen w-full bg-white dark:bg-black md:bg-zinc-100 md:dark:bg-black md:p-2 md:gap-2">
      {/* 1. Sidebar Kiri (Lebar tertutup 80px) */}
      <AppSidebar />

      {/* 2. Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* LAYOUT POJOK KANAN ATAS: Theme Toggler + Avatar */}
        <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/50 dark:bg-black/50 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-full p-1 shadow-none">
            <ThemeToggle />
            <div className="h-5 w-px bg-zinc-300 dark:bg-zinc-700 mx-1" />
            <AuthButton />
          </div>
        </div>

        {/* CONTENT CARD (Rounded & Shadow) */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-zinc-900 md:rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-none relative">
          {children}
        </div>
      </main>
    </div>
  );
}
