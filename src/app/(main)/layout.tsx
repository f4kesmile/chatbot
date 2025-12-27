"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { ThemeTogglerButton } from "@/components/animate-ui/components/buttons/theme-toggler";
import { AuthButton } from "@/components/auth-button";
import { BroadcastWidget } from "@/components/broadcast-widget";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-white dark:bg-black md:bg-zinc-100 md:dark:bg-black md:p-2 md:gap-2">
      <AppSidebar />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* 1. TOMBOL POJOK KANAN ATAS */}
        <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-1.5 shadow-sm">
            <ThemeTogglerButton />
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />
            <AuthButton />
          </div>
        </div>

        {/* 2. BROADCAST WIDGET (POSISI SAJA) */}
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-[100] w-full max-w-[500px] px-4 pointer-events-none flex flex-col items-center">
          <BroadcastWidget />
        </div>

        {/* 3. KONTEN UTAMA */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-zinc-950 md:rounded-[2rem] border-t md:border border-zinc-200 dark:border-zinc-800 shadow-none relative transition-all duration-300">
          {children}
        </div>
      </main>
    </div>
  );
}
