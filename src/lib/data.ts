import {
  AudioWaveform,
  Home,
  Inbox,
  Search,
  Sparkles,
  GalleryVerticalEnd,
  Command,
  MessageSquare,
  Code2,
  Settings,
  LayoutDashboard,
  FolderGit2
} from "lucide-react";

// Simulasi Data User & Tim
export const userData = {
  name: "Developer",
  email: "dev@vibecoder.com",
  avatar: "https://github.com/shadcn.png",
};

export const teamData = [
  {
    name: "Vibe Coder",
    logo: Code2,
    plan: "Pro",
  },
  {
    name: "Personal",
    logo: Command,
    plan: "Free",
  },
];

// Menu Utama (Navigasi Halaman)
export const navMain = [
  {
    title: "Chat Baru",
    url: "/", // Kembali ke halaman utama chat
    icon: Sparkles,
  },
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Projects",
    url: "/projects",
    icon: FolderGit2,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

// GANTI FAVORITES JADI HISTORY
// Nanti ini bisa diambil dari database
export const chatHistory = [
  {
    id: "chat-1",
    title: "Membuat API Next.js",
    url: "/c/chat-1", // Contoh URL dinamis
    date: "Baru saja",
  },
  {
    id: "chat-2",
    title: "Debug CSS Tailwind",
    url: "/c/chat-2",
    date: "Hari ini",
  },
  {
    id: "chat-3",
    title: "Setup Prisma & MySQL",
    url: "/c/chat-3",
    date: "Kemarin",
  },
  {
    id: "chat-4",
    title: "Install Linux Server",
    url: "/c/chat-4",
    date: "3 Hari lalu",
  },
  {
    id: "chat-5",
    title: "Belajar React Hooks",
    url: "/c/chat-5",
    date: "Minggu lalu",
  },
];