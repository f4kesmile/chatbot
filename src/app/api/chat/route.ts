import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;

type IncomingMessage = {
  role: string;
  content?: string | null;
};

type BodyPayload = {
  messages: IncomingMessage[];
  chatId?: string | null;
};

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // 1. Cek User Auth
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = (await req.json()) as BodyPayload;

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return new Response("Invalid payload", { status: 400 });
    }

    const { messages, chatId } = body;

    // Ambil pesan terakhir dari user
    const lastUserMessage = messages[messages.length - 1];
    const userContent = lastUserMessage?.content ?? "";

    let currentChatId = chatId ?? null;

    // 2. Jika Chat ID belum ada (Chat Baru), Buat di DB
    if (!currentChatId) {
      const autoTitle =
        userContent.length > 40 ? userContent.substring(0, 40) + "..." : userContent;

      const newChat = await prisma.chat.create({
        data: {
          userId: user.id,
          title: autoTitle,
        },
      });
      currentChatId = newChat.id;
    }

    // 3. Simpan Pesan USER ke DB
    await prisma.message.create({
      data: {
        chatId: currentChatId,
        role: "USER",
        content: userContent,
      },
    });

    // 4. Request ke AI (OpenRouter)
    const cleanMessages = messages.map((m) => ({
      role: m.role,
      content: m.content ?? "",
    }));

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer":
          process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "Vibe Coder",
      },
      body: JSON.stringify({
        model:
          process.env.OPENROUTER_MODEL ||
          "meta-llama/llama-3-8b-instruct:free",
        messages: cleanMessages,
      }),
    });

    if (!response.ok) {
      return new Response("Error dari AI Provider", { status: 500 });
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const botReply =
      data.choices?.[0]?.message?.content || "Maaf, saya tidak bisa menjawab.";

    // 5. Simpan Pesan ASSISTANT ke DB
    await prisma.message.create({
      data: {
        chatId: currentChatId,
        role: "ASSISTANT",
        content: botReply,
      },
    });

    // 6. Return Response ke Frontend
    return new Response(
      JSON.stringify({
        reply: botReply,
        chatId: currentChatId,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error(error);
    return new Response("Terjadi kesalahan sistem.", { status: 500 });
  }
}
