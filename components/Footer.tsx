"use client";

import React, { useState } from "react";
import { Leaf, ShieldCheck, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { useSite } from "@/lib/site-context";
import { validEmail } from "@/lib/utils";

export default function Footer() {
  const { settings } = useSite();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [busy, setBusy] = useState(false);

  const sendContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !validEmail(form.email) || !form.message) {
      toast.error("Please fill name, valid email and message");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Message sent!");
        setForm({ name: "", email: "", subject: "", message: "" });
      } else {
        toast.error(data.error || "Failed to send");
      }
    } catch {
      toast.error("Failed to send — check your connection");
    } finally {
      setBusy(false);
    }
  };

  const year = new Date().getFullYear();

  return (
    <footer id="contact" className="border-t bg-[#fbfdfc]">
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-14 grid gap-10 lg:grid-cols-3">
        {/* brand */}
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-2xl flex items-center justify-center text-white shadow-md" style={{ background: "var(--primary)" }}>
              <Leaf className="w-5 h-5" />
            </span>
            <span className="font-bold text-[1.35rem] tracking-tight text-[var(--deep)]">{settings.siteName}</span>
          </div>
          <p className="mt-4 text-[0.88rem] leading-relaxed text-[var(--muted)] max-w-xs">
            {settings.footerText}. Intelligent farming tools for every Ghanaian farmer — in the language you speak.
          </p>
          <a href="/admin" className="mt-5 inline-flex items-center gap-1.5 btn btn-ghost text-[0.8rem] px-4 py-2">
            <ShieldCheck className="w-4 h-4" /> Admin Panel
          </a>
        </div>

        {/* links */}
        <div className="grid grid-cols-2 gap-8">
          <div>
            <div className="label">Explore</div>
            <ul className="space-y-2.5 text-[0.88rem]">
              <li><a href="#assistant" className="text-[var(--muted)] hover:text-[var(--primary-strong)]">AI Assistant</a></li>
              <li><a href="#disease-detection" className="text-[var(--muted)] hover:text-[var(--primary-strong)]">Disease Detection</a></li>
              <li><a href="#market-prices" className="text-[var(--muted)] hover:text-[var(--primary-strong)]">Market Prices</a></li>
              <li><a href="#weather" className="text-[var(--muted)] hover:text-[var(--primary-strong)]">Weather</a></li>
              <li><a href="#features" className="text-[var(--muted)] hover:text-[var(--primary-strong)]">Features</a></li>
            </ul>
          </div>
          <div>
            <div className="label">The Team</div>
            <ul className="space-y-2.5 text-[0.85rem] text-[var(--muted)]">
              <li>Nana Ware Henry Opoku</li>
              <li>Thaddeus Nii Teiko Tagoe</li>
              <li>Comfort Poedza</li>
              <li>Edmond Nana Yaw Boateng</li>
              <li className="pt-1">
                <a href={`mailto:${settings.contactEmail}`} className="inline-flex items-center gap-1.5 font-semibold text-[var(--primary-strong)]">
                  <Mail className="w-3.5 h-3.5" /> {settings.contactEmail}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* contact form */}
        <div>
          <div className="label">Send us a message</div>
          <form onSubmit={sendContact} className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2.5">
              <input
                className="input"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <input
                className="input"
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <input
              className="input"
              placeholder="Subject (optional)"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="Your message…"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
            <button type="submit" disabled={busy} className="btn btn-primary px-6 py-2.5 text-[0.85rem] w-full sm:w-auto">
              <Send className="w-4 h-4" /> {busy ? "Sending…" : "Send message"}
            </button>
          </form>
        </div>
      </div>

      <div className="border-t">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[0.78rem] text-[var(--muted)]">
          <span>© {year} {settings.siteName} — University of Ghana • Intelligent Farming for Ghana 🇬🇭</span>
          <span>Built with Next.js · Groq · OpenAI Whisper · ElevenLabs · Tavily</span>
        </div>
      </div>
    </footer>
  );
}
