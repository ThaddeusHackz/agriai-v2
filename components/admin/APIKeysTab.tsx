"use client";

// ─── API Keys tab — paste, test & save provider keys (admin only) ────────────
// Keys are persisted server-side (document store + PostgreSQL mirror), take
// effect immediately, and survive restarts. Values are masked in the UI.

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  KeyRound, Eye, EyeOff, Save, Loader2, CheckCircle2, ShieldCheck,
  FlaskConical, Trash2, CloudCog, CircleCheck, CircleX,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "./api";

type SecretField =
  | "gemini"
  | "cloudflareApi"
  | "cloudflareAccountId"
  | "openweather"
  | "tavily"
  | "elevenlabs"
  | "unsplash";

interface KeyStatus {
  provider: string;
  field: SecretField;
  configured: boolean;
  source: "stored" | "env" | null;
  last4: string | null;
}

interface KeysPayload {
  keys: KeyStatus[];
  providers: {
    gemini: boolean;
    cloudflare: boolean;
    openweather: boolean;
    tavily: boolean;
    elevenlabs: boolean;
    unsplash: boolean;
    database: boolean;
  };
  database: { provider: "postgres" | "json"; connected: boolean };
}

interface ProbeOutcome {
  ok: boolean;
  detail: string;
  latencyMs: number;
}

const FIELDS: {
  field: SecretField;
  label: string;
  hint: string;
  testProvider: string;
  placeholder: string;
  accountField?: SecretField;
}[] = [
  {
    field: "gemini",
    label: "Google Gemini API key",
    hint: "Powers chat, crop-disease vision and voice transcription.",
    testProvider: "gemini",
    placeholder: "AIza…",
  },
  {
    field: "cloudflareApi",
    label: "Cloudflare API token",
    hint: "Fallback LLM (Llama 3.3 70B) + AI Studio image generation.",
    testProvider: "cloudflare",
    placeholder: "Cloudflare API token",
    accountField: "cloudflareAccountId",
  },
  {
    field: "cloudflareAccountId",
    label: "Cloudflare Account ID",
    hint: "Found on the right sidebar of the Cloudflare dashboard.",
    testProvider: "cloudflare",
    placeholder: "32-hex account id",
  },
  {
    field: "openweather",
    label: "OpenWeatherMap API key",
    hint: "Live 5-day weather forecasts for Ghana.",
    testProvider: "openweather",
    placeholder: "OpenWeather key",
  },
  {
    field: "tavily",
    label: "Tavily API key",
    hint: "Live web search with citations (optional).",
    testProvider: "tavily",
    placeholder: "tvly-…",
  },
  {
    field: "elevenlabs",
    label: "ElevenLabs API key",
    hint: "Voice output — reads answers aloud (optional).",
    testProvider: "elevenlabs",
    placeholder: "ElevenLabs key",
  },
  {
    field: "unsplash",
    label: "Unsplash Access key",
    hint: "Crop photos for the market price board (optional).",
    testProvider: "unsplash",
    placeholder: "Unsplash access key",
  },
];

