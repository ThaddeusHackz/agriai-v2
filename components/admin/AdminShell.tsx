"use client";

// ─── Admin shell: auth guard + sidebar navigation (2026 glass UI) ────────────

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, Type, Palette, Brain, CircleDollarSign,
  BookOpen, MessagesSquare, Users, ThumbsUp, Mail, Settings, LogOut,
  ExternalLink, Loader2, Menu, X,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "./api";
import Logo3D from "@/components/Logo3D";

export type TabKey =
  | "dashboard" | "content" | "appearance" | "ai" | "prices"
  | "knowledge" | "messages" | "users" | "feedback" | "subscribers" | "settings";

export interface MeUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "editor";
  lastLogin?: number;
}

const TABS: { key: TabKey; label: string; icon: React.ElementType; adminOnly?: boolean }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "content", label: "Content", icon: Type },
  { key: "appearance", label: "Appearance", icon: Palette },
  { key: "ai", label: "AI Settings", icon: Brain },
  { key: "prices", label: "Market Prices", icon: CircleDollarSign },
  { key: "knowledge", label: "Knowledge Base", icon: BookOpen },
  { key: "messages", label: "Messages", icon: MessagesSquare },
  { key: "users", label: "Admin Users", icon: Users, adminOnly: true },
  { key: "feedback", label: "Feedback", icon: ThumbsUp },
  { key: "subscribers", label: "Subscribers", icon: Mail },
  { key: "settings", label: "Settings", icon: Settings, adminOnly: true },
];

export default function AdminShell({
  active,
  onNavigate,
  children,
}: {
  active: TabKey;
  onNavigate: (t: TabKey) => void;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    api<{ user: MeUser }>("/api/admin/me").then((r) => {
      if (!r.ok) {
        router.replace("/admin/login");
        return;
      }
      setUser(r.data.user);
      setLoading(false);
    });
  }, [router]);

  const logout = async () => {
    await api("/api/admin/logout", { method: "POST" });
    toast.success("Signed out");
    router.replace("/admin/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="flex flex-col items-center gap-3">
          <Logo3D size={52} />
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--primary)" }} />
        </div>
      </div>
    );
  }

  const visibleTabs = TABS.filter((t) => !t.adminOnly || user?.role === "admin");

  return (
    <div className="min-h-screen bg-[var(--bg)] lg:flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 z-40 h-screen w-72 bg-[rgba(8,18,12,0.92)] backdrop-blur-2xl border-r border-[var(--border)] flex flex-col transition-transform lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-5 py-5 border-b border-[var(--border)] flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-3">
            <Logo3D size={40} />
            <div>
              <div className="font-display font-bold text-[1.1rem] text-[var(--ink)] leading-none">AgriAI</div>
              <div className="text-[0.7rem] text-[var(--muted)] mt-1">Admin Panel v2.0</div>
            </div>
          </div>
          <button className="lg:hidden p-1.5 rounded-lg hover:bg-[var(--surface)]" onClick={() => setMobileOpen(false)}>
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {visibleTabs.map((t) => {
            const isActive = active === t.key;
            return (
              <button
                key={t.key}
                onClick={() => {
                  onNavigate(t.key);
                  setMobileOpen(false);
                }}
                className={`relative w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-[0.88rem] font-medium transition-all duration-200 ${
                  isActive
                    ? "text-[#03230f] font-bold shadow-[0_6px_20px_color-mix(in_srgb,var(--primary)_35%,transparent)]"
                    : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)]"
                }`}
                style={isActive ? { background: "linear-gradient(135deg, var(--primary), var(--primary-strong))" } : undefined}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full bg-white/70" />
                )}
                <t.icon className="w-4.5 h-4.5" />
                {t.label}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[var(--border)] space-y-2">
          {user && (
            <div className="px-3.5 py-3 rounded-2xl bg-[rgba(255,255,255,0.045)] border border-[var(--border)]">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-[#03230f] font-display font-bold text-[0.8rem] shrink-0"
                  style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-strong))" }}
                >
                  {user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                </span>
                <div className="min-w-0">
                  <div className="font-semibold text-[0.82rem] text-[var(--ink)] truncate">{user.name}</div>
                  <div className="text-[0.7rem] text-[var(--muted)] truncate capitalize">{user.role}</div>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-[0.88rem] font-medium text-[#ff9d8f] hover:bg-[rgba(255,107,107,0.1)] transition"
          >
            <LogOut className="w-4.5 h-4.5" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-20 h-14 bg-[rgba(5,13,8,0.8)] backdrop-blur-2xl border-b border-[var(--border)] flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 rounded-lg hover:bg-[var(--surface)] text-[var(--ink)]" onClick={() => setMobileOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-[0.85rem] font-bold text-[var(--ink)] hidden sm:block">
              {TABS.find((t) => t.key === active)?.label}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" target="_blank" className="btn btn-ghost text-[0.8rem] px-4 py-2">
              <ExternalLink className="w-3.5 h-3.5" /> View site
            </a>
          </div>
        </header>

        <main className="p-4 md:p-8 max-w-6xl">{children}</main>
      </div>
    </div>
  );
}
