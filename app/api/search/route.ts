import { NextRequest, NextResponse } from 'next/server';

const TAVILY_API_KEY = process.env.TAVILY_API_KEY || "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";

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TAVILY_API_KEY}`
      },
      body: JSON.stringify({
        query: query,
        search_depth: "advanced",
        include_answer: true,
        max_results: 6
      })
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }

    const data = await response.json();

    return NextResponse.json({
      answer: data.answer,
      results: data.results || []
    });
  } catch (error) {
    return NextResponse.json({ error: 'Web search failed' }, { status: 500 });
  }
}
