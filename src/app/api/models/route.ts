import { NextResponse } from "next/server";

// Cache data selama 5 menit agar tidak memberatkan API OpenRouter
export const revalidate = 300; 
export const runtime = "edge";

export async function GET() {
  try {
    // 1. FETCH REAL DATA DARI OPENROUTER
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 3600 } 
    });

    if (!response.ok) {
      throw new Error("Gagal mengambil data dari OpenRouter");
    }

    const data = await response.json();
    const allModels = data.data || [];

    // 2. FILTER: HANYA MODEL GRATIS (REAL DATA CHECK)
    // Kita cek pricing langsung dari data API.
    const freeModels = allModels.filter(
      (m: any) => m.pricing.prompt === "0" && m.pricing.completion === "0"
    );

    const recommended: any[] = [];
    const others: any[] = [];

    // Daftar Provider Utama yang dianggap stabil (untuk pengelompokan otomatis)
    // Kita tidak hardcode ID model, tapi mendeteksi prefix vendornya.
    const reliableVendors = [
      "meta-llama/",  // Meta (Llama)
      "google/",      // Google (Gemini/Gemma)
      "microsoft/",   // Microsoft (Phi)
      "deepseek/",    // DeepSeek
      "qwen/",        // Alibaba (Qwen)
      "mistralai/"    // Mistral
    ];

    // 3. PENGELOMPOKAN & FORMATTING (TANPA EMOJI)
    freeModels.forEach((model: any) => {
      // Hitung Context Window dalam satuan 'k' (Real Data)
      const contextK = Math.round(model.context_length / 1024);
      
      const formattedModel = {
        id: model.id,
        name: model.name,
        // Ambil nama provider dari ID (misal: 'google' dari 'google/gemini...')
        provider: model.id.split("/")[0], 
        // Deskripsi teknis real data (tanpa karangan)
        description: `Context: ${contextK}k tokens` 
      };

      // Cek apakah model ini milik vendor besar?
      const isReliable = reliableVendors.some((vendor) => 
        model.id.toLowerCase().startsWith(vendor)
      );

      if (isReliable) {
        recommended.push(formattedModel);
      } else {
        others.push(formattedModel);
      }
    });

    // 4. SORTING ALFABETIS (Supaya Rapi)
    recommended.sort((a, b) => a.name.localeCompare(b.name));
    others.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ recommended, others });

  } catch (error) {
    console.error("Error fetching models:", error);
    
    // Fallback darurat jika OpenRouter down (Hanya teks, tanpa emoji)
    return NextResponse.json({ 
        recommended: [{ 
          id: "meta-llama/llama-3.3-70b-instruct:free", 
          name: "Llama 3.3 70B (Offline Mode)", 
          provider: "meta-llama", 
          description: "System Offline" 
        }], 
        others: [] 
    });
  }
}