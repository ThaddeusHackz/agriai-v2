"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, Sparkles, MessageCircle, ScanSearch, CloudSun, Leaf } from "lucide-react";
import { useSite } from "@/lib/site-context";
import CountUp from "./CountUp";

const ROTATING_WORDS = [
  "planting seasons 🌽",
  "crop diseases 🍃",
  "market prices 💰",
  "weather forecasts 🌦️",
  "fertilizer plans 🧪",
];

export default function Hero() {
  const { settings } = useSite();
  const [wordIdx, setWordIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setWordIdx((i) => (i + 1) % ROTATING_WORDS.length), 2600);
    return () => clearInterval(t);
  }, []);

  const words = settings.heroTitle.split(" ");
  const lastWord = words.pop() || "Ghana";

  return (
    <div className="relative overflow-hidden">
      {/* aurora washes */}
      <div
        className="absolute -top-40 -left-40 w-[560px] h-[560px] rounded-full opacity-25 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, var(--primary), transparent 62%)" }}
      />
      <div
        className="absolute top-10 -right-48 w-[560px] h-[560px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, var(--accent), transparent 62%)" }}
      />
      {/* floating leaf deco */}
      <motion.div
        className="absolute top-24 left-[8%] hidden md:block text-[var(--primary)]/30"
        animate={{ y: [0, -18, 0], rotate: [0, 24, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      >
        <Leaf className="w-12 h-12" />
      </motion.div>
      <motion.div
        className="absolute bottom-16 right-[6%] hidden md:block text-[var(--accent)]/25"
        animate={{ y: [0, 14, 0], rotate: [0, -18, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
      >
        <CloudSun className="w-10 h-10" />
      </motion.div>

      <div className="relative max-w-4xl mx-auto px-5 md:px-8 pt-14 md:pt-24 pb-12 text-center">
        {/* badge */}
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55 }}
        >
          <span className="aura-border inline-flex items-center gap-2.5 text-[0.8rem] font-semibold px-4 py-2 rounded-full">
            <span className="relative flex h-2 w-2">
              <span
                className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
                style={{ background: "var(--primary)" }}
              />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "var(--primary)" }} />
            </span>
            <Sparkles className="w-3.5 h-3.5" style={{ color: "var(--primary)" }} />
            <span className="text-[var(--ink)]">{settings.heroBadge}</span>
          </span>
        </motion.div>

        {/* title — staggered word reveal */}
        <h1 className="mt-7 text-[2.75rem] leading-[1.04] md:text-[4.4rem] font-extrabold tracking-tighter text-[var(--ink)]">
          {words.map((w, i) => (
            <motion.span
              key={`${w}-${i}`}
              className="inline-block mr-[0.24em]"
              initial={{ opacity: 0, y: 34, rotateX: 55, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.6, delay: 0.12 + i * 0.085, ease: [0.22, 1, 0.36, 1] }}
            >
              {w}
            </motion.span>
          ))}
          <motion.span
            className="gradient-text inline-block"
            initial={{ opacity: 0, y: 34, rotateX: 55, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.6, delay: 0.12 + words.length * 0.085, ease: [0.22, 1, 0.36, 1] }}
          >
            {lastWord}
          </motion.span>
        </h1>

        {/* subtitle with rotating words */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.5 }}
          className="mt-5 text-lg md:text-2xl text-[var(--muted)] font-medium flex flex-wrap items-center justify-center gap-x-2 gap-y-1"
        >
          <span>Ask me about</span>
          <span className="relative inline-block text-left" style={{ minWidth: "9.5rem" }}>
            <AnimatePresence mode="wait">
              <motion.span
                key={wordIdx}
                initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -14, filter: "blur(4px)" }}
                transition={{ duration: 0.32 }}
                className="inline-block font-bold text-[var(--primary)]"
              >
                {ROTATING_WORDS[wordIdx]}
              </motion.span>
            </AnimatePresence>
          </span>
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.6 }}
          className="mt-4 text-[0.95rem] text-[var(--muted)] max-w-xl mx-auto"
        >
          Chat in English, Twi, Ga, Ewe, Hausa or French · Voice input &amp; output ·
          Live web search · Crop disease detection · Market prices
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.7 }}
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
        >
          <a href="#assistant" className="btn btn-primary px-8 py-3.5 text-[0.98rem] glow-pulse">
            <MessageCircle className="w-4.5 h-4.5" />
            Ask AgriAI
          </a>
          <a href="#disease-detection" className="btn btn-ghost px-7 py-3.5 text-[0.98rem]">
            <ScanSearch className="w-4.5 h-4.5" />
            Scan a Crop
          </a>
          <a href="#studio" className="btn btn-ghost px-7 py-3.5 text-[0.98rem]">
            <Sparkles className="w-4 h-4" style={{ color: "var(--accent)" }} />
            AI Visualizer
          </a>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.85 }}
          className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          {settings.stats.map((s) => (
            <div key={s.label} className="card px-4 py-5 rounded-3xl hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] transition-all duration-300">
              <div className="text-[1.55rem] font-bold tracking-tight text-[var(--ink)]">
                <CountUp value={s.value} />
              </div>
              <div className="mt-1 text-[0.78rem] font-medium text-[var(--muted)]">{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* scroll hint */}
        <motion.a
          href="#assistant"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          className="mt-12 inline-flex flex-col items-center gap-2 text-[0.72rem] text-[var(--muted)] hover:text-[var(--primary)] transition"
        >
          Scroll to explore
          <motion.span animate={{ y: [0, 6, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
            <ArrowDown className="w-4 h-4" />
          </motion.span>
        </motion.a>
      </div>
    </div>
  );
}
