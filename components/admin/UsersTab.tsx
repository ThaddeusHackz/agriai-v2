"use client";

// ─── Users tab: manage admin accounts ────────────────────────────────────────

import React, { useEffect, useState } from "react";
import { UserPlus, Trash2, KeyRound, Loader2, ShieldCheck, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { api } from "./api";
import { formatDate } from "@/lib/utils";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "editor";
  createdAt: number;
  lastLogin?: number;
}

export default function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [me, setMe] = useState<AdminUser | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "editor" as "admin" | "editor" });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [u, m] = await Promise.all([
      api<{ users: AdminUser[] }>("/api/admin/users"),
      api<{ user: AdminUser }>("/api/admin/me"),
    ]);
    if (u.ok) setUsers(u.data.users);
    if (m.ok) setMe(m.data.user);
  };

  useEffect(() => {
    load();
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const r = await api("/api/admin/users", {
      method: "POST",
      body: JSON.stringify(form),
    });
    setBusy(false);
    if (r.ok) {
      toast.success("User created");
      setForm({ name: "", email: "", password: "", role: "editor" });
      load();
    } else {
      toast.error(r.data.error || "Failed to create user");
    }
  };

  const remove = async (id: string) => {
    const r = await api(`/api/admin/users?id=${id}`, { method: "DELETE" });
    if (r.ok) {
      toast.success("User deleted");
      load();
    } else {
      toast.error(r.data.error || "Failed to delete");
    }
  };

  const resetPassword = async (id: string) => {
    const pw = window.prompt("New password (min 8 characters):");
    if (!pw) return;
    if (pw.length < 8) {
      toast.error("Password too short");
      return;
    }
    const r = await api("/api/admin/users", {
      method: "PATCH",
      body: JSON.stringify({ id, password: pw }),
    });
    if (r.ok) toast.success("Password updated");
    else toast.error(r.data.error || "Failed");
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="card rounded-3xl p-6">
        <h3 className="font-bold text-[0.98rem] text-[var(--ink)] flex items-center gap-2 mb-4">
          <UserPlus className="w-4.5 h-4.5" style={{ color: "var(--primary)" }} /> Add an admin or editor
        </h3>
        <form onSubmit={add} className="grid sm:grid-cols-2 gap-3">
          <input className="input" placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="input" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input className="input" type="password" placeholder="Password (min 8 chars)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
          <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as "admin" | "editor" })}>
            <option value="editor">Editor (content only)</option>
            <option value="admin">Admin (full access)</option>
          </select>
          <button type="submit" disabled={busy} className="btn btn-primary sm:col-span-2 px-6 py-2.5 text-[0.88rem]">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Create user
          </button>
        </form>
      </div>

      <div className="card rounded-3xl overflow-hidden">
        <div className="px-6 py-4 border-b bg-[rgba(255,255,255,0.045)] font-bold text-[0.98rem] text-[var(--ink)]">
          Admin accounts ({users.length})
        </div>
        <div className="divide-y divide-[var(--border)]">
          {users.map((u) => (
            <div key={u.id} className="px-6 py-4 flex items-center gap-3">
              <span className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 ${u.role === "admin" ? "" : "opacity-80"}`} style={{ background: u.role === "admin" ? "var(--primary)" : "var(--muted)" }}>
                {u.role === "admin" ? <ShieldCheck className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[0.9rem] text-[var(--ink)] truncate">
                  {u.name} {me?.id === u.id && <span className="text-[0.68rem] text-[var(--primary-strong)] font-bold">(you)</span>}
                </div>
                <div className="text-[0.76rem] text-[var(--muted)]">
                  {u.email} · {u.role} · joined {formatDate(u.createdAt)}
                  {u.lastLogin && ` · last login ${formatDate(u.lastLogin)}`}
                </div>
              </div>
              <button onClick={() => resetPassword(u.id)} className="btn btn-soft text-[0.78rem] px-3.5 py-2" title="Reset password">
                <KeyRound className="w-3.5 h-3.5" /> Password
              </button>
              {me?.id !== u.id && (
                <button onClick={() => remove(u.id)} className="p-2 rounded-lg hover:bg-[rgba(255,107,107,0.12)] text-[#ff9d8f]" title="Delete user">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
