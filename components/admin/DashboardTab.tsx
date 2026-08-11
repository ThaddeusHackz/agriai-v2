"use client";

// ─── Dashboard tab: next-gen analytics overview ──────────────────────────────

import React, { useEffect, useState } from "react";
import {
  MessageSquare, MessagesSquare, ThumbsUp, ThumbsDown, Users, Mail,
  TrendingUp, Clock, Contact,
} from "lucide-react";
import { api } from "./api";
import { timeAgo } from "@/lib/utils";
import CountUp from "@/components/CountUp";

interface Analytics {
  totalChats: number;
  totalMessages: number;
  totalFeedbackUp: number;
  totalFeedbackDown: number;
  totalSubscribers: number;
  totalContacts: number;
  totalUsers: number;
  todayVisits: number;
  todayUnique: number;
  visits: { date: string; count: number; unique: number }[];
  topQuestions: { q: string; count: number }[];
  recentChats: { id: string; title: string; language: string; mode: string; messageCount: number; updatedAt: number }[];
}

function VisitsChart({ visits }: { visits: { date: string; count: number }[] }) {
  const data = visits.slice(-14);
  if (data.length === 0) {
    return <p className="text-[0.85rem] text-[var(--muted)] py-10 text-center">No visits recorded yet.</p>;
  }
  const W = 560, H = 160, PAD = 8;
  const max = Math.max(1, ...data.map((v) => v.count));
  const stepX = (W - PAD * 2) / Math.max(1, data.length - 1);
  const pts = data.map((v, i) => ({
    x: PAD + i * stepX,
    y: H - PAD - (v.count / max) * (H - PAD * 2),
  }));
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1].x.toFixed(1)},${H - PAD} L${pts[0].x.toFixed(1)},${H - PAD} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-40">
        <defs>
          <linearGradient id="visitsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={PAD} x2={W - PAD} y1={H * f} y2={H * f} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 4" />
        ))}
        <path d={area} fill="url(#visitsFill)" />
        <path d={line} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 4 : 2.5} fill={i === pts.length - 1 ? "var(--primary)" : "var(--bg)"} stroke="var(--primary)" strokeWidth="2" />
        ))}
      </svg>
      <div className="flex justify-between mt-1 text-[0.62rem] text-[var(--muted)]">
        <span>{data[0]?.date?.slice(5)}</span>
        <span>{data[Math.floor(data.length / 2)]?.date?.slice(5)}</span>
        <span>{data[data.length - 1]?.date?.slice(5)}</span>
      </div>
    </div>
  );
}

