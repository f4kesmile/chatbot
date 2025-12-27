import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;

const DEFAULT_MODEL = "meta-llama/llama-3.3-70b-instruct:free";
const VISION_MODEL = "google/gemini-2.0-flash-exp:free";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // 1. FETCH SITE CONFIG (MAINTENANCE, BROADCAST, DLL)
    const { data: config } = await supabase.from("SiteConfig").select("*").eq("id", "config").maybeSingle();

    if (config?.maintenanceMode) {
      return new Response(JSON.stringify({ 
        reply: "⚠️ SISTEM MAINTENANCE: Maaf, saat ini sistem sedang dalam pemeliharaan berkala. Silakan coba lagi nanti." 
      }), { status: 200 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    const { messages, chatId, model, image } = await req.json();
    const userContent = messages[messages.length - 1]?.content ?? "";

    // 2. LOGIKA AUTO-SUMMARY (Hanya jika Chat Baru / Pembuatan Tiket)
    let aiSummaryText = null;
    if (!chatId && userContent.length > 10) {
      try {
        const summaryRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.0-flash-exp:free",
            messages: [
              { role: "system", content: "Ringkas pesan user berikut dalam 5-8 kata saja. Tanpa awalan, langsung inti masalah." },
              { role: "user", content: userContent }
            ]
          })
        });
        const summaryData = await summaryRes.json();
        aiSummaryText = summaryData.choices?.[0]?.message?.content;
      } catch (e) { console.error("Summary Failed", e); }
    }

    // 3. DATABASE: CREATE TICKET (Jika Chat Baru)
    let currentChatId = chatId;
    if (!currentChatId) {
      const newChat = await prisma.chat.create({
        data: { userId: user.id, title: aiSummaryText || userContent.substring(0, 30) }
      });
      currentChatId = newChat.id;

      // Masukkan ke SupportTicket dengan Ringkasan AI
      await supabase.from("SupportTicket").insert({
        email: user.email,
        subject: aiSummaryText || "Tiket Baru",
        message: userContent,
        status: "OPEN"
      });
    }

    // 4. PREPARE AI PAYLOAD (KNOWLEDGE BASE & TONE)
    const { data: kbData } = await supabase.from("KnowledgeBase").select("*");
    const personality = kbData?.find(d => d.category === "SYSTEM_PROMPT")?.content || "Kamu adalah asisten AI.";
    const contextStr = kbData?.filter(d => d.category === "INFO").map(k => `- [${k.title}]: ${k.content}`).join("\n");
    
    const tone = config?.botTone || "FORMAL";
    const toneInstruction = tone === "HUMOR" ? "Ceria dan humoris." : tone === "CASUAL" ? "Santai." : "Formal.";

    const systemPrompt = `PERAN: ${personality}\nGAYA: ${toneInstruction}\nKONTEKS:\n${contextStr}\nFALLBACK: ${config?.handoffMessage}`;

    // 5. FETCH COMPLETION
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: image ? VISION_MODEL : (model || DEFAULT_MODEL),
        messages: [{ role: "system", content: systemPrompt }, ...messages]
      })
    });

    const data = await response.json();
    const botReply = data.choices?.[0]?.message?.content;

    // 6. SAVE TO DB
    await prisma.message.create({ data: { chatId: currentChatId, role: "USER", content: userContent } });
    await prisma.message.create({ data: { chatId: currentChatId, role: "ASSISTANT", content: botReply } });

    return new Response(JSON.stringify({ reply: botReply, chatId: currentChatId }), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({ error: "Server Error" }), { status: 500 });
  }
}