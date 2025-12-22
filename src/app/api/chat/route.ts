import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    
    // 1. Cek User Auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { messages, chatId } = await req.json();
    
    // Ambil pesan terakhir dari user
    const lastUserMessage = messages[messages.length - 1];
    const userContent = lastUserMessage.content;

    let currentChatId = chatId;

    // 2. Jika Chat ID belum ada (Chat Baru), Buat di DB
    if (!currentChatId) {
      // Buat Judul Otomatis (Ambil 40 karakter pertama pesan user)
      const autoTitle = userContent.length > 40 
        ? userContent.substring(0, 40) + "..." 
        : userContent;

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
    const cleanMessages = messages.map((m: any) => ({
      role: m.role,
      content: m.content || "",
    }));

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "Vibe Coder",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "meta-llama/llama-3-8b-instruct:free",
        messages: cleanMessages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response("Error dari AI Provider", { status: 500 });
    }

    const data = await response.json();
    const botReply = data.choices?.[0]?.message?.content || "Maaf, saya tidak bisa menjawab.";

    // 5. Simpan Pesan ASSISTANT ke DB
    await prisma.message.create({
      data: {
        chatId: currentChatId,
        role: "ASSISTANT",
        content: botReply,
      },
    });

    // 6. Return Response ke Frontend
    return new Response(JSON.stringify({ 
      reply: botReply, 
      chatId: currentChatId 
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response("Terjadi kesalahan sistem.", { status: 500 });
  }
}