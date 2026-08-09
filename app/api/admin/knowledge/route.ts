// ─── /api/admin/knowledge — knowledge base editor (admin only) ───────────────

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDB, mutate, uid } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = getSessionUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ knowledge: getDB().knowledge });
}

export async function POST(request: NextRequest) {
  const user = getSessionUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, question, answer, category, keywords } = await request.json().catch(() => ({}));
  if (!question || !answer) {
    return NextResponse.json({ error: "question and answer are required" }, { status: 400 });
  }

  const entry = {
    id: typeof id === "string" && id ? id : uid("kno"),
    question: String(question).slice(0, 300),
    answer: String(answer).slice(0, 6000),
    category: category ? String(category).slice(0, 60) : "General",
    keywords: Array.isArray(keywords)
      ? keywords.map(String).map((k) => k.toLowerCase()).filter(Boolean).slice(0, 20)
      : [],
    updatedAt: Date.now(),
  };

  mutate((db) => {
    const idx = db.knowledge.findIndex((k) => k.id === entry.id);
    if (idx >= 0) db.knowledge[idx] = entry;
    else db.knowledge.push(entry);
  });

  return NextResponse.json({ ok: true, entry });
}

export async function DELETE(request: NextRequest) {
  const user = getSessionUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  mutate((db) => {
    db.knowledge = db.knowledge.filter((k) => k.id !== id);
  });
  return NextResponse.json({ ok: true });
}
