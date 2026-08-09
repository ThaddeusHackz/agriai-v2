// ─── POST /api/contact — contact form ────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { mutate, uid } from "@/lib/db";
import { validEmail } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json();
    if (!name || !validEmail(email || "") || !message) {
      return NextResponse.json({ error: "Name, valid email and message are required" }, { status: 400 });
    }

    mutate((db) => {
      db.contacts.push({
        id: uid("ctc"),
        name: String(name).trim().slice(0, 80),
        email: String(email).trim().toLowerCase().slice(0, 120),
        subject: subject ? String(subject).trim().slice(0, 120) : "General inquiry",
        message: String(message).trim().slice(0, 2000),
        read: false,
        createdAt: Date.now(),
      });
    });

    return NextResponse.json({ ok: true, message: "Message sent! We'll get back to you soon. 🌱" });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
