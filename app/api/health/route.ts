// ─── GET /api/health — provider forensic status (no secrets) ─────────────────

import { NextResponse } from "next/server";
import { providerStatus } from "@/lib/env";
import { geminiConfigured, getGemini } from "@/lib/ai";
import { cloudflareConfigured } from "@/lib/cloudflare";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET() {
  const providers = providerStatus();
  const checks: Record<string, { configured: boolean; live?: boolean; error?: string }> = {
    gemini: { configured: providers.gemini },
    cloudflare: { configured: providers.cloudflare },
    openweather: { configured: providers.openweather },
    tavily: { configured: providers.tavily },
    elevenlabs: { configured: providers.elevenlabs },
    unsplash: { configured: providers.unsplash },
    database: { configured: providers.database },
  };

  if (geminiConfigured()) {
    try {
      const client = getGemini()!;
      const res = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [{ role: "user", parts: [{ text: "Reply with the single word OK" }] }],
        config: { maxOutputTokens: 8, temperature: 0, thinkingConfig: { thinkingBudget: 0 } },
      });
      const text = (res.text || "").trim();
      checks.gemini.live = /ok/i.test(text) || text.length > 0;
      if (!checks.gemini.live) checks.gemini.error = "empty ping";
    } catch (err) {
      checks.gemini.live = false;
      checks.gemini.error = (err as Error).message.slice(0, 220);
    }
  }

  checks.cloudflare.live = cloudflareConfigured() ? undefined : false;

  return NextResponse.json({
    ok: true,
    version: "2.0.0",
    providers: checks,
    aliases: {
      gemini: ["GEMINI_API_KEY", "GOOGLE_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY"],
      cloudflare: ["CLOUDFLARE_API_KEY + CLOUDFLARE_ACCOUNT_ID"],
    },
  });
}
