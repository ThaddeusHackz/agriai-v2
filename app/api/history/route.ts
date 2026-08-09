// ─── /api/history — browser chat history persistence ─────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getDB, mutate, uid } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ chat: null });

  const chat = getDB().chats.find((c) => c.sessionId === sessionId);
  return NextResponse.json({ chat: chat || null });
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, chat } = await request.json();
    if (!sessionId || !chat || !Array.isArray(chat.messages)) {
      return NextResponse.json({ error: "sessionId and chat.messages required" }, { status: 400 });
    }

    const now = Date.now();
    const messages = chat.messages
      .filter((m: { role?: string; content?: string }) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-60)
      .map((m: { role: string; content: string; id?: string; language?: string; mode?: string; ts?: number }) => ({
        id: m.id || uid("msg"),
        role: m.role as "user" | "assistant",
        content: m.content.slice(0, 6000),
        language: m.language || "en",
        mode: m.mode || "standard",
        ts: m.ts || now,
      }));

    mutate((db) => {
      const existing = db.chats.find((c) => c.sessionId === sessionId);
      if (existing) {
        existing.messages = messages;
        existing.updatedAt = now;
        existing.language = chat.language || existing.language;
        existing.mode = chat.mode || existing.mode;
      } else {
        db.chats.push({
          id: uid("cht"),
          sessionId: String(sessionId).slice(0, 64),
          title: (chat.title || messages[0]?.content || "New chat").slice(0, 70),
          language: chat.language || "en",
          mode: chat.mode || "standard",
          messages,
          createdAt: now,
          updatedAt: now,
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  mutate((db) => {
    db.chats = db.chats.filter((c) => c.sessionId !== sessionId);
  });
  return NextResponse.json({ ok: true });
}
