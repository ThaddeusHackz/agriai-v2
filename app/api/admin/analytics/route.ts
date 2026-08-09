// ─── GET /api/admin/analytics — dashboard stats ──────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDB } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = getSessionUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDB();
  const a = db.analytics;
  const today = new Date().toISOString().slice(0, 10);

  // Derive totals from the database itself (single source of truth)
  const totalMessages = db.chats.reduce((sum, c) => sum + c.messages.length, 0);

  return NextResponse.json({
    analytics: {
      totalChats: db.chats.length,
      totalMessages,
      totalFeedbackUp: a.totalFeedbackUp,
      totalFeedbackDown: a.totalFeedbackDown,
      totalSubscribers: db.subscribers.length,
      totalContacts: db.contacts.length,
      totalUsers: db.users.length,
      visits: a.visits,
      todayVisits: a.visits.find((v) => v.date === today)?.count || 0,
      todayUnique: a.visits.find((v) => v.date === today)?.unique || 0,
      topQuestions: a.questions.slice(0, 10),
      recentChats: db.chats
        .slice(-8)
        .reverse()
        .map((c) => ({
          id: c.id,
          title: c.title,
          language: c.language,
          mode: c.mode,
          messageCount: c.messages.length,
          updatedAt: c.updatedAt,
        })),
    },
  });
}
