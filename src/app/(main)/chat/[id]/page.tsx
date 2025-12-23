import { prisma } from "@/lib/prisma";
import { ChatClient } from "@/components/chat/chat-client";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import type { Chat, Message } from "@prisma/client";

interface ChatPageProps {
  // Jika di project Anda params memang Promise, biarkan seperti ini.
  // Jika tidak, ubah ke: params: { id: string };
  params: Promise<{ id: string }>;
}

// Hardened typing: messages tidak akan pernah jadi any
type ChatWithMessages = Chat & { messages: Message[] };

export default async function ChatPage({ params }: ChatPageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const chat = (await prisma.chat.findUnique({
    where: {
      id,
      userId: user.id,
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  })) as ChatWithMessages | null;

  if (!chat) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <h1 className="text-2xl font-bold mb-2">404</h1>
        <p>Percakapan tidak ditemukan atau telah dihapus.</p>
      </div>
    );
  }

  // msg sekarang ter-infer sebagai Message tanpa (msg: Message)
  const initialMessages = chat.messages.map((msg) => ({
    id: String(msg.id),
    role: msg.role.toLowerCase() as "user" | "assistant",
    content: msg.content,
  }));

  return <ChatClient initialMessages={initialMessages} chatId={chat.id} />;
}
