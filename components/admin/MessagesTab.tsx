"use client";

// ─── Messages tab: browse all conversations ──────────────────────────────────

import React, { useEffect, useState } from "react";
import { ChevronDown, Trash2, MessagesSquare, Globe, Brain, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { api } from "./api";
import Markdown from "@/components/Markdown";
import { formatDateTime } from "@/lib/utils";

interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
  language: string;
  mode: string;
  ts: number;
  demo?: boolean;
  sources?: { title: string; url: string }[];
}

interface Chat {
  id: string;
  title: string;
  language: string;
  mode: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  messages: Msg[];
}

export default function MessagesTab() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const load = async () => {
    const r = await api<{ chats: Chat[]; total: number }>("/api/admin/messages?limit=50");
    if (r.ok) {
      setChats(r.data.chats);
      setTotal(r.data.total);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id: string) => {
    const r = await api(`/api/admin/messages?id=${id}`, { method: "DELETE" });
    if (r.ok) {
      toast.success("Conversation deleted");
      load();
    }
  };

  const modeIcon = (m: string) =>
    m === "expert" ? <FlaskConical className="w-3.5 h-3.5" /> : m === "agent" ? <Brain className="w-3.5 h-3.5" /> : <MessagesSquare className="w-3.5 h-3.5" />;

  return (
    <div className="space-y-4">
      <div className="text-[0.85rem] text-[var(--muted)]">
        Showing the latest {chats.length} of {total} conversations stored on this deployment.
      </div>

      {loading ? (
        <div className="h-40 animate-pulse rounded-3xl bg-[rgba(255,255,255,0.045)] border border-[var(--border)]" />
      ) : chats.length === 0 ? (
        <div className="card rounded-3xl p-10 text-center text-[var(--muted)] text-[0.9rem]">
          No conversations yet. When farmers chat, they appear here.
        </div>
      ) : (
        chats.map((c) => (
          <div key={c.id} className="card rounded-3xl overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === c.id ? null : c.id)}
              className="w-full flex items-center gap-3 px-6 py-4 hover:bg-[var(--surface)]/50 transition text-left"
            >
              <span className="w-9 h-9 rounded-xl bg-[var(--surface)] flex items-center justify-center shrink-0">
                {modeIcon(c.mode)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[0.92rem] text-[var(--ink)] truncate">{c.title}</div>
                <div className="text-[0.74rem] text-[var(--muted)]">
                  {c.language.toUpperCase()} · {c.mode} · {c.messageCount} messages · {formatDateTime(c.updatedAt)}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  remove(c.id);
                }}
                className="p-2 rounded-lg hover:bg-[rgba(255,107,107,0.12)] text-[#ff9d8f]"
                title="Delete conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <ChevronDown className={`w-4.5 h-4.5 text-[var(--muted)] transition-transform shrink-0 ${expanded === c.id ? "rotate-180" : ""}`} />
            </button>

            {expanded === c.id && (
              <div className="px-6 pb-5 space-y-3 border-t border-[var(--border)] pt-4 bg-[var(--surface)]/30">
                {c.messages.map((m) => (
                  <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] px-4 py-3 rounded-2xl text-[0.85rem] ${
                        m.role === "user"
                          ? "bg-[var(--primary)] text-white rounded-br-sm"
                          : "bg-[rgba(255,255,255,0.045)] border border-[var(--border)] rounded-bl-sm"
                      }`}
                    >
                      {m.role === "assistant" ? <Markdown content={m.content} /> : m.content}
                      {m.demo && (
                        <span className="mt-2 inline-block text-[0.68rem] font-bold px-2.5 py-0.5 rounded-full bg-[rgba(249,188,19,0.12)] text-[#f5c96b] border border-[rgba(249,188,19,0.3)]">
                          demo
                        </span>
                      )}
                      {m.sources && m.sources.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {m.sources.map((s, i) => (
                            <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="text-[0.7rem] font-semibold text-[var(--primary-strong)] hover:underline inline-flex items-center gap-1">
                              <Globe className="w-3 h-3" /> [{i + 1}]
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
