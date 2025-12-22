import { prisma } from "@/lib/prisma";
import { ChatClient } from "@/components/chat/chat-client";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

interface ChatPageProps {
  params: Promise<{ id: string }>; // Update Tipe Params jadi Promise
}

export default async function ChatPage({ params }: ChatPageProps) {
  // 1. AWAIT PARAMS DULU (Wajib di Next.js 15)
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Gunakan 'id' yang sudah di-unwrap (bukan params.id lagi)
  const chat = await prisma.chat.findUnique({
    where: {
      id: id,
      userId: user.id, // Keamanan: Pastikan user hanya buka chat miliknya
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

  // 3. Format pesan
  const initialMessages = chat.messages.map((msg) => ({
    id: msg.id,
    role: msg.role.toLowerCase() as "user" | "assistant",
    content: msg.content,
  }));

  // 4. Render Client Component
  return <ChatClient initialMessages={initialMessages} chatId={chat.id} />;
}
