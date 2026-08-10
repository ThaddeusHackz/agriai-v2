"use client";

// ─── Settings tab: platform info + danger zone ───────────────────────────────

import React, { useState } from "react";
import { AlertTriangle, Database, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "./api";

export default function SettingsTab() {
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const reset = async () => {
    if (confirm !== "RESET") {
      toast.error('Type RESET exactly to confirm');
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
        <h3 className="font-bold text-[0.98rem] text-[var(--deep)] flex items-center gap-2 mb-4">
          <Database className="w-4.5 h-4.5" style={{ color: "var(--primary)" }} /> About this deployment
        </h3>
        <dl className="grid sm:grid-cols-2 gap-4 text-[0.88rem]">
          <div>
            <dt className="label">Platform</dt>
            <dd className="text-[var(--text)]">AgriAI 2.0 — full-stack Next.js</dd>
          </div>
          <div>
            <dt className="label">Data storage</dt>
            <dd className="text-[var(--text)]">JSON document store (./data/db.json)</dd>
          </div>
          <div>
            <dt className="label">AI providers</dt>
            <dd className="text-[var(--text)]">Google Gemini · OpenAI Whisper · ElevenLabs · Tavily</dd>
          </div>
          <div>
            <dt className="label">Auth</dt>
            <dd className="text-[var(--text)]">bcrypt + signed cookie sessions (7 days)</dd>
          </div>
        </dl>
      </div>

      <div className="card rounded-3xl p-6 border-[#f5c6c2] bg-[#fffafa]">
        <h3 className="font-bold text-[0.98rem] text-[#b3261e] flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4.5 h-4.5" /> Danger zone
        </h3>
        <p className="text-[0.85rem] text-[var(--muted)] mb-4">
          Reset the entire database (chats, prices, subscribers, feedback, analytics). The site re-seeds with defaults and the admin account is recreated from environment variables.
        </p>
        <div className="flex flex-wrap gap-3 items-center">
          <input
            className="input max-w-[180px]"
            placeholder='Type RESET'
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <button onClick={reset} disabled={busy} className="btn px-6 py-2.5 text-[0.85rem] bg-[#b3261e] hover:bg-[#9a1e18] text-white">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
            Reset database
          </button>
        </div>
      </div>
    </div>
  );
}
