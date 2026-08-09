// ─── POST /api/admin/logout ──────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, endSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const token = request.cookies.get("agriai_session")?.value;
  if (token) endSession(token);
  return clearSessionCookie(NextResponse.json({ ok: true }));
}
