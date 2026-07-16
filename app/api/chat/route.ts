import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "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",
});

export async function POST(request: NextRequest) {
  try {
    const { message, language = 'en' } = await request.json();

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are AgriAI, Ghana's intelligent farming assistant. 
          Reply in the language the user is using. 
          Be helpful, practical, and concise. Focus on Ghanaian agriculture.`
        },
        { role: "user", content: message }
      ],
      max_tokens: 500,
    });

    return NextResponse.json({ 
      response: completion.choices[0].message.content 
    });
  } catch (error) {
    return NextResponse.json({ 
      response: "I'm sorry, I couldn't process that right now." 
    }, { status: 500 });
  }
}
