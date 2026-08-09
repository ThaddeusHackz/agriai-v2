// ─── /api/admin/subscribers — newsletter list (admin only) ───────────────────

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDB, mutate } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = getSessionUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDB();
  const exportCsv = request.nextUrl.searchParams.get("export") === "1";
  if (exportCsv) {
    const rows = ["email,name,subscribed_at"];
    for (const s of db.subscribers) {
      rows.push([s.email, s.name || "", new Date(s.createdAt).toISOString()].join(","));
    }
    return new NextResponse(rows.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="agriai-subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return NextResponse.json({
    subscribers: [...db.subscribers].sort((a, b) => b.createdAt - a.createdAt).slice(0, 200),
  });
}

export async function DELETE(request: NextRequest) {
  const user = getSessionUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  mutate((db) => {
    db.subscribers = db.subscribers.filter((s) => s.id !== id);
    db.analytics.totalSubscribers = db.subscribers.length;
  });
  return NextResponse.json({ ok: true });
}
