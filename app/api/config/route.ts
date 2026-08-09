// ─── GET /api/config — public site settings (no auth) ────────────────────────

import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const s = getDB().settings;
  return NextResponse.json({
    settings: {
      siteName: s.siteName,
      tagline: s.tagline,
      heroTitle: s.heroTitle,
      heroSubtitle: s.heroSubtitle,
      heroBadge: s.heroBadge,
      announcement: s.announcement,
      announcementEnabled: s.announcementEnabled,
      primaryColor: s.primaryColor,
      deepColor: s.deepColor,
      accentColor: s.accentColor,
      showSections: s.showSections,
      chat: {
        placeholder: s.chat.placeholder,
        quickPrompts: s.chat.quickPrompts,
        webSearchDefault: s.chat.webSearchDefault,
        defaultMode: s.chat.defaultMode,
        model: s.chat.model,
      },
      stats: s.stats,
      contactEmail: s.contactEmail,
      footerText: s.footerText,
    },
    version: "2.0.0",
  });
}
