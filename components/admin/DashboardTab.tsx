"use client";

// ─── Dashboard tab: analytics overview ───────────────────────────────────────

import React, { useEffect, useState } from "react";
import {
  MessageSquare, MessagesSquare, ThumbsUp, ThumbsDown, Users, Mail,
  TrendingUp, Clock,
} from "lucide-react";
import { api } from "./api";
import { timeAgo } from "@/lib/utils";

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
          <div key={i} className="h-28 rounded-3xl bg-white border border-[var(--border)] animate-pulse" />
        ))}
      </div>
    );
  }

  const cards = [
    { label: "Total Chats", value: data.totalChats.toLocaleString(), icon: MessageSquare, tint: "#00c853" },
    { label: "Messages", value: data.totalMessages.toLocaleString(), icon: MessagesSquare, tint: "#0ea5e9" },
    { label: "Visitors Today", value: data.todayVisits.toLocaleString(), icon: TrendingUp, tint: "#f59e0b" },
    { label: "Unique Today", value: data.todayUnique.toLocaleString(), icon: Users, tint: "#8b5cf6" },
    { label: "👍 Helpful", value: data.totalFeedbackUp.toLocaleString(), icon: ThumbsUp, tint: "#10b981" },
    { label: "👎 Not Helpful", value: data.totalFeedbackDown.toLocaleString(), icon: ThumbsDown, tint: "#ef4444" },
    { label: "Subscribers", value: data.totalSubscribers.toLocaleString(), icon: Mail, tint: "#ec4899" },
    { label: "Contacts", value: data.totalContacts.toLocaleString(), icon: Users, tint: "#14b8a6" },
  ];

  const maxVisit = Math.max(1, ...data.visits.map((v) => v.count));

  return (
    <div className="space-y-6">
      {/* stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="card rounded-3xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-[0.74rem] font-semibold uppercase tracking-wide text-[var(--muted)]">{c.label}</span>
              <span className="w-8 h-8 rounded-xl flex items-center justify-center text-white" style={{ background: c.tint }}>
                <c.icon className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 text-[1.7rem] font-bold tracking-tight text-[var(--deep)]">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* visits chart */}
        <div className="card rounded-3xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-[0.98rem] text-[var(--deep)]">Visits — last 14 days</h3>
            <span className="text-[0.72rem] text-[var(--muted)]">{data.visits.length} days recorded</span>
          </div>
          {data.visits.length === 0 ? (
            <p className="text-[0.85rem] text-[var(--muted)] py-8 text-center">No visits recorded yet.</p>
          ) : (
            <div className="flex items-end gap-1.5 h-36">
              {data.visits.slice(-14).map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                  <span className="text-[0.62rem] font-bold text-[var(--muted)] opacity-0 group-hover:opacity-100 transition">
                    {v.count}
                  </span>
                  <div
                    className="w-full rounded-t-lg spark-bar"
                    style={{
                      height: `${Math.max(6, (v.count / maxVisit) * 100)}%`,
                      background: i === data.visits.length - 1 ? "var(--primary)" : "var(--primary-soft)",
                    }}
                    title={`${v.date}: ${v.count} visits`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* top questions */}
        <div className="card rounded-3xl p-6">
          <h3 className="font-bold text-[0.98rem] text-[var(--deep)] mb-5">Top questions asked</h3>
          {data.topQuestions.length === 0 ? (
            <p className="text-[0.85rem] text-[var(--muted)] py-8 text-center">No questions recorded yet.</p>
          ) : (
            <ol className="space-y-3">
              {data.topQuestions.map((q, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span
                    className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[0.72rem] font-bold ${
                      i < 3 ? "text-white" : "text-[var(--muted)] bg-[var(--surface)]"
                    }`}
                    style={i < 3 ? { background: "var(--primary)" } : undefined}
                  >
                    {i + 1}
                  </span>
                  <span className="flex-1 text-[0.86rem] text-[var(--text)] truncate">{q.q}</span>
                  <span className="text-[0.75rem] font-bold text-[var(--muted)]">{q.count}×</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* recent chats */}
      <div className="card rounded-3xl p-6">
        <h3 className="font-bold text-[0.98rem] text-[var(--deep)] mb-4">Recent conversations</h3>
        {data.recentChats.length === 0 ? (
          <p className="text-[0.85rem] text-[var(--muted)] py-6 text-center">
            No conversations yet — share the site with farmers! 🌱
          </p>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {data.recentChats.map((c) => (
              <div key={c.id} className="py-3 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-[var(--surface)] flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4 text-[var(--muted)]" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[0.88rem] font-semibold text-[var(--deep)] truncate">{c.title}</div>
                  <div className="text-[0.72rem] text-[var(--muted)]">
                    {c.language.toUpperCase()} · {c.mode} · {c.messageCount} messages
                  </div>
                </div>
                <span className="text-[0.72rem] text-[var(--muted)] inline-flex items-center gap-1 shrink-0">
                  <Clock className="w-3 h-3" /> {timeAgo(c.updatedAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
