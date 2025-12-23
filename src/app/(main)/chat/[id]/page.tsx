import { prisma } from "@/lib/prisma";
import { ChatClient } from "@/components/chat/chat-client";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Message } from "@prisma/client";

interface ChatPageProps {
  params: Promise<{ id: string }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const chat = await prisma.chat.findUnique({
    where: {
      id: id,
      userId: user.id,
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!chat) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <h1 className="text-2xl font-bold mb-2">404</h1>
        <p>Percakapan tidak ditemukan atau telah dihapus.</p>
      </div>
    );
  }

  // 3. FORMAT PESAN (CARA ELEGAN & AMAN)
  const initialMessages = chat.messages.map((msg: Message) => ({
    id: String(msg.id),
    role: msg.role.toLowerCase() as "user" | "assistant",
    content: msg.content,
  }));

  return <ChatClient initialMessages={initialMessages} chatId={chat.id} />;
}
