// ─── POST /api/vision — crop disease detection (Gemini vision) ───────────────

import { NextRequest, NextResponse } from "next/server";
import { detectCropDisease } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BODY = 4.5 * 1024 * 1024; // 4.5MB

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let image = body.image || "";
    const language = /^(en|tw|ga|ee|ha|fr)$/.test(body.language || "") ? body.language : "en";

    if (typeof image !== "string" || image.length < 100) {
      return NextResponse.json({ error: "A valid image is required" }, { status: 400 });
    }
    if (image.length > MAX_BODY) {
      return NextResponse.json({ error: "Image too large (max ~4MB)" }, { status: 413 });
    }

    // Normalize to a base64 data URL Gemini accepts
    if (!image.startsWith("data:")) {
      if (image.startsWith("data:image")) {
        // fine
      } else {
        image = `data:image/jpeg;base64,${image}`;
      }
    }

    const result = await detectCropDisease(image, language);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[vision] route error:", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
