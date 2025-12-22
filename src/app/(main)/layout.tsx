import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeTogglerButton } from "@/components/animate-ui/components/buttons/theme-toggler";
import { AuthButton } from "@/components/auth-button";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      {/* 1. Sidebar Kiri */}
      <AppSidebar />

      {/* 2. Area Kanan */}
      <SidebarInset className="bg-background flex flex-col h-screen overflow-hidden transition-colors duration-300">
        {/* --- HEADER --- */}
        <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4 bg-background/50 backdrop-blur-md z-10 sticky top-0">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <span className="font-medium text-sm text-muted-foreground">
              Vibe Coder
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Toggle Tema */}
            <ThemeTogglerButton />

            {/* Garis Pemisah */}
            <div className="h-6 w-px bg-border mx-1"></div>

            {/* --- 2. PASANG AUTH BUTTON DISINI --- */}
            {/* Tombol ini akan otomatis berubah: Sign In <-> Avatar */}
            <AuthButton />
          </div>
        </header>

        {/* --- MAIN CONTENT --- */}
        <main className="flex-1 overflow-hidden relative flex flex-col">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
