import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;

const DEFAULT_MODEL = "meta-llama/llama-3.3-70b-instruct:free";
const VISION_MODEL = "google/gemini-2.0-flash-exp:free";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // 1. FETCH SITE CONFIG (MAINTENANCE, ETC)
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

    // 2. AUTO-SUMMARY (Judul Chat Baru)
    let aiSummaryText = null;
    if (!chatId && userContent.length > 10) {
      try {
        const summaryRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.0-flash-exp:free",
            messages: [
              { role: "system", content: "Ringkas pesan user berikut dalam 3-5 kata untuk judul chat. Langsung to the point." },
              { role: "user", content: userContent }
            ]
          })
        });
        const summaryData = await summaryRes.json();
        aiSummaryText = summaryData.choices?.[0]?.message?.content;
      } catch (e) { console.error("Summary Failed", e); }
    }

    // 3. DATABASE: CREATE CHAT
    let currentChatId = chatId;
    if (!currentChatId) {
      const newChat = await prisma.chat.create({
        data: { userId: user.id, title: aiSummaryText || userContent.substring(0, 30) }
      });
      currentChatId = newChat.id;
    }

    // 4. PREPARE AI CONTEXT
    // A. Knowledge Base
    const { data: kbData } = await supabase.from("KnowledgeBase").select("*");
    const personality = kbData?.find(d => d.category === "SYSTEM_PROMPT")?.content || "Kamu adalah asisten AI.";
    const contextStr = kbData?.filter(d => d.category === "INFO").map(k => `- [${k.title}]: ${k.content}`).join("\n");
    
    // --- BAGIAN INI: FITUR PREFERENSI AI ---
    // B. Ambil Custom Instructions User dari Database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { customInstructions: true }
    });
    
    // C. Format Preferensi untuk System Prompt
    const userPrefs = dbUser?.customInstructions 
      ? `\n[INSTRUKSI KHUSUS DARI USER]:\n${dbUser.customInstructions}\n(PENTING: Utamakan instruksi ini dalam gaya bicaramu.)` 
      : "";
    // ----------------------------------------

    // D. Tone Config
    const tone = config?.botTone || "FORMAL";
    const toneInstruction = tone === "HUMOR" ? "Ceria dan humoris." : tone === "CASUAL" ? "Santai." : "Formal.";

    // E. SYSTEM PROMPT FINAL
    const systemPrompt = `
    PERAN UTAMA: ${personality}
    GAYA BICARA: ${toneInstruction}

    INSTRUKSI BERPIKIR (THINKING PROCESS):
    Sebelum menjawab, lakukan proses berpikir (reasoning).
    1. Analisis pertanyaan user.
    2. Rencanakan jawaban.
    3. Tuliskan proses berpikir di dalam tag <think> ...isi pikiran... </think>.
    4. Berikan jawaban akhir setelah tag tertutup.

    DATA PENGETAHUAN:
    ${contextStr}

    ${userPrefs}

    FALLBACK MESSAGE: ${config?.handoffMessage}
    `;

    // 5. CALL AI API
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

    if (!botReply) throw new Error("No reply from AI");

    // 6. SAVE MESSAGES
    await prisma.message.create({ data: { chatId: currentChatId, role: "USER", content: userContent } });
    await prisma.message.create({ data: { chatId: currentChatId, role: "ASSISTANT", content: botReply } });

    return new Response(JSON.stringify({ reply: botReply, chatId: currentChatId }), { status: 200 });

  } catch (error) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: "Server Error" }), { status: 500 });
  }
}