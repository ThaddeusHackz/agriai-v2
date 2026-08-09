"use client";

// ─── Admin shell: auth guard + sidebar navigation ────────────────────────────

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Leaf, LayoutDashboard, Type, Palette, Brain, CircleDollarSign,
  BookOpen, MessagesSquare, Users, ThumbsUp, Mail, Settings, LogOut,
  ExternalLink, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "./api";

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
      <div className="min-h-screen flex items-center justify-center bg-[#f6faf7]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--primary)" }} />
      </div>
    );
  }

  const visibleTabs = TABS.filter((t) => !t.adminOnly || user?.role === "admin");

  return (
    <div className="min-h-screen bg-[#f6faf7] lg:flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 z-40 h-screen w-64 bg-white border-r border-[var(--border)] flex flex-col transition-transform lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-5 py-5 border-b flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-2xl flex items-center justify-center text-white shadow-md" style={{ background: "var(--primary)" }}>
            <Leaf className="w-5 h-5" />
          </span>
          <div>
            <div className="font-bold text-[1.05rem] text-[var(--deep)] leading-none">AgriAI</div>
            <div className="text-[0.7rem] text-[var(--muted)] mt-0.5">Admin Panel v2.0</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {visibleTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                onNavigate(t.key);
                setMobileOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[0.88rem] font-medium transition ${
                active === t.key
                  ? "text-white shadow-sm"
                  : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--deep)]"
              }`}
              style={active === t.key ? { background: "var(--primary)" } : undefined}
            >
              <t.icon className="w-4.5 h-4.5" />
              {t.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t">
          {user && (
            <div className="px-3 py-2.5 mb-2 rounded-xl bg-[var(--surface)]">
              <div className="font-semibold text-[0.85rem] text-[var(--deep)] truncate">{user.name}</div>
              <div className="text-[0.72rem] text-[var(--muted)] truncate">{user.email} · {user.role}</div>
            </div>
          )}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[0.88rem] font-medium text-[#b3261e] hover:bg-[#fdecea] transition"
          >
            <LogOut className="w-4.5 h-4.5" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-14 bg-white/85 backdrop-blur-xl border-b flex items-center justify-between px-4 md:px-6">
          <button className="lg:hidden p-2 rounded-lg hover:bg-[var(--surface)]" onClick={() => setMobileOpen(true)}>
            ☰
          </button>
          <div className="text-[0.85rem] font-semibold text-[var(--deep)] hidden sm:block">
            {TABS.find((t) => t.key === active)?.label}
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
