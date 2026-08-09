"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowDown, Sparkles, MessageCircle } from "lucide-react";
import { useSite } from "@/lib/site-context";

export default function Hero() {
  const { settings } = useSite();

  return (
    <div className="relative overflow-hidden">
      {/* soft background washes */}
      <div
        className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full opacity-[0.13] blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, var(--primary), transparent 65%)" }}
      />
      <div
        className="absolute top-24 -right-40 w-[520px] h-[520px] rounded-full opacity-[0.10] blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, var(--accent), transparent 65%)" }}
      />

      <div className="relative max-w-4xl mx-auto px-5 md:px-8 pt-14 md:pt-20 pb-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center gap-2 text-[0.8rem] font-semibold px-4 py-1.5 rounded-full border bg-white shadow-sm text-[var(--deep)]">
            <Sparkles className="w-3.5 h-3.5" style={{ color: "var(--primary)" }} />
            {settings.heroBadge}
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="mt-6 text-[2.7rem] leading-[1.06] md:text-[4.1rem] font-bold tracking-tighter text-[var(--deep)]"
        >
          {settings.heroTitle.split(" ").slice(0, -1).join(" ")}{" "}
          <span className="gradient-text">{settings.heroTitle.split(" ").slice(-1)}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.16 }}
          className="mt-4 text-xl md:text-2xl text-[var(--muted)] font-medium"
        >
          {settings.heroSubtitle}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.22 }}
          className="mt-3 text-[0.95rem] text-[var(--muted)] max-w-xl mx-auto"
        >
          Chat in English, Twi, Ga, Ewe, Hausa or French · Voice input &amp; output ·
          Live web search · Crop disease detection · Market prices
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.3 }}
          className="mt-8 flex items-center justify-center gap-3"
        >
          <a href="#assistant" className="btn btn-primary px-7 py-3.5 text-[0.98rem]">
            <MessageCircle className="w-4.5 h-4.5" />
            Ask AgriAI
          </a>
          <a href="#disease-detection" className="btn btn-ghost px-7 py-3.5 text-[0.98rem]">
            Scan a Crop
            <ArrowDown className="w-4 h-4" />
          </a>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.42 }}
          className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          {settings.stats.map((s) => (
            <div key={s.label} className="card px-4 py-5 rounded-3xl">
              <div className="text-[1.55rem] font-bold tracking-tight text-[var(--deep)]">
                {s.value}
              </div>
              <div className="mt-1 text-[0.78rem] font-medium text-[var(--muted)]">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
