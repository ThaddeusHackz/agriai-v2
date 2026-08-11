// ─── /api/admin/settings — site content & appearance (admin only) ────────────
// GET returns settings + database health. POST patches settings. An extra
// action "sync" forces an immediate mirror of the document store to Postgres.

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDB, mutate } from "@/lib/db";
import { postgresHealth, forcePostgresSave } from "@/lib/pg-store";
import { providerStatus } from "@/lib/env";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = getSessionUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDB();
  const database = await postgresHealth();
  return NextResponse.json({ settings: db.settings, database, providers: providerStatus() });
}

export async function POST(request: NextRequest) {
  const user = getSessionUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // Special action: force a manual sync to Postgres
  if (body.action === "sync") {
    const ok = await forcePostgresSave(getDB());
    return NextResponse.json({
      ok,
      message: ok ? "Database synced to PostgreSQL ✅" : "PostgreSQL is not configured or unreachable",
    });
  }

  const patch = body;
  mutate((db) => {
    const s = db.settings;
    const allowed = [
      "siteName", "tagline", "heroTitle", "heroSubtitle", "heroBadge",
      "announcement", "announcementEnabled", "primaryColor", "deepColor", "accentColor",
      "showSections", "chat", "stats", "contactEmail", "footerText",
    ];
    for (const key of allowed) {
      if (key in patch) {
        const v = patch[key];
        if (key === "showSections" && v && typeof v === "object") {
          s.showSections = { ...s.showSections, ...v };
        } else if (key === "chat" && v && typeof v === "object") {
          s.chat = { ...s.chat, ...v };
        } else if (key === "stats" && Array.isArray(v)) {
          s.stats = v.slice(0, 6).map((st: { label?: string; value?: string }) => ({
            label: String(st.label || "").slice(0, 60),
            value: String(st.value || "").slice(0, 40),
          }));
        } else if (typeof v === "string") {
          s[key as keyof typeof s] = v.slice(0, 2000) as never;
        } else if (typeof v === "boolean") {
          s[key as keyof typeof s] = v as never;
        }
      }
    }
    s.updatedAt = Date.now();
  });

  return NextResponse.json({ ok: true, settings: getDB().settings });
}
