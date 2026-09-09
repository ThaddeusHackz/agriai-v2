"use client";

// ─── Settings tab: platform info, database status + danger zone ──────────────

import React, { useEffect, useState } from "react";
import { AlertTriangle, Database, Loader2, RefreshCw, Cloud, FileJson } from "lucide-react";
import { toast } from "sonner";
import { api } from "./api";

interface DbStatus {
  provider: "postgres" | "json";
  connected: boolean;
}

interface Providers {
  gemini: boolean;
  cloudflare: boolean;
  openweather: boolean;
  tavily: boolean;
  elevenlabs: boolean;
  unsplash: boolean;
  database: boolean;
}

export default function SettingsTab() {
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [db, setDb] = useState<DbStatus | null>(null);
  const [providers, setProviders] = useState<Providers | null>(null);
  const [syncing, setSyncing] = useState(false);

  const loadDb = async () => {
    const r = await api<{ database: DbStatus; providers?: Providers }>("/api/admin/settings");
    if (r.ok && r.data.database) setDb(r.data.database);
    if (r.ok && r.data.providers) setProviders(r.data.providers);
  };

  useEffect(() => {
    loadDb();
  }, []);

  const syncNow = async () => {
    setSyncing(true);
    const r = await api<{ message?: string }>("/api/admin/settings", {
      method: "POST",
      body: JSON.stringify({ action: "sync" }),
    });
    setSyncing(false);
    if (r.ok && r.data.message) toast.success(r.data.message);
    else toast.error("Sync failed");
    loadDb();
  };

  const reset = async () => {
    if (confirm !== "RESET") {
      toast.error("Type RESET exactly to confirm");
      return;
    }
    setBusy(true);
    const r = await api("/api/admin/reset", { method: "POST", body: JSON.stringify({ confirm }) });
    setBusy(false);
    if (r.ok) {
      toast.success("Database reset — fresh seed applied. You may need to sign in again.");
      setTimeout(() => window.location.reload(), 1200);
    } else {
      toast.error(r.data.error || "Reset failed");
    }
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="card rounded-3xl p-6">
        <h3 className="font-bold text-[0.98rem] text-[var(--ink)] flex items-center gap-2 mb-4">
          <Database className="w-4.5 h-4.5" style={{ color: "var(--primary)" }} /> About this deployment
        </h3>
        <dl className="grid sm:grid-cols-2 gap-4 text-[0.88rem]">
          <div>
            <dt className="label">Platform</dt>
            <dd className="text-[var(--text)]">AgriAI 2.0 — full-stack Next.js 16</dd>
          </div>
          <div>
            <dt className="label">Data storage</dt>
            <dd className="flex items-center gap-2 text-[var(--text)]">
              {db?.provider === "postgres" ? (
                <>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.72rem] font-bold bg-[rgba(16,185,129,0.12)] text-[#6ee7a0] border border-[rgba(16,185,129,0.3)]">
                    <Cloud className="w-3 h-3" /> PostgreSQL
                  </span>
                  {db.connected ? (
                    <span className="text-[0.72rem] text-[#6ee7a0]">● connected</span>
                  ) : (
                    <span className="text-[0.72rem] text-[#fb7185]">● unreachable (falling back to JSON)</span>
                  )}
                </>
              ) : (
                <>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.72rem] font-bold bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]">
                    <FileJson className="w-3 h-3" /> JSON file
                  </span>
                  <span className="text-[0.72rem] text-[var(--muted)]">(set DATABASE_URL for Postgres)</span>
                </>
              )}
            </dd>
          </div>
          <div>
            <dt className="label">AI providers</dt>
            <dd className="flex flex-wrap gap-1.5 pt-1">
              {providers ? (
                <>
                  {(
                    [
                      { k: "gemini", label: "Gemini" },
                      { k: "cloudflare", label: "Cloudflare" },
                      { k: "openweather", label: "OpenWeather" },
                      { k: "tavily", label: "Tavily" },
                      { k: "elevenlabs", label: "ElevenLabs" },
                      { k: "unsplash", label: "Unsplash" },
                    ] as { k: keyof Providers; label: string }[]
                  ).map((p) => (
                    <span
                      key={p.k}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-[0.72rem] font-bold border"
                      style={
                        providers[p.k]
                          ? {
                              background: "rgba(16,185,129,0.12)",
                              color: "#6ee7a0",
                              borderColor: "rgba(16,185,129,0.3)",
                            }
                          : {
                              background: "var(--surface)",
                              color: "var(--muted)",
                              borderColor: "var(--border)",
                            }
                      }
                    >
                      {providers[p.k] ? "● " : "○ "}
                      {p.label}
                    </span>
                  ))}
                </>
              ) : (
                <span className="text-[var(--muted)]">Loading…</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="label">Weather</dt>
            <dd className="text-[var(--text)]">OpenWeatherMap · Open-Meteo fallback</dd>
          </div>
          <div>
            <dt className="label">Auth</dt>
            <dd className="text-[var(--text)]">bcrypt + signed cookie sessions (7 days)</dd>
          </div>
        </dl>

        <div className="mt-5 pt-5 border-t border-[var(--border)] flex flex-wrap items-center gap-3">
          <button onClick={syncNow} disabled={syncing} className="btn btn-ghost text-[0.82rem] px-5 py-2.5">
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} /> Sync database now
          </button>
          <span className="text-[0.72rem] text-[var(--muted)]">
            Mirrors the document store to PostgreSQL instantly (writes are auto-synced every ~1.5s).
          </span>
        </div>
      </div>

      <div className="card rounded-3xl p-6 !border-[rgba(255,107,107,0.3)]">
        <h3 className="font-bold text-[0.98rem] text-[#ff9d8f] flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4.5 h-4.5" /> Danger zone
        </h3>
        <p className="text-[0.85rem] text-[var(--muted)] mb-4">
          Reset the entire database (chats, prices, subscribers, feedback, analytics). The site re-seeds with defaults and the admin account is recreated from environment variables.
        </p>
        <div className="flex flex-wrap gap-3 items-center">
          <input
            className="input max-w-[180px]"
            placeholder="Type RESET"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <button onClick={reset} disabled={busy} className="btn px-6 py-2.5 text-[0.85rem] bg-[rgba(255,107,107,0.85)] hover:bg-[#ff5f5f] text-white">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
            Reset database
          </button>
        </div>
      </div>
    </div>
  );
}
