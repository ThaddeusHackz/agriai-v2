// ─── POST /api/transcribe — OpenAI Whisper voice input ───────────────────────

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "Voice input is not configured (missing OPENAI_API_KEY)" }, { status: 501 });
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

    const openai = new OpenAI({ apiKey: key });
    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: "whisper-1",
      response_format: "json",
    });

    return NextResponse.json({ text: transcription.text });
  } catch (err) {
    console.error("[transcribe] Whisper error:", err);
    return NextResponse.json({ error: "Transcription failed. Please type instead." }, { status: 500 });
  }
}
