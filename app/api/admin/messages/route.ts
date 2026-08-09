// ─── /api/admin/messages — chat history viewer (admin only) ──────────────────

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDB, mutate } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = getSessionUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDB();
  const limit = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get("limit")) || 50));

  const chats = [...db.chats]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, limit)
    .map((c) => ({
      id: c.id,
      sessionId: c.sessionId,
      title: c.title,
      language: c.language,
      mode: c.mode,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      messageCount: c.messages.length,
      messages: c.messages.slice(-20),
    }));

  return NextResponse.json({ chats, total: db.chats.length });
}

export async function DELETE(request: NextRequest) {
  const user = getSessionUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  mutate((db) => {
    db.chats = db.chats.filter((c) => c.id !== id);
  });
  return NextResponse.json({ ok: true });
}