export default function DashboardTab() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    api<{ analytics: Analytics }>("/api/admin/analytics").then((r) => {
      if (r.ok) setData(r.data.analytics);
    });
  }, []);

  if (!data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-28 rounded-3xl bg-[rgba(255,255,255,0.04)] border border-[var(--border)] animate-pulse" />
        ))}
      </div>
    );
  }

  const cards = [
    { label: "Total Chats", value: String(data.totalChats), icon: MessageSquare, tint: "var(--primary)" },
    { label: "Messages", value: String(data.totalMessages), icon: MessagesSquare, tint: "#38bdf8" },
    { label: "Visitors Today", value: String(data.todayVisits), icon: TrendingUp, tint: "#fbbf24" },
    { label: "Unique Today", value: String(data.todayUnique), icon: Users, tint: "#a78bfa" },
    { label: "👍 Helpful", value: String(data.totalFeedbackUp), icon: ThumbsUp, tint: "#34d399" },
    { label: "👎 Not Helpful", value: String(data.totalFeedbackDown), icon: ThumbsDown, tint: "#fb7185" },
    { label: "Subscribers", value: String(data.totalSubscribers), icon: Mail, tint: "#f472b6" },
    { label: "Contacts", value: String(data.totalContacts), icon: Contact, tint: "#2dd4bf" },
  ];

  const maxQ = Math.max(1, ...data.topQuestions.map((q) => q.count));
  const totalFeedback = data.totalFeedbackUp + data.totalFeedbackDown;

  return (
    <div className="space-y-6">
      {/* stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="card rounded-3xl p-5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <span className="text-[0.72rem] font-semibold uppercase tracking-wide text-[var(--muted)]">{c.label}</span>
              <span
                className="w-9 h-9 rounded-2xl flex items-center justify-center text-[#03230f] transition-transform group-hover:scale-110"
                style={{ background: `color-mix(in srgb, ${c.tint} 22%, transparent)`, color: c.tint }}
              >
                <c.icon className="w-4.5 h-4.5" />
              </span>
            </div>
            <div className="mt-2 text-[1.9rem] font-display font-bold tracking-tight text-[var(--ink)]">
              <CountUp value={c.value} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* visits chart */}
        <div className="lg:col-span-3 card rounded-3xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-[0.98rem] text-[var(--ink)]">Visits — last 14 days</h3>
            <span className="text-[0.72rem] text-[var(--muted)]">{data.visits.length} days recorded</span>
          </div>
          <VisitsChart visits={data.visits} />
        </div>

        {/* feedback donut */}
        <div className="lg:col-span-2 card rounded-3xl p-6 flex flex-col">
          <h3 className="font-bold text-[0.98rem] text-[var(--ink)] mb-5">Feedback</h3>
          <div className="flex-1 flex items-center justify-center gap-8">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3.6" />
                <circle
                  cx="18" cy="18" r="15.9" fill="none" stroke="#34d399" strokeWidth="3.6"
                  strokeDasharray={`${totalFeedback ? (data.totalFeedbackUp / totalFeedback) * 100 : 0} 100`}
                  strokeLinecap="round"
                />
                <circle
                  cx="18" cy="18" r="15.9" fill="none" stroke="#fb7185" strokeWidth="3.6"
                  strokeDasharray={`${totalFeedback ? (data.totalFeedbackDown / totalFeedback) * 100 : 0} 100`}
                  strokeDashoffset={totalFeedback ? -(data.totalFeedbackUp / totalFeedback) * 100 : 0}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[1.5rem] font-display font-bold text-[var(--ink)]">{totalFeedback}</span>
                <span className="text-[0.62rem] text-[var(--muted)] uppercase tracking-wider">votes</span>
              </div>
            </div>
            <div className="space-y-2.5 text-[0.82rem]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#34d399]" />
                <span className="text-[var(--muted)]">Helpful</span>
                <span className="font-bold text-[var(--ink)]">{data.totalFeedbackUp}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#fb7185]" />
                <span className="text-[var(--muted)]">Not helpful</span>
                <span className="font-bold text-[var(--ink)]">{data.totalFeedbackDown}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* top questions */}
        <div className="card rounded-3xl p-6">
          <h3 className="font-bold text-[0.98rem] text-[var(--ink)] mb-5">Top questions asked</h3>
          {data.topQuestions.length === 0 ? (
            <p className="text-[0.85rem] text-[var(--muted)] py-8 text-center">No questions recorded yet.</p>
          ) : (
            <ol className="space-y-3.5">
              {data.topQuestions.slice(0, 8).map((q, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span
                    className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[0.72rem] font-bold ${
                      i < 3 ? "text-[#03230f]" : "text-[var(--muted)] bg-[var(--surface)]"
                    }`}
                    style={i < 3 ? { background: "linear-gradient(135deg, var(--primary), var(--primary-strong))" } : undefined}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[0.84rem] text-[var(--text)] truncate">{q.q}</span>
                      <span className="text-[0.72rem] font-bold text-[var(--muted)] shrink-0">{q.count}×</span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(q.count / maxQ) * 100}%`,
                          background: "linear-gradient(90deg, var(--primary), var(--accent))",
                        }}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* recent chats */}
        <div className="card rounded-3xl p-6">
          <h3 className="font-bold text-[0.98rem] text-[var(--ink)] mb-4">Recent conversations</h3>
          {data.recentChats.length === 0 ? (
            <p className="text-[0.85rem] text-[var(--muted)] py-6 text-center">
              No conversations yet — share the site with farmers! 🌱
            </p>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {data.recentChats.slice(0, 7).map((c) => (
                <div key={c.id} className="py-3 flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[var(--border)] flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4 text-[var(--primary)]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[0.86rem] font-semibold text-[var(--ink)] truncate">{c.title}</div>
                    <div className="text-[0.7rem] text-[var(--muted)] mt-0.5">
                      <span className="px-1.5 py-0.5 rounded-md bg-[var(--surface)] font-semibold">{c.language.toUpperCase()}</span>{" "}
                      · {c.mode} · {c.messageCount} messages
                    </div>
                  </div>
                  <span className="text-[0.7rem] text-[var(--muted)] inline-flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" /> {timeAgo(c.updatedAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
