"use client";

// ─── Admin login ──────────────────────────────────────────────────────────────

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Leaf, Lock, Mail, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/components/admin/api";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    api("/api/admin/me").then((r) => {
      if (r.ok) router.replace("/admin");
      else setChecking(false);
    });
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Enter your email and password");
      return;
    }
    setBusy(true);
    const r = await api("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ email, password, remember }),
    });
    setBusy(false);
    if (r.ok) {
      toast.success("Welcome back!");
      router.replace("/admin");
    } else {
      toast.error(r.data.error || "Login failed");
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6faf7]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--primary)" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f6faf7] px-4 relative overflow-hidden">
      <div className="absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: "radial-gradient(circle, var(--primary), transparent 65%)" }} />
      <div className="absolute -bottom-32 -right-32 w-[420px] h-[420px] rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: "radial-gradient(circle, var(--accent), transparent 65%)" }} />

      <div className="relative w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-1.5 text-[0.82rem] font-semibold text-[var(--muted)] hover:text-[var(--deep)] mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to website
        </Link>

        <div className="card rounded-[1.75rem] p-8 shadow-[var(--shadow-lift)]">
          <div className="text-center mb-7">
            <span className="inline-flex w-14 h-14 rounded-3xl items-center justify-center text-white shadow-lg mb-4" style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-strong))" }}>
              <Leaf className="w-7 h-7" />
            </span>
            <h1 className="text-[1.6rem] font-bold tracking-tight text-[var(--deep)]">AgriAI Admin</h1>
            <p className="mt-1 text-[0.85rem] text-[var(--muted)]">Sign in to manage your platform</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--muted)]" />
                <input
                  type="email"
                  autoComplete="username"
                  className="input pl-11"
                  placeholder="admin@agriai.gh"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--muted)]" />
                <input
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  className="input pl-11 pr-11"
                  placeholder="••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--deep)]"
                >
                  {showPw ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-[0.84rem] text-[var(--muted)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded accent-[var(--primary)]"
              />
              Keep me signed in for 7 days
            </label>

            <button type="submit" disabled={busy} className="btn btn-primary w-full py-3.5 text-[0.95rem]">
              {busy ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Lock className="w-4.5 h-4.5" />}
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-[0.75rem] text-[var(--muted)]">
            Protected area — unauthorized access is logged.
          </p>
        </div>
      </div>
    </div>
  );
}
