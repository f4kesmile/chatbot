import { NextResponse } from "next/server";

export const revalidate = 300;
export const runtime = "edge";

interface OpenRouterModel {
  id: string;
  name: string;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
  };
}

interface FormattedModel {
  id: string;
  name: string;
  provider: string;
  description: string;
}

export async function GET() {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error("Gagal mengambil data dari OpenRouter");
    }

    const data = await response.json();
    const allModels: OpenRouterModel[] = data.data || [];

    const freeModels = allModels.filter(
      (m) => m.pricing.prompt === "0" && m.pricing.completion === "0"
    );

    const recommended: FormattedModel[] = [];
    const others: FormattedModel[] = [];

    const reliableVendors = [
      "meta-llama/",
      "google/",
      "microsoft/",
      "deepseek/",
      "qwen/",
      "mistralai/",
    ];

    freeModels.forEach((model) => {
      const contextK = Math.round(model.context_length / 1024);

      const formattedModel: FormattedModel = {
        id: model.id,
        name: model.name,
        provider: model.id.split("/")[0],
        description: `Context: ${contextK}k tokens`,
      };

      const isReliable = reliableVendors.some((vendor) =>
        model.id.toLowerCase().startsWith(vendor)
      );

      if (isReliable) {
        recommended.push(formattedModel);
      } else {
        others.push(formattedModel);
      }
    });

    recommended.sort((a, b) => a.name.localeCompare(b.name));
    others.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ recommended, others });
  } catch (error) {
    console.error("Error fetching models:", error);

    return NextResponse.json({
      recommended: [
        {
          id: "meta-llama/llama-3.3-70b-instruct:free",
          name: "Llama 3.3 70B (Offline Mode)",
          provider: "meta-llama",
          description: "System Offline",
        },
      ],
      others: [],
    });
  }
}