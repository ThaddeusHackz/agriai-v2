"use client";

import React, { useEffect, useState } from "react";
import { Leaf, Menu, X, ShieldCheck } from "lucide-react";
import { useSite } from "@/lib/site-context";

const LINKS = [
  { href: "#assistant", label: "AI Assistant" },
  { href: "#disease-detection", label: "Disease Detection" },
  { href: "#market-prices", label: "Market Prices" },
  { href: "#weather", label: "Weather" },
  { href: "#features", label: "Features" },
  { href: "#team", label: "Team" },
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
      className={`sticky top-0 z-50 bg-white/85 backdrop-blur-xl border-b transition-shadow ${
        scrolled ? "shadow-[0_4px_24px_rgba(11,61,31,0.06)]" : ""
      }`}
    >
      <nav className="max-w-6xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between gap-4">
        <a href="#top" className="flex items-center gap-2.5 shrink-0">
          <span
            className="w-9 h-9 rounded-2xl flex items-center justify-center text-white shadow-md"
            style={{ background: "var(--primary)" }}
          >
            <Leaf className="w-5 h-5" />
          </span>
          <span className="font-bold text-[1.35rem] tracking-tight text-[var(--deep)]">
            {settings.siteName}
          </span>
        </a>

        <div className="hidden lg:flex items-center gap-1">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="px-3.5 py-2 rounded-full text-[0.9rem] font-medium text-[var(--muted)] hover:text-[var(--deep)] hover:bg-[var(--surface)] transition"
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
            <ShieldCheck className="w-4 h-4" />
            Admin
          </a>
          <button
            className="lg:hidden p-2 rounded-xl hover:bg-[var(--surface)]"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="lg:hidden border-t bg-white px-5 py-4 flex flex-col gap-1">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="px-3 py-2.5 rounded-xl text-[0.95rem] font-medium hover:bg-[var(--surface)]"
            >
              {l.label}
            </a>
          ))}
          <a href="/admin" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-xl text-[0.95rem] font-medium text-[var(--primary-strong)]">
            ⚙️ Admin Panel
          </a>
        </div>
      )}
    </header>
  );
}
