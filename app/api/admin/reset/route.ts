// ─── POST /api/admin/reset — danger zone: wipe database (admin only) ─────────

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { resetDB } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const user = getSessionUser(request);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const { confirm } = await request.json().catch(() => ({}));
  if (confirm !== "RESET") {
    return NextResponse.json({ error: 'Type RESET to confirm' }, { status: 400 });
  }
  resetDB();
  return NextResponse.json({ ok: true, message: "Database reset. Fresh seed applied." });
}
