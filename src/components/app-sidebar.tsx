"use client";

import * as React from "react";
import {
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
  MessageSquare,
  LayoutDashboard,
  Settings,
  LifeBuoy,
  BookOpen,
  MoreHorizontal,
  Trash2,
  FolderGit2,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { AuthButton } from "@/components/auth-button";

// --- DATA STATIS (Bisa dipindah ke lib/data.ts nanti) ---
const teamData = [
  { name: "Vibe Coder", logo: GalleryVerticalEnd, plan: "Pro" },
  { name: "Personal", logo: AudioWaveform, plan: "Free" },
];

const navMain = [
  { title: "Chat Baru", url: "/chat", icon: MessageSquare },
  { title: "Bantuan", url: "/support", icon: LifeBuoy },
];

// Data Dummy History (Nanti diganti DB)
const chatHistory = [
  { id: "1", title: "Membuat API Next.js", url: "#", date: "Baru saja" },
  { id: "2", title: "Debug CSS Tailwind", url: "#", date: "Hari ini" },
  { id: "3", title: "Setup Prisma & MySQL", url: "#", date: "Kemarin" },
];

const adminMenu = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Inbox Bantuan", url: "/admin/inbox", icon: MessageSquare },
  { title: "Konten Bot", url: "/admin/knowledge", icon: BookOpen },
  { title: "Pengaturan", url: "/admin/settings", icon: Settings },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [activeTeam, setActiveTeam] = React.useState(teamData[0]);

  // Cek Role Admin
  const isAdmin = true;
  return (
    <Sidebar
      collapsible="icon"
      {...props}
      className="border-r border-white/10 w-[--sidebar-width]! transition-none"
    >
      {/* 1. HEADER: TEAM SWITCHER (KEMBALI!) */}
      <SidebarHeader className="bg-zinc-950">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-zinc-800 text-white"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-indigo-600 text-sidebar-primary-foreground">
                <activeTeam.logo className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {activeTeam.name}
                </span>
                <span className="truncate text-xs text-zinc-400">
                  {activeTeam.plan}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* 2. CONTENT */}
      <SidebarContent className="bg-zinc-950 text-zinc-300 overflow-x-hidden overflow-y-auto">
        {/* MENU UTAMA */}
        <SidebarGroup>
          <SidebarMenu>
            {navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  className="hover:bg-zinc-800 hover:text-white"
                >
                  <a href={item.url}>
                    <item.icon className="text-zinc-400" />
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* SECTION: ADMIN (HANYA MUNCUL JIKA ADMIN) */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-indigo-400 text-xs font-bold uppercase tracking-wider mt-2">
              Admin Zone
            </SidebarGroupLabel>
            <SidebarMenu>
              {adminMenu.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    className="hover:bg-zinc-800 hover:text-white"
                  >
                    <a href={item.url}>
                      <item.icon className="text-indigo-400" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* SECTION: HISTORY PERCAKAPAN (KEMBALI!) */}
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel className="text-zinc-500 text-xs font-bold uppercase tracking-wider mt-2">
            Riwayat Percakapan
          </SidebarGroupLabel>
          <SidebarMenu>
            {chatHistory.map((chat) => (
              <SidebarMenuItem key={chat.id}>
                <SidebarMenuButton
                  asChild
                  className="hover:bg-zinc-800 hover:text-white h-auto py-2"
                >
                  <a
                    href={chat.url}
                    className="flex flex-col items-start gap-1"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <MessageSquare className="size-4 text-zinc-500 shrink-0" />
                      <span className="truncate font-medium">{chat.title}</span>
                    </div>
                    <span className="text-[10px] text-zinc-600 pl-6">
                      {chat.date}
                    </span>
                  </a>
                </SidebarMenuButton>
                <SidebarMenuAction
                  showOnHover
                  className="text-zinc-500 hover:text-white"
                >
                  <MoreHorizontal />
                </SidebarMenuAction>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-white/10 p-4 bg-zinc-950">
        <AuthButton />
      </SidebarFooter>
    </Sidebar>
  );
}
