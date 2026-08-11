"use client";

// ─── Appearance tab: colors + section visibility ─────────────────────────────

import React, { useEffect, useState } from "react";
import { Save, Loader2, CheckCircle2, Palette } from "lucide-react";
import { toast } from "sonner";
import { api } from "./api";
import { applyTheme } from "@/lib/site-context";

interface Settings {
  primaryColor: string;
  deepColor: string;
  accentColor: string;
  showSections: Record<string, boolean>;
}

const SECTIONS: { key: string; label: string }[] = [
  { key: "features", label: "Features grid" },
  { key: "prices", label: "Market prices" },
  { key: "weather", label: "Weather forecast" },
  { key: "disease", label: "Disease detection" },
  { key: "how", label: "How it works" },
  { key: "testimonials", label: "Testimonials" },
  { key: "team", label: "Founder section" },
  { key: "faq", label: "FAQ" },
  { key: "newsletter", label: "Newsletter" },
  { key: "studio", label: "AI Studio (crop visualizer)" },
];

export default function AppearanceTab() {
  const [s, setS] = useState<Settings | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api<{ settings: Settings }>("/api/config").then((r) => {
      if (r.ok) setS(r.data.settings);
    });
  }, []);

  if (!s) return <div className="h-40 animate-pulse rounded-3xl bg-[rgba(255,255,255,0.045)] border border-[var(--border)]" />;

  const save = async () => {
    setBusy(true);
    const r = await api("/api/admin/settings", {
      method: "POST",
      body: JSON.stringify({ primaryColor: s.primaryColor, deepColor: s.deepColor, accentColor: s.accentColor, showSections: s.showSections }),
    });
    setBusy(false);
    if (r.ok) {
      applyTheme(s as unknown as Parameters<typeof applyTheme>[0]);
      setSaved(true);
      toast.success("Appearance saved");
      setTimeout(() => setSaved(false), 2500);
    } else {
      toast.error(r.data.error || "Save failed");
    }
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="card rounded-3xl p-6">
        <h3 className="font-bold text-[0.98rem] text-[var(--ink)] flex items-center gap-2 mb-5">
          <Palette className="w-4.5 h-4.5" style={{ color: "var(--primary)" }} /> Brand colors
        </h3>
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            { key: "primaryColor" as const, label: "Primary", hint: "Buttons, accents" },
            { key: "deepColor" as const, label: "Deep green", hint: "Headings" },
            { key: "accentColor" as const, label: "Accent", hint: "Highlights" },
          ].map((c) => (
            <div key={c.key} className="space-y-2.5">
              <label className="label">{c.label} — {c.hint}</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={s[c.key]}
                  onChange={(e) => setS({ ...s, [c.key]: e.target.value })}
                  className="w-14 h-12 rounded-xl border border-[var(--border)] cursor-pointer bg-[rgba(255,255,255,0.045)] p-1"
                />
                <input
                  className="input font-mono text-[0.8rem]"
                  value={s[c.key]}
                  onChange={(e) => setS({ ...s, [c.key]: e.target.value })}
                />
              </div>
            </div>
          ))}
        </div>

        {/* live preview */}
        <div className="mt-6 rounded-3xl border border-[var(--border)] p-6 bg-[rgba(255,255,255,0.045)]">
          <div className="text-[0.72rem] font-bold uppercase tracking-wider text-[var(--muted)] mb-3">Live preview</div>
          <div className="rounded-2xl text-[#03230f] px-5 py-4 text-[0.9rem] font-bold" style={{ background: s.primaryColor }}>
            Primary button & chat bubbles
          </div>
          <div className="mt-3 text-[1.4rem] font-bold" style={{ color: s.deepColor }}>Deep heading color</div>
          <div className="mt-3 inline-flex items-center gap-1.5 text-[0.8rem] font-bold px-4 py-2 rounded-full" style={{ background: s.accentColor, color: "#2a1c00" }}>
            ★ Accent highlights
          </div>
        </div>
      </div>

      <div className="card rounded-3xl p-6">
        <h3 className="font-bold text-[0.98rem] text-[var(--ink)] mb-5">Page sections</h3>
        <div className="space-y-2.5">
          {SECTIONS.map((sec) => (
            <label key={sec.key} className="flex items-center justify-between border border-[var(--border)] rounded-2xl px-4 py-3.5 cursor-pointer hover:bg-[var(--surface)]/60 transition">
              <span className="text-[0.9rem] font-medium text-[var(--text)]">{sec.label}</span>
              <input
                type="checkbox"
                className="w-4.5 h-4.5 rounded accent-[var(--primary)]"
                checked={Boolean(s.showSections[sec.key])}
                onChange={(e) => setS({ ...s, showSections: { ...s.showSections, [sec.key]: e.target.checked } })}
              />
            </label>
          ))}
        </div>
      </div>

      <button onClick={save} disabled={busy} className="btn btn-primary px-8 py-3.5 text-[0.95rem]">
        {busy ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : saved ? <CheckCircle2 className="w-4.5 h-4.5" /> : <Save className="w-4.5 h-4.5" />}
        {busy ? "Saving…" : saved ? "Saved!" : "Save appearance"}
      </button>
    </div>
  );
}
