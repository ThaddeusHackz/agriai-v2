// ─── POST /api/transcribe — Gemini voice input ───────────────────────────────
// Browser speech recognition is the primary voice input; this route is the
// fallback for browsers without SpeechRecognition. Audio is transcribed by
// Google Gemini (gemini-2.5-flash understands audio natively) — no extra
// provider needed, the GEMINI_API_KEY powers chat, vision AND voice.

import { NextRequest, NextResponse } from "next/server";
import { getGemini } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const client = getGemini();
  if (!client) {
    return NextResponse.json(
      { error: "Voice input is not configured (missing GEMINI_API_KEY)" },
      { status: 501 }
    );
  }
  try {
    const formData = await request.formData();
    const audio = formData.get("audio");
    if (!(audio instanceof File)) {
      return NextResponse.json({ error: "No audio file received" }, { status: 400 });
    }
    if (audio.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: "Audio file too large (max 25MB)" }, { status: 413 });
    }

    const buffer = Buffer.from(await audio.arrayBuffer());
    const mimeType = audio.type || "audio/webm";

    const { geminiGenerateText } = await import("@/lib/ai");
    const { text } = await geminiGenerateText({
      model: "gemini-2.5-flash",
      temperature: 0,
      maxOutputTokens: 1024,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: "Transcribe the speech in this audio recording verbatim. Return only the transcribed text, no commentary, no quotation marks.",
            },
            { inlineData: { mimeType, data: buffer.toString("base64") } },
          ],
        },
      ],
    });
    if (!text) throw new Error("empty transcription");
    return NextResponse.json({ text });
  } catch (err) {
    console.error("[transcribe] Gemini transcription error:", (err as Error).message);
    return NextResponse.json({ error: "Transcription failed. Please type instead." }, { status: 500 });
  }
}
