"use client";

// ─── Market Prices — Ghana's major markets ───────────────────────────────────

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, RefreshCw, MapPin, ExternalLink, CircleDollarSign } from "lucide-react";
import Section from "./Section";
import { useSite } from "@/lib/site-context";
import { ghs } from "@/lib/utils";

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

interface LiveIntel {
  text: string;
  sources: { title: string; url: string }[];
}

export default function MarketPrices() {
  const { settings } = useSite();
  const [prices, setPrices] = useState<Price[]>([]);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState<LiveIntel | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);

  const load = async (withLive = false) => {
    if (withLive) setLiveLoading(true);
    try {
      const res = await fetch(`/api/prices${withLive ? "?live=1" : ""}`, { cache: "no-store" });
      const data = await res.json();
      if (data.prices) setPrices(data.prices);
      if (withLive && data.live) setLive(data.live);
    } catch {
      /* fallback to empty */
    } finally {
      setLoading(false);
      setLiveLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Section
      id="market-prices"
      title="Market Prices Across Ghana"
      subtitle="Know the fair price before you sell. Prices are curated by the AgriAI team and refreshed with live web intel."
      show={settings.showSections.prices}
    >
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="card rounded-3xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b flex flex-wrap items-center justify-between gap-3 bg-[rgba(255,255,255,0.045)]">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl flex items-center justify-center text-white" style={{ background: "var(--primary)" }}>
              <CircleDollarSign className="w-4.5 h-4.5" />
            </span>
            <span className="font-bold text-[0.95rem] text-[var(--ink)]">Ghana Market Price Board</span>
            <span className="text-[0.72rem] text-[var(--muted)] bg-[var(--surface)] px-2.5 py-1 rounded-full">
              updated {new Date().toLocaleDateString("en-GH", { day: "numeric", month: "short" })}
            </span>
          </div>
          <button onClick={() => load(true)} disabled={liveLoading} className="btn btn-soft text-[0.82rem] px-4 py-2">
            <RefreshCw className={`w-3.5 h-3.5 ${liveLoading ? "animate-spin" : ""}`} />
            {liveLoading ? "Fetching live intel…" : "Live intel"}
          </button>
        </div>

        {live && (
          <div className="mx-6 mt-4 rounded-2xl bg-[rgba(16,185,129,0.07)] border border-[rgba(16,185,129,0.25)] px-4 py-3 text-[0.83rem] text-[var(--muted)]">
            <div className="font-bold text-[var(--ink)] flex items-center gap-1.5 mb-1">
              <ExternalLink className="w-3.5 h-3.5" /> Live market intel
            </div>
            <p className="text-[var(--muted)] leading-relaxed">{live.text}</p>
            {live.sources.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {live.sources.map((s, i) => (
                  <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="text-[0.74rem] font-semibold text-[var(--primary-strong)] hover:underline">
                    [{i + 1}] {s.title.slice(0, 40)}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[0.7rem] font-bold uppercase tracking-wider text-[var(--muted)] border-b border-[var(--border)] bg-[var(--surface)]/60">
                <th className="px-6 py-3.5">Crop</th>
                <th className="px-4 py-3.5"><span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> Market</span></th>
                <th className="px-4 py-3.5 text-right">Price (GHS)</th>
                <th className="px-4 py-3.5 hidden md:table-cell">Unit</th>
                <th className="px-4 py-3.5 hidden sm:table-cell">Trend</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-[var(--border)]">
                      <td colSpan={5} className="px-6 py-4">
                        <div className="h-4 rounded-full bg-[var(--surface-2)] animate-pulse w-2/3" />
                      </td>
                    </tr>
                  ))
                : prices.map((p) => (
                    <tr key={p.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface)]/50 transition">
                      <td className="px-6 py-3.5">
                        <div className="font-semibold text-[0.9rem] text-[var(--ink)]">{p.crop}</div>
                        {p.note && <div className="text-[0.72rem] text-[var(--muted)] mt-0.5">{p.note}</div>}
                      </td>
                      <td className="px-4 py-3.5 text-[0.85rem] text-[var(--muted)]">{p.market}</td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="font-bold text-[0.95rem]" style={{ color: "var(--ink)" }}>{ghs(p.price)}</span>
                      </td>
                      <td className="px-4 py-3.5 text-[0.8rem] text-[var(--muted)] hidden md:table-cell">{p.unit}</td>
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        {p.trend === "up" ? (
                          <span className="inline-flex items-center gap-1 text-[0.75rem] font-bold text-[#6ee7a0] bg-[rgba(16,185,129,0.12)] border border-[rgba(16,185,129,0.3)] px-2.5 py-1 rounded-full">
                            <TrendingUp className="w-3.5 h-3.5" /> Rising
                          </span>
                        ) : p.trend === "down" ? (
                          <span className="inline-flex items-center gap-1 text-[0.75rem] font-bold text-[#ffb4a2] bg-[rgba(255,107,107,0.12)] border border-[rgba(255,107,107,0.3)] px-2.5 py-1 rounded-full">
                            <TrendingDown className="w-3.5 h-3.5" /> Falling
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[0.75rem] font-bold text-[var(--muted)] bg-[var(--surface)] border border-[var(--border)] px-2.5 py-1 rounded-full">
                            <Minus className="w-3.5 h-3.5" /> Stable
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {!loading && prices.length === 0 && (
          <div className="text-center py-10 text-[var(--muted)] text-[0.9rem]">
            No prices yet — the admin can add them from the panel.
          </div>
        )}
      </motion.div>
    </Section>
  );
}
