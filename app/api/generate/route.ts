// ─── POST /api/generate — AgriAI Studio (Cloudflare Flux image generation) ──
// Powers the "Crop Visualizer" section. Requires CLOUDFLARE_API_KEY +
// CLOUDFLARE_ACCOUNT_ID (Workers AI). Returns a PNG data-URL.

import { NextRequest, NextResponse } from "next/server";
import { cloudflareConfigured, cloudflareImage } from "@/lib/cloudflare";
import { geminiConfigured, geminiImage } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

const SAFE_SUBJECTS = [
  "maize", "corn", "cocoa", "cassava", "yam", "plantain", "rice", "tomato",
  "pepper", "groundnut", "soybean", "farm", "field", "vegetable", "garden",
  "greenhouse", "irrigation", "orchard", "palm", "crop", "plantation", "harvest",
  "seedling", "soil", "pineapple", "mango", "banana", "cabbage", "lettuce",
  "okra", "eggplant", "onion", "ginger", "cowpea", "sorghum", "millet",
];

export async function POST(request: NextRequest) {
  if (!cloudflareConfigured() && !geminiConfigured()) {
    return NextResponse.json(
      { error: "AI Studio needs CLOUDFLARE_API_KEY + CLOUDFLARE_ACCOUNT_ID, or GEMINI_API_KEY / GOOGLE_API_KEY" },
      { status: 503 }
    );
  }

  let body: { prompt?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const prompt = (body.prompt || "").toString().trim().slice(0, 500);
  if (!prompt) {
    return NextResponse.json({ error: "Describe what you want to visualize" }, { status: 400 });
  }

  const low = prompt.toLowerCase();
  const relevant = SAFE_SUBJECTS.some((s) => low.includes(s));
  if (!relevant) {
    return NextResponse.json(
      { error: "Please describe a crop or farm scene (e.g. 'healthy maize field at sunrise in Ghana')" },
      { status: 400 }
    );
  }

  const fullPrompt = `${prompt}, photorealistic agricultural photography, lush healthy crops, golden hour lighting, high detail`;

  if (cloudflareConfigured()) {
    try {
      const dataUrl = await cloudflareImage(fullPrompt, { steps: 4 });
      return NextResponse.json({ ok: true, image: dataUrl, provider: "cloudflare" });
    } catch (err) {
      console.error("[generate] Cloudflare image failed:", (err as Error).message);
    }
  }

  if (geminiConfigured()) {
    try {
      const dataUrl = await geminiImage(fullPrompt);
      return NextResponse.json({ ok: true, image: dataUrl, provider: "gemini" });
    } catch (err) {
      console.error("[generate] Gemini image failed:", (err as Error).message);
    }
  }

  return NextResponse.json(
    { error: "Image generation failed — check Cloudflare Workers AI access or Gemini image models on this key" },
    { status: 502 }
  );
}
