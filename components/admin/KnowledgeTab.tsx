"use client";

// ─── Knowledge Base tab: offline Q&A entries ─────────────────────────────────

import React, { useEffect, useState } from "react";
import { Plus, Save, Trash2, Pencil, Loader2, X, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { api } from "./api";

interface Entry {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
}

const EMPTY: Entry = { id: "", question: "", answer: "", category: "General", keywords: [] };

export default function KnowledgeTab() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [editing, setEditing] = useState<Entry | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const r = await api<{ knowledge: Entry[] }>("/api/admin/knowledge");
    if (r.ok) setEntries(r.data.knowledge);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!editing) return;
    if (!editing.question.trim() || !editing.answer.trim()) {
      toast.error("Question and answer are required");
      return;
    }
    setBusy(true);
    const r = await api("/api/admin/knowledge", {
      method: "POST",
      body: JSON.stringify({
        ...editing,
        keywords: editing.keywords.filter(Boolean),
      }),
    });
    setBusy(false);
    if (r.ok) {
      toast.success("Knowledge entry saved");
      setEditing(null);
      load();
    } else {
      toast.error(r.data.error || "Save failed");
    }
  };

  const remove = async (id: string) => {
    const r = await api(`/api/admin/knowledge?id=${id}`, { method: "DELETE" });
    if (r.ok) {
      toast.success("Entry deleted");
      load();
    }
  };

  return (
    <div className="space-y-5">
      <div className="card rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[0.98rem] text-[var(--deep)] flex items-center gap-2">
            <BookOpen className="w-4.5 h-4.5" style={{ color: "var(--primary)" }} />
            {editing?.id ? "Edit entry" : "New knowledge entry"}
          </h3>
          {editing?.id && (
            <button onClick={() => setEditing(null)} className="text-[0.78rem] text-[var(--muted)] hover:text-[var(--deep)] inline-flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          )}
        </div>
        <div className="space-y-3">
          <input className="input" placeholder="Question (e.g. Best time to plant maize in Ghana)" value={editing?.question || ""} onChange={(e) => setEditing({ ...(editing || EMPTY), question: e.target.value })} />
          <div className="grid sm:grid-cols-2 gap-3">
            <input className="input" placeholder="Category (e.g. Crops, Disease, Markets)" value={editing?.category || ""} onChange={(e) => setEditing({ ...(editing || EMPTY), category: e.target.value })} />
            <input className="input" placeholder="Keywords (comma separated: maize, planting, season)" value={editing?.keywords.join(", ") || ""} onChange={(e) => setEditing({ ...(editing || EMPTY), keywords: e.target.value.split(",").map((k) => k.trim()).filter(Boolean) })} />
          </div>
          <textarea className="input resize-none" rows={6} placeholder="Answer (markdown supported)…" value={editing?.answer || ""} onChange={(e) => setEditing({ ...(editing || EMPTY), answer: e.target.value })} />
        </div>
        <button onClick={save} disabled={busy || !editing} className="btn btn-primary mt-4 px-6 py-2.5 text-[0.88rem]">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {editing?.id ? "Update entry" : "Add entry"}
        </button>
      </div>

      <div className="card rounded-3xl overflow-hidden">
        <div className="px-6 py-4 border-b bg-white font-bold text-[0.98rem] text-[var(--deep)]">
          Knowledge base ({entries.length})
        </div>
        {loading ? (
          <div className="p-8 text-center text-[var(--muted)] text-[0.85rem]">Loading…</div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {entries.map((e) => (
              <div key={e.id} className="px-6 py-4 flex items-start gap-3 hover:bg-[var(--surface)]/50">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[0.9rem] text-[var(--deep)]">{e.question}</div>
                  <div className="text-[0.78rem] text-[var(--muted)] mt-0.5">
                    {e.category} · {e.keywords.length} keywords
                  </div>
                </div>
                <button onClick={() => setEditing({ ...e })} className="p-2 rounded-lg hover:bg-[var(--surface-2)] text-[var(--muted)]" title="Edit">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => remove(e.id)} className="p-2 rounded-lg hover:bg-[#fdecea] text-[#b3261e]" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
