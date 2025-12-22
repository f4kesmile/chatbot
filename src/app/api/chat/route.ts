export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // 1. Cleaning Data (Wajib)
    const cleanMessages = messages.map((m: any) => {
      let content = m.content;
      if (!content && m.parts) {
        content = m.parts
          .filter((part: any) => part.type === 'text')
          .map((part: any) => part.text)
          .join('');
      }
      return {
        role: m.role,
        content: content || '', 
      };
    });

    console.log("📨 Mengirim request Manual ke OpenRouter...");

    // 2. FETCH MANUAL (Bypass Library AI SDK)
    // Kita tembak langsung API OpenRouter layaknya kirim data biasa.
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        // Wajib untuk OpenRouter Free Tier
        "HTTP-Referer": "http://localhost:3000", 
        "X-Title": "My Local Chatbot", 
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "meta-llama/llama-3-8b-instruct:free",
        messages: cleanMessages,
      }),
    });

    // Cek jika OpenRouter Error
    if (!response.ok) {
      const errorData = await response.text(); // Baca text mentah biar tau errornya apa
      console.error("❌ OpenRouter Error:", errorData);
      return new Response(`Error dari OpenRouter: ${response.status}`, { status: 500 });
    }

    // 3. Ambil Datanya
    const data = await response.json();
    const botReply = data.choices?.[0]?.message?.content || "Maaf, tidak ada jawaban.";

    console.log("✅ AI Menjawab:", botReply.substring(0, 30) + "...");

    // 4. Kirim ke Frontend
    return new Response(botReply);

  } catch (error) {
    console.error("❌ Error System:", error);
    return new Response("Terjadi kesalahan sistem.", { status: 500 });
  }
}