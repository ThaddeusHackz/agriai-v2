import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "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",
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audio = formData.get('audio') as File;

    if (!audio) {
      return NextResponse.json({ error: 'No audio file' }, { status: 400 });
    }

    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: "whisper-1",
      response_format: "json",
    });

    return NextResponse.json({ 
      text: transcription.text 
    });

  } catch (error) {
    console.error('Whisper Error:', error);
    return NextResponse.json({ 
      error: 'Transcription failed' 
    }, { status: 500 });
  }
}
