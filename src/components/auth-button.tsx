"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { LogOut, Loader2, User as UserIcon } from "lucide-react";

// Import komponen Shadcn UI yang lebih stabil
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (_event === "SIGNED_OUT") {
        setUser(null);
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  const handleLogout = async () => {
    // 1. Logout dari Supabase
    await supabase.auth.signOut();

    // 2. Reset state lokal
    setUser(null);

    // 3. Paksa redirect ke Login
    router.replace("/login");
    router.refresh();
  };

  if (loading) {
    return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
  }

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

  // Ambil inisial nama/email
  const initial =
    user.user_metadata?.full_name?.charAt(0) ||
    user.email?.charAt(0).toUpperCase() ||
    "U";

  return (
    <DropdownMenu>
      {/* TRIGGER: Avatar yang diklik */}
      <DropdownMenuTrigger asChild>
        <button className="relative h-9 w-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white hover:bg-zinc-700 transition focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-950">
          <Avatar className="h-9 w-9">
            {/* Jika nanti ada foto profil, pakai AvatarImage disini */}
            <AvatarFallback className="bg-blue-600 text-white font-bold">
              {initial}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      {/* CONTENT: Isi Menu (Otomatis muncul di layer teratas) */}
      <DropdownMenuContent
        className="w-56 bg-zinc-900 border-zinc-800 text-zinc-200"
        align="end"
        forceMount
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-white">
              Akun Saya
            </p>
            <p className="text-xs leading-none text-zinc-400 truncate">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-zinc-800" />

        {/* Tombol Logout - Pasti bisa diklik karena pakai standard item */}
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-red-400 focus:text-red-400 focus:bg-zinc-800 cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
