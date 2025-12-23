import { prisma } from "@/lib/prisma";
import { ChatClient } from "@/components/chat/chat-client";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Prisma } from "@prisma/client";

interface ChatPageProps {
  // Next.js App Router umumnya memberikan object, bukan Promise.
  // Namun kalau project Anda memang memakai Promise, Anda bisa balikin ke Promise seperti sebelumnya.
  params: { id: string };
}

// Payload type: Chat + messages (dengan field yang Prisma tahu)
type ChatWithMessages = Prisma.ChatGetPayload<{
  include: {
    messages: true;
  };
}>;

export default async function ChatPage({ params }: ChatPageProps) {
  const { id } = params;

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

  const initialMessages = chat.messages.map((msg) => ({
    id: String(msg.id),
    role: msg.role.toLowerCase() as "user" | "assistant",
    content: msg.content,
  }));

  return <ChatClient initialMessages={initialMessages} chatId={chat.id} />;
}
