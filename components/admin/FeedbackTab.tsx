"use client";

// ─── Feedback tab: thumbs up/down from users ─────────────────────────────────

import React, { useEffect, useState } from "react";
import { ThumbsUp, ThumbsDown, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "./api";
import { formatDateTime } from "@/lib/utils";

interface Feedback {
  id: string;
  chatId: string;
  messageId: string;
  value: "up" | "down";
  comment?: string;
  createdAt: number;
}

export default function FeedbackTab() {
  const [items, setItems] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const r = await api<{ feedback: Feedback[] }>("/api/admin/feedback");
    if (r.ok) setItems(r.data.feedback);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id: string) => {
    const r = await api(`/api/admin/feedback?id=${id}`, { method: "DELETE" });
    if (r.ok) {
      toast.success("Feedback removed");
      load();
    }
  };

  const up = items.filter((f) => f.value === "up").length;
  const down = items.length - up;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 max-w-md">
        <div className="card rounded-3xl p-5 text-center">
          <ThumbsUp className="w-5 h-5 mx-auto mb-1 text-[#10b981]" />
          <div className="text-[1.5rem] font-bold text-[var(--ink)]">{up}</div>
          <div className="text-[0.75rem] text-[var(--muted)] font-semibold uppercase tracking-wide">Helpful</div>
        </div>
        <div className="card rounded-3xl p-5 text-center">
          <ThumbsDown className="w-5 h-5 mx-auto mb-1 text-[#ef4444]" />
          <div className="text-[1.5rem] font-bold text-[var(--ink)]">{down}</div>
          <div className="text-[0.75rem] text-[var(--muted)] font-semibold uppercase tracking-wide">Not helpful</div>
        </div>
      </div>

      <div className="card rounded-3xl overflow-hidden">
        <div className="px-6 py-4 border-b bg-[rgba(255,255,255,0.045)] font-bold text-[0.98rem] text-[var(--ink)]">
          All feedback ({items.length})
        </div>
        {loading ? (
          <div className="p-8 text-center text-[var(--muted)] text-[0.85rem]">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-[var(--muted)] text-[0.9rem]">
            No feedback yet — users rate answers with 👍/👎 in the chat.
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {items.map((f) => (
              <div key={f.id} className="px-6 py-4 flex items-start gap-3">
                <span className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${f.value === "up" ? "bg-[rgba(16,185,129,0.12)] text-[#6ee7a0]" : "bg-[rgba(255,107,107,0.12)] text-[#ff9d8f]"}`}>
                  {f.value === "up" ? <ThumbsUp className="w-4 h-4" /> : <ThumbsDown className="w-4 h-4" />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[0.8rem] text-[var(--muted)]">{formatDateTime(f.createdAt)}</div>
                  {f.comment && <p className="mt-1 text-[0.88rem] text-[var(--text)]">&ldquo;{f.comment}&rdquo;</p>}
                  {!f.comment && <p className="mt-1 text-[0.85rem] text-[var(--muted)] italic">No comment</p>}
                  <div className="text-[0.68rem] text-[var(--muted)] mt-1 font-mono">chat: {f.chatId || "—"} · msg: {f.messageId}</div>
                </div>
                <button onClick={() => remove(f.id)} className="p-2 rounded-lg hover:bg-[rgba(255,107,107,0.12)] text-[#ff9d8f] shrink-0">
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
