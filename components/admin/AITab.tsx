"use client";

// ─── AI Settings tab: model, prompts, modes ──────────────────────────────────

import React, { useEffect, useState } from "react";
import { Save, Loader2, CheckCircle2, Brain } from "lucide-react";
import { toast } from "sonner";
import { api } from "./api";

interface ChatSettings {
  model: string;
  visionModel: string;
  temperature: number;
  maxTokens: number;
  webSearchDefault: boolean;
  defaultMode: "standard" | "expert" | "agent";
  placeholder: string;
  quickPrompts: string[];
  systemPrompt: string;
  expertPrompt: string;
  agentPrompt: string;
}

// Google Gemini models. Source of truth: https://ai.google.dev/gemini-api/docs/models
const MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
];

// Gemini multimodal (vision-capable) models for crop disease detection.
const VISION_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
];

export default function AITab() {
  const [s, setS] = useState<ChatSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api<{ settings: { chat: ChatSettings } }>("/api/config").then((r) => {
      if (r.ok) setS(r.data.settings.chat);
    });
  }, []);

  if (!s) return <div className="h-40 animate-pulse rounded-3xl bg-[rgba(255,255,255,0.045)] border border-[var(--border)]" />;

  const set = (patch: Partial<ChatSettings>) => setS({ ...s, ...patch });

  const save = async () => {
    setBusy(true);
    const r = await api("/api/admin/settings", {
      method: "POST",
      body: JSON.stringify({ chat: s }),
    });
    setBusy(false);
    if (r.ok) {
      setSaved(true);
      toast.success("AI settings saved");
      setTimeout(() => setSaved(false), 2500);
    } else {
      toast.error(r.data.error || "Save failed");
    }
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="card rounded-3xl p-6">
        <h3 className="font-bold text-[0.98rem] text-[var(--ink)] flex items-center gap-2 mb-5">
          <Brain className="w-4.5 h-4.5" style={{ color: "var(--primary)" }} /> Model configuration
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Chat model (Gemini)</label>
            <select className="input" value={s.model} onChange={(e) => set({ model: e.target.value })}>
              {[...new Set([s.model, ...MODELS])].map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Vision model (disease detection)</label>
            <select className="input" value={s.visionModel} onChange={(e) => set({ visionModel: e.target.value })}>
              {[...new Set([s.visionModel, ...VISION_MODELS])].map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Temperature ({s.temperature})</label>
            <input
              type="range" min={0} max={1.5} step={0.05}
              value={s.temperature}
              onChange={(e) => set({ temperature: Number(e.target.value) })}
              className="w-full accent-[var(--primary)]"
            />
          </div>
          <div>
            <label className="label">Max tokens ({s.maxTokens})</label>
            <input
              type="range" min={200} max={2048} step={50}
              value={s.maxTokens}
              onChange={(e) => set({ maxTokens: Number(e.target.value) })}
              className="w-full accent-[var(--primary)]"
            />
          </div>
        </div>
        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          <label className="flex items-center gap-2.5 text-[0.88rem] border border-[var(--border)] rounded-2xl px-4 py-3.5 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded accent-[var(--primary)]" checked={s.webSearchDefault} onChange={(e) => set({ webSearchDefault: e.target.checked })} />
            Web search ON by default
          </label>
          <label className="flex items-center gap-2.5 text-[0.88rem] border border-[var(--border)] rounded-2xl px-4 py-3.5 cursor-pointer">
            <span>Default mode:</span>
            <select
              className="font-semibold bg-transparent outline-none"
              value={s.defaultMode}
              onChange={(e) => set({ defaultMode: e.target.value as ChatSettings["defaultMode"] })}
            >
              <option value="standard">Standard</option>
              <option value="expert">Expert</option>
              <option value="agent">Agent</option>
            </select>
          </label>
        </div>
      </div>

      {([
        { key: "systemPrompt", label: "Standard system prompt" },
        { key: "expertPrompt", label: "Expert mode prompt" },
        { key: "agentPrompt", label: "Agent mode prompt" },
      ] as const).map((p) => (
        <div key={p.key} className="card rounded-3xl p-6">
          <label className="label">{p.label}</label>
          <textarea
            className="input resize-none font-[0.85rem] leading-relaxed"
            rows={6}
            value={s[p.key]}
            onChange={(e) => set({ [p.key]: e.target.value } as Partial<ChatSettings>)}
          />
        </div>
      ))}

      <button onClick={save} disabled={busy} className="btn btn-primary px-8 py-3.5 text-[0.95rem]">
        {busy ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : saved ? <CheckCircle2 className="w-4.5 h-4.5" /> : <Save className="w-4.5 h-4.5" />}
        {busy ? "Saving…" : saved ? "Saved!" : "Save AI settings"}
      </button>
    </div>
  );
}
