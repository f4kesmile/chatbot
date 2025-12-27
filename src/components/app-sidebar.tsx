"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import {
  IconMessage,
  IconHelp,
  IconLayoutDashboard,
  IconSettings,
  IconBook,
} from "@tabler/icons-react";
import { LogOut, Settings2 } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { eventBus } from "@/utils/events";
import { PinList, PinListItem } from "@/components/ui/pin-list";

export function AppSidebar() {
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // User State
  const [userEmail, setUserEmail] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("user");
  const [userName, setUserName] = useState<string>("");
  const [userAvatar, setUserAvatar] = useState<string>("");

  // History State
  const [history, setHistory] = useState<PinListItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [supabase] = useState(() => createClient());
  const router = useRouter();

  // --- 1. FETCH USER DATA ---
  const fetchUserData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      setUserEmail(user.email || "");
      setUserAvatar(user.user_metadata?.avatar_url || "");

      // Pastikan tabel "User" sesuai dengan Prisma (Case Sensitive di Supabase)
      const { data: userData } = await supabase
        .from("User")
        .select("role, name")
        .eq("id", user.id)
        .single();

      if (userData) {
        setUserRole(userData.role || "user");
        setUserName(userData.name || "");
        const hasAdminAccess =
          userData.role === "admin" || userData.role === "super_admin";
        setIsAdmin(hasAdminAccess);
      }
    }
  }, [supabase]);

  // --- 2. FETCH CHAT HISTORY (DINAMIS DARI PRISMA SCHEMA) ---
  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // NOTE: Nama tabel sesuaikan dengan Prisma ("Chat").
    // Nama kolom sesuaikan dengan schema ("isPinned", "updatedAt").
    // Supabase biasanya butuh quote "" untuk kolom camelCase jika dibuat via Prisma.
    const { data, error } = await supabase
      .from("Chat")
      .select("id, title, updatedAt, isPinned")
      .eq("userId", user.id) // Sesuaikan field userId di schema
      .order("isPinned", { ascending: false })
      .order("updatedAt", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error fetching chat:", error);
    }

    if (data) {
      const mappedData: PinListItem[] = data.map((item: any) => ({
        id: item.id,
        title: item.title || "Percakapan Baru",
        // Format tanggal dari 'updatedAt'
        info: new Date(item.updatedAt).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
        }),
        pinned: item.isPinned || false,
      }));
      setHistory(mappedData);
    }
    setLoadingHistory(false);
  }, [supabase]);

  // --- 3. EVENT HANDLERS ---

  // Handle Pin/Unpin
  const handlePinToggle = async (id: string) => {
    const item = history.find((h) => h.id === id);
    if (!item) return;

    const newStatus = !item.pinned;

    // Optimistic Update
    setHistory((prev) =>
      prev.map((p) => (p.id === id ? { ...p, pinned: newStatus } : p))
    );

    // Update Database
    const { error } = await supabase
      .from("Chat")
      .update({ isPinned: newStatus }) // Column Prisma: isPinned
      .eq("id", id);

    if (error) {
      toast.error("Gagal update pin");
      console.error(error);
      // Revert jika gagal
      setHistory((prev) =>
        prev.map((p) => (p.id === id ? { ...p, pinned: !newStatus } : p))
      );
    }
  };

  // Handle Delete
  const handleDelete = async (id: string) => {
    const isConfirmed = window.confirm("Hapus percakapan ini secara permanen?");
    if (!isConfirmed) return;

    const previousHistory = [...history];
    setHistory((prev) => prev.filter((item) => item.id !== id));

    const { error } = await supabase.from("Chat").delete().eq("id", id);

    if (error) {
      toast.error("Gagal menghapus chat");
      setHistory(previousHistory);
    } else {
      toast.success("Chat dihapus");
      router.push("/");
    }
  };

  // Handle Select
  const handleSelect = (id: string) => {
    // Arahkan ke halaman chat dynamic [id]
    // Pastikan folder Anda src/app/chat/[id]/page.tsx atau src/app/c/[id]/page.tsx
    router.push(`/chat/${id}`);
  };

  // --- 4. USE EFFECTS ---
  useEffect(() => {
    fetchUserData();
    fetchHistory();

    const handleUserUpdate = () => {
      fetchUserData();
      fetchHistory();
    };

    eventBus.on("userUpdated", handleUserUpdate);
    return () => {
      eventBus.off("userUpdated", handleUserUpdate);
    };
  }, [fetchUserData, fetchHistory]);

  const handleLogout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Gagal Logout", { description: error.message });
    } else {
      toast.success("Berhasil Logout");
      router.replace("/login");
      router.refresh();
    }
  }, [router, supabase]);

  const mainLinks = [
    {
      label: "Chat Baru",
      href: "/",
      icon: (
        <IconMessage className="text-neutral-700 dark:text-neutral-200 h-6 w-6 shrink-0" />
      ),
    },
    {
      label: "Bantuan",
      href: "/support",
      icon: (
        <IconHelp className="text-neutral-700 dark:text-neutral-200 h-6 w-6 shrink-0" />
      ),
    },
    {
      label: "Pengaturan",
      href: "/settings",
      icon: (
        <IconSettings className="text-neutral-700 dark:text-neutral-200 h-6 w-6 shrink-0" />
      ),
    },
  ];

  const adminLinks = [
    {
      label: "Dashboard",
      href: "/admin/dashboard",
      icon: <IconLayoutDashboard className="text-blue-500 h-6 w-6 shrink-0" />,
    },
    {
      label: "Inbox",
      href: "/admin/inbox",
      icon: <IconMessage className="text-blue-500 h-6 w-6 shrink-0" />,
    },
    {
      label: "Knowledge",
      href: "/admin/knowledge",
      icon: <IconBook className="text-blue-500 h-6 w-6 shrink-0" />,
    },
    {
      label: "User Management",
      href: "/admin/users",
      icon: <Settings2 className="text-blue-500 h-6 w-6 shrink-0" />,
    },
    {
      label: "Settings",
      href: "/admin/settings",
      icon: <IconSettings className="text-blue-500 h-6 w-6 shrink-0" />,
    },
  ];

  const initial = (userName || userEmail || "U").charAt(0).toUpperCase();

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-10 bg-zinc-50 dark:bg-zinc-950 border-r md:border-r-0 md:border md:rounded-3xl border-zinc-200 dark:border-zinc-800 shadow-xl">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
          {open ? <Logo /> : <LogoIcon />}

          <div className="mt-8 flex flex-col gap-2">
            <p
              className={cn(
                "text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 px-1",
                !open && "hidden"
              )}
            >
              Menu
            </p>
            {mainLinks.map((link, idx) => (
              <SidebarLink key={idx} link={link} />
            ))}
          </div>

          {isAdmin && (
            <div className="mt-6 flex flex-col gap-2">
              <p
                className={cn(
                  "text-xs font-bold text-blue-500 uppercase tracking-wider mb-1 px-1",
                  !open && "hidden"
                )}
              >
                Admin Zone
              </p>
              {adminLinks.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          )}

          {/* AREA RIWAYAT CHAT (DINAMIS PIN LIST) */}
          <div className="mt-6 flex flex-col gap-2 flex-1">
            {open && history.length > 0 && <div className="px-1" />}

            <div className={cn("flex-1", !open && "hidden")}>
              {loadingHistory ? (
                <div className="text-xs text-zinc-400 px-4 animate-pulse">
                  Memuat...
                </div>
              ) : (
                <PinList
                  items={history}
                  onPinToggle={handlePinToggle}
                  onDelete={handleDelete}
                  onSelect={handleSelect}
                  className="pb-10"
                />
              )}
            </div>
          </div>
        </div>

        {/* PROFILE DROPDOWN */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3 -mx-2 px-2 mt-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                suppressHydrationWarning
                className={cn(
                  "flex items-center gap-3 w-full p-2 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all group outline-none",
                  !open && "justify-center"
                )}
              >
                <Avatar className="h-10 w-10 border border-zinc-300 dark:border-zinc-700 shrink-0">
                  <AvatarImage src={userAvatar} className="object-cover" />
                  <AvatarFallback className="bg-blue-600 text-white font-bold text-sm">
                    {initial}
                  </AvatarFallback>
                </Avatar>

                {open && (
                  <div className="flex flex-col items-start text-left overflow-hidden">
                    <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate w-40">
                      {userEmail}
                    </span>
                    <span className="text-[12px] font-bold text-zinc-500">
                      {userRole}
                    </span>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              side="top"
              align="start"
              className="w-56 mb-2 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 ml-1"
            >
              <div className="px-2 py-1.5 border-b border-zinc-100 dark:border-zinc-800 mb-1">
                <p className="text-sm font-medium text-black dark:text-white">
                  Akun Saya
                </p>
                <p className="text-xs text-zinc-500 truncate">{userEmail}</p>
              </div>
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/20 cursor-pointer gap-2"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarBody>
    </Sidebar>
  );
}

export const Logo = () => (
  <Link
    href="/"
    className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20 pl-1"
  >
    <div className="h-6 w-6 bg-blue-600 rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm shrink-0" />
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="font-bold text-lg text-black dark:text-white whitespace-pre"
    >
      Takon AI
    </motion.span>
  </Link>
);

export const LogoIcon = () => (
  <Link
    href="/"
    className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20 pl-1"
  >
    <div className="h-6 w-6 bg-blue-600 rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm shrink-0" />
  </Link>
);
