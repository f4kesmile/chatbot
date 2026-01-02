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
    // ROOT CONTAINER: Full Height, No Scroll pada body
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-white dark:bg-black md:bg-zinc-100 md:dark:bg-black md:p-2 md:gap-2 relative overflow-hidden">
      <AppSidebar />

      {/* MAIN CONTENT WRAPPER */}
      <main className="flex-1 flex flex-col h-full min-h-0 relative overflow-hidden bg-white dark:bg-zinc-950 md:rounded-[2rem] border-zinc-200 dark:border-zinc-800 md:border shadow-sm">
        {/* 1. MOBILE HEADER */}
        <header className="md:hidden absolute top-0 left-0 w-full z-[100] h-14 flex items-center justify-between px-4 pointer-events-none">
          {/* KIRI: Spacer untuk Hamburger (agar judul/konten tidak nabrak) */}
          <div className="w-10 h-full shrink-0" />

          {/* TENGAH: Kosong (Tempat Model Selector dari Page) */}
          <div className="flex-1" />

          {/* KANAN: Tombol (Pointer Events Auto agar bisa diklik) */}
          <div className="flex items-center gap-2 pointer-events-auto shrink-0 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md rounded-full p-1 pl-2 border border-zinc-200/50 dark:border-zinc-800/50">
            <ThemeTogglerButton />
            <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700 mx-1" />
            <AuthButton />
          </div>
        </header>

        {/* 2. DESKTOP FLOATING PILL */}
        <div className="hidden md:flex absolute top-6 right-6 z-[100] items-center gap-3 pointer-events-none">
          <div className="flex items-center gap-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-1.5 shadow-sm transition-all hover:shadow-md pointer-events-auto">
            <ThemeTogglerButton />
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />
            <AuthButton />
          </div>
        </div>
        {/* 3. MAIN CONTENT AREA */}
        <div className="flex-1 w-full h-full overflow-hidden relative">
          {children}
        </div>
      </main>

      {/* Broadcast Widget */}
      <div className="fixed top-16 md:top-6 left-0 right-0 z-[90] w-full flex justify-center px-4 pointer-events-none">
        <div className="w-full max-w-[500px]">
          <BroadcastWidget />
        </div>
      </div>
    </div>
  );
}
