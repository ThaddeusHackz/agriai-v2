// ─── POST /api/track — lightweight visitor analytics ─────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { trackVisit } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { visitorId } = await request.json();
    trackVisit(typeof visitorId === "string" && visitorId ? visitorId.slice(0, 64) : null);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
