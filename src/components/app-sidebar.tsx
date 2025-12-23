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
import { LogOut } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChatHistoryList } from "@/components/chat/ChatHistoryList";

// Dropdown & Avatar
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function AppSidebar() {
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [userEmail, setUserEmail] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("user");
  const [userName, setUserName] = useState<string>("");

  const [supabase] = useState(() => createClient());
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (user) {
        setUserEmail(user.email || "");

        const { data: userData } = await supabase
          .from("User")
          .select("role, name")
          .eq("id", user.id)
          .single();

        if (!mounted) return;

        if (userData) {
          setUserRole(userData.role || "user");
          setUserName(userData.name || "");
          if (userData.role === "admin") setIsAdmin(true);
        }
      }
    }

    void fetchData();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  const handleLogout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast.error("Gagal Logout", { description: error.message });
    } else {
      toast.success("Berhasil Logout", {
        description: "Sampai jumpa lagi!",
      });
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
      label: "Settings",
      href: "/admin/settings",
      icon: <IconSettings className="text-blue-500 h-6 w-6 shrink-0" />,
    },
  ];

  const initial = (userName || userEmail || "U").charAt(0).toUpperCase();

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-10 bg-zinc-50 dark:bg-zinc-950 border-r md:border-r-0 md:border md:rounded-3xl border-zinc-200 dark:border-zinc-800 shadow-xl">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
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

          <div className="mt-6 flex flex-col gap-2">
            <p
              className={cn(
                "text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 px-1",
                !open && "hidden"
              )}
            >
              Riwayat
            </p>

            <div className={cn(!open ? "hidden" : "block")}>
              <ChatHistoryList />
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3 -mx-2 px-2">
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
                  <AvatarFallback className="bg-blue-600 text-white font-bold text-sm">
                    {initial}
                  </AvatarFallback>
                </Avatar>

                {open && (
                  <div className="flex flex-col items-start text-left overflow-hidden">
                    <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate w-40">
                      {userEmail}
                    </span>
                    <span className="text-[12px] font-bold">{userRole}</span>
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
      Vibe Coder
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
