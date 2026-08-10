// ─── GET /api/images?query=maize&count=4 — Unsplash crop images ───────────────

import { NextRequest, NextResponse } from "next/server";
import { getImages } from "@/lib/images";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query") || "";
  const countParam = request.nextUrl.searchParams.get("count");
  const count = Math.min(12, Number(countParam) || 4);

  const q = query.trim().slice(0, 100);
  if (!q) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const result = await getImages(q, count);
  return NextResponse.json({
    query: q,
    images: result.images,
    demo: result.demo,
  });
}
