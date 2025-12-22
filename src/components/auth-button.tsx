"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { LogOut, User as UserIcon, Loader2 } from "lucide-react";

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false); // Untuk dropdown menu
  const router = useRouter();

  // 1. Cek User saat komponen dimuat
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getUser();

    // 2. Pasang 'Telinga' untuk mendengar jika ada yang login/logout
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fungsi Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    setIsOpen(false);
  };

  // Tampilan Loading (biar ga kedip)
  if (loading)
    return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;

  // --- KONDISI 1: BELUM LOGIN ---
  if (!user) {
    return (
      <Link
        href="/login"
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition"
      >
        Sign In
      </Link>
    );
  }

  // --- KONDISI 2: SUDAH LOGIN (Tampilkan Avatar) ---
  // Ambil inisial email (contoh: 'budi@gmail.com' -> 'B')
  const initial = user.email?.charAt(0).toUpperCase() || "U";

  return (
    <div className="relative">
      {/* Tombol Avatar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 w-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white hover:bg-zinc-700 transition"
      >
        <span className="font-bold">{initial}</span>
      </button>

      {/* Dropdown Menu (Muncul kalau diklik) */}
      {isOpen && (
        <>
          {/* Layar transparan buat nutup menu kalau klik diluar */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-md shadow-lg z-20 overflow-hidden">
            {/* Header Email */}
            <div className="px-4 py-3 border-b border-zinc-800">
              <p className="text-xs text-zinc-400">Signed in as</p>
              <p className="text-sm font-medium text-white truncate">
                {user.email}
              </p>
            </div>

            {/* Tombol Logout */}
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-zinc-800 flex items-center gap-2 transition"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
