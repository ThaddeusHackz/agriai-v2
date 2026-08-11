"use client";

// ─── Content tab: hero, announcement, stats, quick prompts ───────────────────

import React, { useEffect, useState } from "react";
import { Save, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "./api";
import type { PublicSettings } from "@/lib/site-context";

export default function ContentTab() {
  const [s, setS] = useState<PublicSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api<{ settings: PublicSettings }>("/api/config").then((r) => {
      if (r.ok) setS(r.data.settings);
    });
  }, []);

  if (!s) return <div className="h-40 animate-pulse rounded-3xl bg-[rgba(255,255,255,0.045)] border border-[var(--border)]" />;

  const set = (patch: Partial<PublicSettings>) => setS({ ...s, ...patch });

  const save = async () => {
    setBusy(true);
    const r = await api("/api/admin/settings", {
      method: "POST",
      body: JSON.stringify({
        siteName: s.siteName, tagline: s.tagline, heroTitle: s.heroTitle,
        heroSubtitle: s.heroSubtitle, heroBadge: s.heroBadge,
        announcement: s.announcement, announcementEnabled: s.announcementEnabled,
        contactEmail: s.contactEmail, footerText: s.footerText,
        stats: s.stats,
        chat: { ...s.chat, quickPrompts: s.chat.quickPrompts },
      }),
    });
    setBusy(false);
    if (r.ok) {
      setSaved(true);
      toast.success("Content saved — the live site updates instantly");
      setTimeout(() => setSaved(false), 2500);
    } else {
      toast.error(r.data.error || "Save failed");
    }
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="card rounded-3xl p-6 space-y-4">
        <h3 className="font-bold text-[0.98rem] text-[var(--ink)]">Brand</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Site name</label>
            <input className="input" value={s.siteName} onChange={(e) => set({ siteName: e.target.value })} />
          </div>
          <div>
            <label className="label">Tagline</label>
            <input className="input" value={s.tagline} onChange={(e) => set({ tagline: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="card rounded-3xl p-6 space-y-4">
        <h3 className="font-bold text-[0.98rem] text-[var(--ink)]">Hero section</h3>
        <div>
          <label className="label">Hero title</label>
          <input className="input" value={s.heroTitle} onChange={(e) => set({ heroTitle: e.target.value })} />
        </div>
        <div>
          <label className="label">Hero subtitle</label>
          <input className="input" value={s.heroSubtitle} onChange={(e) => set({ heroSubtitle: e.target.value })} />
        </div>
        <div>
          <label className="label">Hero badge</label>
          <input className="input" value={s.heroBadge} onChange={(e) => set({ heroBadge: e.target.value })} />
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {s.stats.map((st, i) => (
            <div key={i} className="space-y-1.5">
              <label className="label">Stat {i + 1} value</label>
              <input className="input" value={st.value} onChange={(e) => {
                const stats = [...s.stats];
                stats[i] = { ...stats[i], value: e.target.value };
                set({ stats });
              }} />
              <input className="input" value={st.label} placeholder="Label" onChange={(e) => {
                const stats = [...s.stats];
                stats[i] = { ...stats[i], label: e.target.value };
                set({ stats });
              }} />
            </div>
          ))}
        </div>
      </div>

      <div className="card rounded-3xl p-6 space-y-4">
        <h3 className="font-bold text-[0.98rem] text-[var(--ink)]">Announcement bar</h3>
        <label className="flex items-center gap-2.5 text-[0.88rem] text-[var(--text)]">
          <input type="checkbox" className="w-4 h-4 rounded accent-[var(--primary)]" checked={s.announcementEnabled} onChange={(e) => set({ announcementEnabled: e.target.checked })} />
          Show announcement bar
        </label>
        <input className="input" value={s.announcement} onChange={(e) => set({ announcement: e.target.value })} placeholder="🌱 Announcement text…" />
      </div>

      <div className="card rounded-3xl p-6 space-y-4">
        <h3 className="font-bold text-[0.98rem] text-[var(--ink)]">Chat assistant</h3>
        <div>
          <label className="label">Quick prompts (one per line)</label>
          <textarea
            className="input resize-none"
            rows={4}
            value={s.chat.quickPrompts.join("\n")}
            onChange={(e) => set({ chat: { ...s.chat, quickPrompts: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 8) } })}
          />
        </div>
        <div>
          <label className="label">Input placeholder</label>
          <input className="input" value={s.chat.placeholder} onChange={(e) => set({ chat: { ...s.chat, placeholder: e.target.value } })} />
        </div>
      </div>

      <div className="card rounded-3xl p-6 space-y-4">
        <h3 className="font-bold text-[0.98rem] text-[var(--ink)]">Footer</h3>
        <div>
          <label className="label">Contact email</label>
          <input className="input" value={s.contactEmail} onChange={(e) => set({ contactEmail: e.target.value })} />
        </div>
        <div>
          <label className="label">Footer text</label>
          <input className="input" value={s.footerText} onChange={(e) => set({ footerText: e.target.value })} />
        </div>
      </div>

      <button onClick={save} disabled={busy} className="btn btn-primary px-8 py-3.5 text-[0.95rem]">
        {busy ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : saved ? <CheckCircle2 className="w-4.5 h-4.5" /> : <Save className="w-4.5 h-4.5" />}
        {busy ? "Saving…" : saved ? "Saved!" : "Save all content"}
      </button>
    </div>
  );
}
