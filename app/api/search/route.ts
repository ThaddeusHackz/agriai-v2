// ─── POST /api/search — standalone Tavily web search ─────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { searchWeb } from "@/lib/search";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const q = (body.query || body.q || "").toString().trim().slice(0, 300);
    if (!q) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }
    const result = await searchWeb(q);
    return NextResponse.json({
      answer: result.answer || null,
      results: result.sources,
      demo: result.demo,
    });
  } catch {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