export default function APIKeysTab() {
  const [status, setStatus] = useState<KeysPayload | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [diagnosing, setDiagnosing] = useState(false);
  const [report, setReport] = useState<Record<string, ProbeOutcome> | null>(null);

  const load = useCallback(async () => {
    const r = await api<KeysPayload>("/api/admin/apikeys");
    if (r.ok && r.data.keys) {
      setStatus(r.data);
      setForm((prev) => {
        const next = { ...prev };
        for (const k of r.data.keys) {
          if (next[k.field] === undefined) next[k.field] = "";
        }
        return next;
      });
    } else {
      toast.error(r.data?.error || "Failed to load API key status");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const byField = useMemo(() => {
    const map: Record<string, KeyStatus> = {};
    if (status) for (const k of status.keys) map[k.field] = k;
    return map;
  }, [status]);

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));
  const toggleReveal = (field: string) => setRevealed((r) => ({ ...r, [field]: !r[field] }));

  const save = async () => {
    setSaving(true);
    const r = await api<{ saved?: number }>("/api/admin/apikeys", {
      method: "POST",
      body: JSON.stringify({ action: "save", secrets: form }),
    });
    setSaving(false);
    if (r.ok) {
      setSaved(true);
      toast.success(r.data.saved ? "API keys saved and activated" : "API keys saved");
      setTimeout(() => setSaved(false), 2500);
      load();
    } else {
      toast.error(r.data?.error || "Save failed");
    }
  };

  const clearField = async (field: SecretField) => {
    const r = await api("/api/admin/apikeys", {
      method: "POST",
      body: JSON.stringify({ action: "clear", key: field }),
    });
    if (r.ok) {
      setForm((f) => ({ ...f, [field]: "" }));
      toast.success("Key removed");
      load();
    } else {
      toast.error(r.data?.error || "Failed to remove key");
    }
  };

  const testField = async (field: SecretField) => {
    const def = FIELDS.find((f) => f.field === field)!;
    const key = (form[field] || "").trim();
    const accountId = def.accountField ? (form[def.accountField] || "").trim() : undefined;
    if (!key) {
      toast.error(`Paste a ${def.label} first`);
      return;
    }
    setTesting(field);
    setReport(null);
    const r = await api<{ ok: boolean; result: ProbeOutcome }>("/api/admin/apikeys", {
      method: "POST",
      body: JSON.stringify({ action: "test", provider: def.testProvider, key, accountId }),
    });
    setTesting(null);
    if (r.ok && r.data.result) {
      const res = r.data.result;
      setReport({ [def.testProvider]: res });
      if (res.ok) toast.success(`${def.label}: ${res.detail}`);
      else toast.error(`${def.label}: ${res.detail}`);
    } else {
      toast.error(r.data?.error || "Test failed");
    }
  };

  const runDiagnostic = async () => {
    setDiagnosing(true);
    setReport(null);
    const outcomes: Record<string, ProbeOutcome> = {};
    for (const def of FIELDS) {
      const key = (form[def.field] || "").trim();
      if (!key) continue;
      // Cloudflare is diagnosed once (token + account id).
      if (def.testProvider === "cloudflare" && outcomes.cloudflare) continue;
      const accountId = def.accountField ? (form[def.accountField] || "").trim() : undefined;
      const r = await api<{ ok: boolean; result: ProbeOutcome }>("/api/admin/apikeys", {
        method: "POST",
        body: JSON.stringify({ action: "test", provider: def.testProvider, key, accountId }),
      });
      if (r.ok && r.data.result) outcomes[def.testProvider] = r.data.result;
    }
    setDiagnosing(false);
    setReport(outcomes);
    const allOk = Object.values(outcomes).every((o) => o.ok);
    toast[allOk ? "success" : "info"](
      allOk ? "All pasted keys verified ✅" : "Diagnostic finished — review the results below"
    );
  };

  const statusBadge = (k: KeyStatus | undefined) => {
    if (!k) return null;
    if (!k.configured) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[0.7rem] font-bold px-2.5 py-1 rounded-full bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]">
          <CircleX className="w-3 h-3 text-[#fb7185]" /> not set
        </span>
      );
    }
    return (
      <span
        className="inline-flex items-center gap-1.5 text-[0.7rem] font-bold px-2.5 py-1 rounded-full border"
        style={{
          background: "rgba(16,185,129,0.12)",
          color: "#6ee7a0",
          borderColor: "rgba(16,185,129,0.3)",
        }}
      >
        <CircleCheck className="w-3 h-3" /> set {k.last4 ? `(…${k.last4.slice(-4)})` : ""}
        {k.source === "stored" ? " · panel" : k.source === "env" ? " · env" : ""}
      </span>
    );
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="card rounded-3xl p-6">
        <h3 className="font-bold text-[0.98rem] text-[var(--ink)] flex items-center gap-2 mb-2">
          <KeyRound className="w-4.5 h-4.5" style={{ color: "var(--primary)" }} /> API keys & providers
        </h3>
        <p className="text-[0.85rem] text-[var(--muted)] mb-5">
          Paste your keys below, test them live, then save. They are stored on the server (and mirrored to the
          database), so they keep working permanently — even across restarts and deploys — and are never sent to
          the browser in full.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mb-5">
          <div className="rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.03)] p-4">
            <div className="flex items-center gap-2 text-[0.8rem] font-bold text-[var(--ink)]">
              <CloudCog className="w-4 h-4" style={{ color: "var(--primary)" }} /> Storage
            </div>
            <div className="text-[0.78rem] text-[var(--muted)] mt-1.5">
              {status?.database.provider === "postgres"
                ? status.database.connected
                  ? "PostgreSQL — keys persist across deploys ✅"
                  : "PostgreSQL configured but unreachable (falling back to JSON)"
                : "JSON file store — set DATABASE_URL for cross-deploy persistence"}
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.03)] p-4">
            <div className="flex items-center gap-2 text-[0.8rem] font-bold text-[var(--ink)]">
              <ShieldCheck className="w-4 h-4" style={{ color: "var(--primary)" }} /> Active providers
            </div>
            <div className="text-[0.78rem] text-[var(--muted)] mt-1.5">
              {status
                ? [
                    status.providers.gemini && "Gemini",
                    status.providers.cloudflare && "Cloudflare",
                    status.providers.openweather && "OpenWeather",
                    status.providers.tavily && "Tavily",
                    status.providers.elevenlabs && "ElevenLabs",
                    status.providers.unsplash && "Unsplash",
                  ]
                    .filter(Boolean)
                    .join(" · ") || "none configured yet"
                : "loading…"}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {FIELDS.map((def) => {
            const k = byField[def.field];
            const value = form[def.field] ?? "";
            return (
              <div key={def.field} className="rounded-2xl border border-[var(--border)] p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <label className="label mb-0">{def.label}</label>
                  {statusBadge(k)}
                </div>
                <p className="text-[0.75rem] text-[var(--muted)] mb-2.5">{def.hint}</p>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type={revealed[def.field] ? "text" : "password"}
                      className="input pr-16"
                      placeholder={def.placeholder}
                      value={value}
                      autoComplete="off"
                      spellCheck={false}
                      onChange={(e) => set(def.field, e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => toggleReveal(def.field)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-[var(--surface)] text-[var(--muted)]"
                      title={revealed[def.field] ? "Hide" : "Reveal"}
                    >
                      {revealed[def.field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    onClick={() => testField(def.field)}
                    disabled={testing === def.field || !value.trim()}
                    className="btn btn-ghost text-[0.8rem] px-4 py-2.5 shrink-0 disabled:opacity-40"
                  >
                    {testing === def.field ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
                    Test
                  </button>
                  <button
                    onClick={() => clearField(def.field)}
                    disabled={!k?.configured}
                    className="p-2.5 rounded-xl hover:bg-[rgba(255,107,107,0.1)] text-[var(--muted)] disabled:opacity-30 transition"
                    title="Remove stored key"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button onClick={save} disabled={saving} className="btn btn-primary px-8 py-3.5 text-[0.95rem]">
            {saving ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : saved ? <CheckCircle2 className="w-4.5 h-4.5" /> : <Save className="w-4.5 h-4.5" />}
            {saving ? "Saving…" : saved ? "Saved!" : "Save all keys"}
          </button>
          <button onClick={runDiagnostic} disabled={diagnosing} className="btn btn-ghost px-6 py-3.5 text-[0.9rem]">
            {diagnosing ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <ShieldCheck className="w-4.5 h-4.5" />}
            {diagnosing ? "Scanning…" : "Run full diagnostic"}
          </button>
        </div>
      </div>

      {report && Object.keys(report).length > 0 && (
        <div className="card rounded-3xl p-6">
          <h3 className="font-bold text-[0.98rem] text-[var(--ink)] flex items-center gap-2 mb-4">
            <ShieldCheck className="w-4.5 h-4.5" style={{ color: "var(--primary)" }} /> Forensic scan results
          </h3>
          <div className="space-y-2.5">
            {Object.entries(report).map(([provider, out]) => (
              <div
                key={provider}
                className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-4 py-3"
              >
                {out.ok ? (
                  <CircleCheck className="w-4.5 h-4.5 mt-0.5 text-[#34d399] shrink-0" />
                ) : (
                  <CircleX className="w-4.5 h-4.5 mt-0.5 text-[#fb7185] shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="text-[0.85rem] font-bold text-[var(--ink)] capitalize">{provider}</div>
                  <div className="text-[0.8rem] text-[var(--muted)] break-words">{out.detail}</div>
                </div>
                <span className="ml-auto text-[0.72rem] text-[var(--muted)] shrink-0">{out.latencyMs}ms</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
