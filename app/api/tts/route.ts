// ─── POST /api/tts — ElevenLabs voice output ─────────────────────────────────

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const VOICES: Record<string, string> = {
  en: "21m00Tcm4TlvDq8ikWAM", // Rachel (English)
  fr: "21m00Tcm4TlvDq8ikWAM",
  default: "AZnzlk1XvdvUeBnXmlld", // multilingual
};

export async function POST(request: NextRequest) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "Voice output is not configured (missing ELEVENLABS_API_KEY)" }, { status: 501 });
  }
  try {
    const { text, language = "en", speed = 1.0 } = await request.json();
    const clean = (text || "").toString().trim().slice(0, 1500);
    if (!clean) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const voiceId = VOICES[language] || VOICES.default;

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": key,
      },
      body: JSON.stringify({
        text: clean,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          speed: Math.min(2, Math.max(0.5, Number(speed) || 1)),
        },
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error("[tts] ElevenLabs error:", response.status, errText.slice(0, 200));
      return NextResponse.json({ error: "Voice generation failed" }, { status: 502 });
    }

    const audioBuffer = await response.arrayBuffer();
    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Voice generation failed" }, { status: 500 });
  }
}
