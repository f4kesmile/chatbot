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
import { LogOut, Settings2, Trash2, Loader2 } from "lucide-react"; // Tambah Icon Loader2
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

// --- IMPORT ALERT DIALOG ---
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

  // --- STATE UNTUK DELETE DIALOG ---
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

      const { data: userData } = await supabase
        .from("User")
        .select("role, name, avatar")
        .eq("id", user.id)
        .single();

      if (userData) {
        setUserRole(userData.role || "user");
        setUserName(userData.name || "");
        setUserAvatar(userData.avatar || user.user_metadata?.avatar_url || "");

        const hasAdminAccess =
          userData.role === "admin" || userData.role === "super_admin";
        setIsAdmin(hasAdminAccess);
      } else {
        setUserAvatar(user.user_metadata?.avatar_url || "");
      }
    }
  }, [supabase]);

  // --- 2. FETCH CHAT HISTORY ---
  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("Chat")
      .select("id, title, updatedAt, isPinned")
      .eq("userId", user.id)
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

  const handlePinToggle = async (id: string) => {
    const item = history.find((h) => h.id === id);
    if (!item) return;

    const newStatus = !item.pinned;
    setHistory((prev) =>
      prev.map((p) => (p.id === id ? { ...p, pinned: newStatus } : p))
    );

    const { error } = await supabase
      .from("Chat")
      .update({ isPinned: newStatus })
      .eq("id", id);

    if (error) {
      toast.error("Gagal update pin");
      setHistory((prev) =>
        prev.map((p) => (p.id === id ? { ...p, pinned: !newStatus } : p))
      );
    }
  };

  // A. Trigger Dialog (Bukan langsung hapus)
  const handleDeleteRequest = (id: string) => {
    setDeleteTarget(id); // Simpan ID yang mau dihapus dan buka Dialog
  };

  // B. Eksekusi Hapus (Dipanggil saat tombol 'Hapus' di Dialog ditekan)
  const executeDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    const id = deleteTarget;

    // Optimistic Update
    const previousHistory = [...history];
    setHistory((prev) => prev.filter((item) => item.id !== id));

    const { error } = await supabase.from("Chat").delete().eq("id", id);

    if (error) {
      toast.error("Gagal menghapus chat");
      setHistory(previousHistory); // Revert jika gagal
    } else {
      toast.success("Percakapan dihapus permanen");
      router.push("/");
    }

    setIsDeleting(false);
    setDeleteTarget(null); // Tutup Dialog
  };

  const handleSelect = (id: string) => {
    router.push(`/chat/${id}`);
  };

  // --- 4. USE EFFECTS ---
  useEffect(() => {
    fetchUserData();
    fetchHistory();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setUserEmail("");
        setUserAvatar("");
        setUserName("");
        setUserRole("user");
        setHistory([]);
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        fetchUserData();
        fetchHistory();
      }
    });
    const handleUserUpdate = () => {
      fetchUserData();
      fetchHistory();
    };
    eventBus.on("userUpdated", handleUserUpdate);

    return () => {
      subscription.unsubscribe();
      eventBus.off("userUpdated", handleUserUpdate);
    };
  }, [fetchUserData, fetchHistory, supabase]);

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
    <>
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

            {/* AREA RIWAYAT CHAT */}
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
                    onDelete={handleDeleteRequest} // Ganti ke request delete
                    onSelect={handleSelect}
                    className="pb-10"
                  />
                )}
              </div>
            </div>
          </div>

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
                  <LogOut size={16} /> <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </SidebarBody>
      </Sidebar>

      {/* --- KOMPONEN ALERT DIALOG (GLOBAL DI SIDEBAR) --- */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="rounded-2xl bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 w-[90%] sm:w-full max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-900 dark:text-white flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              Hapus Percakapan?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-500 text-sm leading-relaxed">
              Tindakan ini bersifat permanen. Riwayat percakapan yang dipilih
              akan dihapus dari server dan tidak dapat dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-6 flex flex-row items-center justify-end gap-3">
            <AlertDialogCancel
              disabled={isDeleting}
              className="mt-0 rounded-xl border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
            >
              Batal
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                executeDelete();
              }}
              disabled={isDeleting}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20 border-0 font-semibold"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Menghapus...
                </>
              ) : (
                "Ya, Hapus Permanen"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
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
