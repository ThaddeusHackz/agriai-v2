// ─── POST /api/subscribe — newsletter signup ─────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { mutate, uid } from "@/lib/db";
import { validEmail } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();
    const clean = String(email || "").trim().toLowerCase();
    if (!validEmail(clean)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }

    const created = mutate((db) => {
      const exists = db.subscribers.some((s) => s.email === clean);
      if (exists) return false;
      db.subscribers.push({
        id: uid("sub"),
        email: clean,
        name: name ? String(name).trim().slice(0, 80) : undefined,
        createdAt: Date.now(),
      });
      db.analytics.totalSubscribers = db.subscribers.length;
      return true;
    });

    return NextResponse.json({
      ok: true,
      message: created ? "Subscribed! Welcome to AgriAI updates 🌱" : "You're already subscribed 🌱",
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
