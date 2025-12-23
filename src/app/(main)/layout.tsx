import { AppSidebar } from "@/components/app-sidebar";
import { ThemeTogglerButton } from "@/components/animate-ui/components/buttons/theme-toggler";
import { AuthButton } from "@/components/auth-button";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // UBAH DISINI: 'flex-col' untuk mobile, 'md:flex-row' untuk desktop
    <div className="flex flex-col md:flex-row h-screen w-full bg-white dark:bg-black md:bg-zinc-100 md:dark:bg-black md:p-2 md:gap-2">
      {/* 1. Sidebar (Akan menjadi Header di Mobile, Sidebar di Desktop) */}
      <AppSidebar />

      {/* 2. Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* LAYOUT POJOK KANAN ATAS */}
        {/* Tambahkan 'top-4' agar tidak terlalu mepet header mobile jika konten di-scroll */}
        <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/50 dark:bg-black/50 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-full p-1 shadow-none">
            <ThemeTogglerButton />
            <div className="h-5 w-px bg-zinc-300 dark:bg-zinc-700 mx-1" />
            <AuthButton />
          </div>
        </div>

        {/* CONTENT CARD */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-zinc-900 md:rounded-3xl border-t md:border border-zinc-200 dark:border-zinc-800 shadow-none relative">
          {children}
        </div>
      </main>
    </div>
  );
}
