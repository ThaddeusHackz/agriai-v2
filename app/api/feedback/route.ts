// ─── POST /api/feedback — thumbs up/down on AI answers ───────────────────────

import { NextRequest, NextResponse } from "next/server";
import { mutate, uid } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { chatId, messageId, value, comment } = await request.json();
    if (!messageId || (value !== "up" && value !== "down")) {
      return NextResponse.json({ error: "messageId and value (up|down) required" }, { status: 400 });
    }

    mutate((db) => {
      db.feedback.push({
        id: uid("fb"),
        chatId: chatId ? String(chatId).slice(0, 64) : "",
        messageId: String(messageId).slice(0, 64),
        value,
        comment: comment ? String(comment).slice(0, 500) : undefined,
        createdAt: Date.now(),
      });
      if (value === "up") db.analytics.totalFeedbackUp += 1;
      else db.analytics.totalFeedbackDown += 1;
      // mark on the message too
      for (const chat of db.chats) {
        const msg = chat.messages.find((m) => m.id === messageId);
        if (msg) msg.feedback = value;
      }
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
