"use client";

// ─── Market Prices tab: full CRUD ────────────────────────────────────────────

import React, { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "./api";
import { ghs, todayISO } from "@/lib/utils";

interface Price {
  id: string;
  crop: string;
  market: string;
  price: number;
  unit: string;
  date: string;
  trend: "up" | "down" | "stable";
  note?: string;
}

const EMPTY: Price = { id: "", crop: "", market: "", price: 0, unit: "per 100kg bag", date: todayISO(), trend: "stable", note: "" };

export default function PricesTab() {
  const [prices, setPrices] = useState<Price[]>([]);
  const [editing, setEditing] = useState<Price | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const r = await api<{ prices: Price[] }>("/api/prices");
    if (r.ok) setPrices(r.data.prices);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!editing) return;
    if (!editing.crop.trim() || !editing.market.trim() || !editing.price || !editing.unit.trim()) {
      toast.error("Crop, market, price and unit are required");
      return;
    }
    setBusy(true);
    const r = await api("/api/prices", {
      method: "POST",
      body: JSON.stringify({ ...editing, price: Number(editing.price) }),
    });
    setBusy(false);
    if (r.ok) {
      toast.success("Price saved");
      setEditing(null);
      load();
    } else {
      toast.error(r.data.error || "Save failed");
    }
  };

  const remove = async (id: string) => {
    const r = await api(`/api/prices?id=${id}`, { method: "DELETE" });
    if (r.ok) {
      toast.success("Price deleted");
      load();
    }
  };

  return (
    <div className="space-y-5">
      <div className="card rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[0.98rem] text-[var(--ink)]">
            {editing?.id ? "Edit price" : "Add new price"}
          </h3>
          {editing?.id && (
            <button onClick={() => setEditing(null)} className="text-[0.78rem] text-[var(--muted)] hover:text-[var(--ink)] inline-flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Cancel edit
            </button>
          )}
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <input className="input" placeholder="Crop (e.g. Maize white)" value={editing?.crop || ""} onChange={(e) => setEditing({ ...(editing || EMPTY), crop: e.target.value })} />
          <input className="input" placeholder="Market (e.g. Kumasi)" value={editing?.market || ""} onChange={(e) => setEditing({ ...(editing || EMPTY), market: e.target.value })} />
          <input className="input" type="number" min={0} placeholder="Price (GHS)" value={editing?.price || ""} onChange={(e) => setEditing({ ...(editing || EMPTY), price: Number(e.target.value) })} />
          <input className="input" placeholder="Unit (e.g. per 100kg bag)" value={editing?.unit || ""} onChange={(e) => setEditing({ ...(editing || EMPTY), unit: e.target.value })} />
          <select className="input" value={editing?.trend || "stable"} onChange={(e) => setEditing({ ...(editing || EMPTY), trend: e.target.value as Price["trend"] })}>
            <option value="up">Trend: Rising</option>
            <option value="down">Trend: Falling</option>
            <option value="stable">Trend: Stable</option>
          </select>
          <input className="input" placeholder="Note (optional)" value={editing?.note || ""} onChange={(e) => setEditing({ ...(editing || EMPTY), note: e.target.value })} />
        </div>
        <button onClick={save} disabled={busy || !editing} className="btn btn-primary mt-4 px-6 py-2.5 text-[0.88rem]">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {editing?.id ? "Update price" : "Add price"}
        </button>
      </div>

      <div className="card rounded-3xl overflow-hidden">
        <div className="px-6 py-4 border-b bg-[rgba(255,255,255,0.045)] flex items-center justify-between">
          <h3 className="font-bold text-[0.98rem] text-[var(--ink)]">Current prices ({prices.length})</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-[var(--muted)] text-[0.85rem]">Loading…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[0.7rem] font-bold uppercase tracking-wider text-[var(--muted)] border-b bg-[var(--surface)]/60">
                  <th className="px-6 py-3">Crop</th>
                  <th className="px-4 py-3">Market</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3">Unit</th>
                  <th className="px-4 py-3">Trend</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {prices.map((p) => (
                  <tr key={p.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface)]/50">
                    <td className="px-6 py-3 font-semibold text-[0.88rem] text-[var(--ink)]">{p.crop}</td>
                    <td className="px-4 py-3 text-[0.85rem] text-[var(--muted)]">{p.market}</td>
                    <td className="px-4 py-3 text-right font-bold text-[0.9rem]">{ghs(p.price)}</td>
                    <td className="px-4 py-3 text-[0.8rem] text-[var(--muted)]">{p.unit}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[0.72rem] font-bold px-2.5 py-1 rounded-full ${p.trend === "up" ? "bg-[rgba(16,185,129,0.12)] text-[#6ee7a0]" : p.trend === "down" ? "bg-[rgba(255,107,107,0.12)] text-[#ff9d8f]" : "bg-[var(--surface)] text-[var(--muted)]"}`}>
                        {p.trend}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => setEditing({ ...p })} className="p-2 rounded-lg hover:bg-[var(--surface-2)] text-[var(--muted)]" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => remove(p.id)} className="p-2 rounded-lg hover:bg-[rgba(255,107,107,0.12)] text-[#ff9d8f]" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
