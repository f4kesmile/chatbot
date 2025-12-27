"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { eventBus } from "@/utils/events"; // <--- 1. Import Event Bus

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>(""); // <--- 2. State untuk Avatar
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  // 3. Pisahkan logic fetch user agar bisa dipanggil ulang
  const fetchUserData = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const currentUser = session?.user ?? null;
    setUser(currentUser);

    if (currentUser) {
      setAvatarUrl(currentUser.user_metadata?.avatar_url || "");
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // Fetch awal
    fetchUserData();

    // 4. Subscribe ke Supabase Auth Change (Login/Logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        setAvatarUrl(currentUser.user_metadata?.avatar_url || "");
      }

      setLoading(false);

      if (event === "SIGNED_OUT") {
        setUser(null);
        setAvatarUrl("");
        router.refresh();
      }
    });

    // 5. Subscribe ke Event Bus Custom (Update Profil)
    const handleUserUpdate = () => {
      fetchUserData(); // Ambil data ulang saat profil diupdate di Settings
    };
    eventBus.on("userUpdated", handleUserUpdate);

    return () => {
      subscription.unsubscribe();
      eventBus.off("userUpdated", handleUserUpdate); // Bersihkan listener
    };
  }, [router, supabase, fetchUserData]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast.error("Gagal Logout", { description: error.message });
    } else {
      toast.success("Berhasil Logout", {
        description: "Sampai jumpa lagi!",
      });

      setUser(null);
      setAvatarUrl("");
      router.replace("/login");
      router.refresh();
    }
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

  // Fallback inisial jika avatar belum load
  const initial =
    user.user_metadata?.full_name?.charAt(0) ||
    user.email?.charAt(0).toUpperCase() ||
    "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative h-9 w-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white hover:bg-zinc-700 transition focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-950">
          <Avatar className="h-9 w-9">
            {/* 6. Gunakan AvatarImage dengan state avatarUrl */}
            <AvatarImage src={avatarUrl} className="object-cover" />
            <AvatarFallback className="bg-blue-600 text-white font-bold">
              {initial}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

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
