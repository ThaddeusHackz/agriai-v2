"use client";

// ─── Newsletter + contact ─────────────────────────────────────────────────────

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useSite } from "@/lib/site-context";
import { validEmail } from "@/lib/utils";

export default function Newsletter() {
  const { settings } = useSite();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      const data = await res.json();
      if (res.ok) {
        setDone(true);
        toast.success(data.message || "Subscribed!");
      } else {
        toast.error(data.error || "Subscription failed");
      }
    } catch {
      toast.error("Subscription failed — try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="newsletter" className="py-16 md:py-20 scroll-mt-24">
      <div className="max-w-6xl mx-auto px-5 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-[2rem] text-white relative overflow-hidden px-7 py-12 md:p-14 text-center"
          style={{ background: "linear-gradient(120deg, var(--deep) 0%, #0d5c30 55%, var(--primary-strong) 120%)" }}
        >
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/8 blur-2xl" />
          <div className="absolute -bottom-20 -left-10 w-64 h-64 rounded-full bg-white/6 blur-2xl" />

          <Mail className="w-10 h-10 mx-auto mb-4 opacity-90" />
          <h2 className="text-2.5xl md:text-[2.2rem] font-bold tracking-tight">
            Get planting alerts & market updates
          </h2>
          <p className="mt-2.5 text-white/75 text-[0.95rem] max-w-lg mx-auto">
            Join the AgriAI newsletter — seasonal planting calendars, disease alerts and market price digests for Ghana.
          </p>

          {done ? (
            <div className="mt-7 inline-flex items-center gap-2 bg-white/15 backdrop-blur px-6 py-3.5 rounded-full font-semibold">
              <CheckCircle2 className="w-5 h-5" /> You&apos;re on the list! Check your inbox 🌱
            </div>
          ) : (
            <form onSubmit={subscribe} className="mt-7 flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name (optional)"
                className="flex-1 rounded-full px-5 py-3.5 bg-white/95 text-[#111] placeholder:text-gray-400 outline-none text-[0.9rem]"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 rounded-full px-5 py-3.5 bg-white/95 text-[#111] placeholder:text-gray-400 outline-none text-[0.9rem]"
              />
              <button
                type="submit"
                disabled={busy}
                className="btn px-6 py-3.5 text-[0.9rem] text-[var(--deep)] disabled:opacity-60"
                style={{ background: "var(--accent)" }}
              >
                {busy ? "Subscribing…" : (
                  <>
                    Subscribe <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <p className="mt-4 text-[0.78rem] text-white/55">
            We only send useful farming updates. No spam, unsubscribe anytime.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
