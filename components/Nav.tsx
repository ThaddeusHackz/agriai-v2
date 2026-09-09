"use client";

import React, { useEffect, useState } from "react";
import { Menu, ShieldCheck } from "lucide-react";
import { useSite } from "@/lib/site-context";
import Logo3D from "./Logo3D";

const LINKS = [
  { href: "#assistant", label: "AI Assistant" },
  { href: "#disease-detection", label: "Disease Detection" },
  { href: "#market-prices", label: "Market Prices" },
  { href: "#weather", label: "Weather" },
  { href: "#features", label: "Features" },
  { href: "#founder", label: "Founder" },
];

export default function Nav() {
  const { settings } = useSite();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 backdrop-blur-2xl border-b transition-all duration-300 ${
        scrolled
          ? "bg-[rgba(5,13,8,0.82)] shadow-[0_8px_40px_rgba(0,0,0,0.5)]"
          : "bg-[rgba(5,13,8,0.55)]"
      }`}
    >
      <nav className="max-w-6xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between gap-4">
        <a href="#top" className="flex items-center gap-3 shrink-0 group">
          <Logo3D size={38} />
          <span className="font-display font-bold text-[1.4rem] tracking-tight text-[var(--ink)] group-hover:opacity-85 transition">
            {settings.siteName}
            <span className="text-[var(--primary)]">.</span>
          </span>
        </a>

        <div className="hidden lg:flex items-center gap-1">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="px-3.5 py-2 rounded-full text-[0.9rem] font-medium text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface)] transition"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/admin"
            className="hidden sm:inline-flex items-center gap-1.5 btn btn-ghost text-[0.85rem] px-4 py-2"
          >
            <ShieldCheck className="w-4 h-4" style={{ color: "var(--primary)" }} />
            Admin
          </a>
          <button
            className="lg:hidden p-2 rounded-xl hover:bg-[var(--surface)] text-[var(--ink)]"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <Menu className="w-5 h-5 rotate-90 transition" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="lg:hidden border-t border-[var(--border)] bg-[rgba(5,13,8,0.96)] backdrop-blur-2xl px-5 py-4 flex flex-col gap-1">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="px-3 py-2.5 rounded-xl text-[0.95rem] font-medium text-[var(--text)] hover:bg-[var(--surface)]"
            >
              {l.label}
            </a>
          ))}
          <a href="/admin" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-xl text-[0.95rem] font-semibold text-[var(--primary)]">
            ⚙️ Admin Panel
          </a>
        </div>
      )}
    </header>
  );
}
