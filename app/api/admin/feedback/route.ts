// ─── /api/admin/feedback — user feedback viewer (admin only) ─────────────────

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDB, mutate } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = getSessionUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    feedback: [...getDB().feedback].sort((a, b) => b.createdAt - a.createdAt).slice(0, 100),
  });
}

export async function DELETE(request: NextRequest) {
  const user = getSessionUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  mutate((db) => {
    db.feedback = db.feedback.filter((f) => f.id !== id);
  });
  return NextResponse.json({ ok: true });
}
