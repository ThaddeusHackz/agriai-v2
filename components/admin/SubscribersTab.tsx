"use client";

// ─── Subscribers tab: newsletter list + CSV export ───────────────────────────

import React, { useEffect, useState } from "react";
import { Mail, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { api } from "./api";
import { formatDate } from "@/lib/utils";

interface Subscriber {
  id: string;
  email: string;
  name?: string;
  createdAt: number;
}

export default function SubscribersTab() {
  const [items, setItems] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const r = await api<{ subscribers: Subscriber[] }>("/api/admin/subscribers");
    if (r.ok) setItems(r.data.subscribers);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id: string) => {
    const r = await api(`/api/admin/subscribers?id=${id}`, { method: "DELETE" });
    if (r.ok) {
      toast.success("Subscriber removed");
      load();
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="card rounded-3xl px-6 py-4">
          <span className="text-[1.6rem] font-bold text-[var(--deep)]">{items.length}</span>
          <span className="ml-2 text-[0.85rem] text-[var(--muted)] font-medium">newsletter subscribers</span>
        </div>
        <a
          href="/api/admin/subscribers?export=1"
          className="btn btn-soft px-5 py-2.5 text-[0.85rem]"
        >
          <Download className="w-4 h-4" /> Export CSV
        </a>
      </div>

      <div className="card rounded-3xl overflow-hidden">
        <div className="px-6 py-4 border-b bg-white font-bold text-[0.98rem] text-[var(--deep)]">
          Subscribers
        </div>
        {loading ? (
          <div className="p-8 text-center text-[var(--muted)] text-[0.85rem]">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-[var(--muted)] text-[0.9rem]">
            No subscribers yet — the newsletter box is on the homepage.
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {items.map((s) => (
              <div key={s.id} className="px-6 py-3.5 flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-[var(--surface)] flex items-center justify-center text-[var(--muted)] shrink-0">
                  <Mail className="w-4 h-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[0.88rem] text-[var(--deep)] truncate">{s.email}</div>
                  <div className="text-[0.74rem] text-[var(--muted)]">
                    {s.name || "No name"} · subscribed {formatDate(s.createdAt)}
                  </div>
                </div>
                <button onClick={() => remove(s.id)} className="p-2 rounded-lg hover:bg-[#fdecea] text-[#b3261e]" title="Remove">
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
