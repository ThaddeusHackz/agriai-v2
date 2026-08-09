// ─── /api/prices — market prices (read: public, write: admin) ────────────────

import { NextRequest, NextResponse } from "next/server";
import { getDB, mutate, uid } from "@/lib/db";
import { todayISO } from "@/lib/utils";
import { getSessionUser } from "@/lib/auth";
import { searchWeb } from "@/lib/search";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const db = getDB();
  const live = request.nextUrl.searchParams.get("live") === "1";

  let liveNote: { text: string; sources: { title: string; url: string }[] } | null = null;
  if (live) {
    const res = await searchWeb("Ghana agricultural market prices today maize cocoa");
    if (!res.demo && (res.answer || res.sources.length)) {
      liveNote = {
        text: res.answer || "Live market intel refreshed.",
        sources: res.sources.slice(0, 3),
      };
    }
  }

  return NextResponse.json({
    prices: db.prices,
    updatedAt: db.meta.seededAt,
    live: liveNote,
  });
}

export async function POST(request: NextRequest) {
  const user = getSessionUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { crop, market, price, unit, trend, note } = body;

  if (!crop || !market || typeof price !== "number" || !unit) {
    return NextResponse.json({ error: "crop, market, price (number) and unit are required" }, { status: 400 });
  }

  const entry = {
    id: body.id && typeof body.id === "string" ? body.id : uid("prc"),
    crop: String(crop).slice(0, 80),
    market: String(market).slice(0, 80),
    price: Math.round(price),
    unit: String(unit).slice(0, 60),
    date: typeof body.date === "string" ? body.date : todayISO(),
    trend: trend === "up" || trend === "down" ? trend : "stable",
    note: note ? String(note).slice(0, 200) : undefined,
  };

  mutate((db) => {
    const idx = db.prices.findIndex((p) => p.id === entry.id);
    if (idx >= 0) db.prices[idx] = entry;
    else db.prices.push(entry);
  });

  return NextResponse.json({ ok: true, entry });
}

export async function DELETE(request: NextRequest) {
  const user = getSessionUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  mutate((db) => {
    db.prices = db.prices.filter((p) => p.id !== id);
  });
  return NextResponse.json({ ok: true });
}
