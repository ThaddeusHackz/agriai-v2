"use client";

import React from "react";
import { motion } from "framer-motion";
import { MessageCircle, ScanSearch, Sprout } from "lucide-react";
import Section from "./Section";
import { useSite } from "@/lib/site-context";

const STEPS = [
  {
    icon: MessageCircle,
    step: "01",
    title: "Ask in your language",
    desc: "Type or speak your question in English, Twi, Ga, Ewe, Hausa or French — no tech skills needed.",
  },
  {
    icon: ScanSearch,
    step: "02",
    title: "Get grounded answers",
    desc: "AgriAI searches live sources, checks its knowledge base, and answers with citations you can verify.",
  },
  {
    icon: Sprout,
    step: "03",
    title: "Act with confidence",
    desc: "Follow the step-by-step treatment, planting or selling plan — then track prices and weather here.",
  },
];

export default function HowItWorks() {
  const { settings } = useSite();
  return (
    <Section
      id="how"
      title="How it works"
      subtitle="From a farmer's question to an actionable plan in seconds."
      show={settings.showSections.how}
    >
      <div className="grid md:grid-cols-3 gap-5">
        {STEPS.map((s, i) => (
          <motion.div
            key={s.step}
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: i * 0.1 }}
            className="relative card rounded-3xl p-7 overflow-hidden"
          >
            <span className="absolute -right-2 -top-5 text-[4.6rem] font-black text-[var(--surface-2)] select-none">
              {s.step}
            </span>
            <span className="relative inline-flex w-12 h-12 rounded-2xl items-center justify-center text-white shadow-md" style={{ background: "var(--primary)" }}>
              <s.icon className="w-5.5 h-5.5" />
            </span>
            <h3 className="relative mt-4 font-bold text-[1.05rem] text-[var(--ink)]">{s.title}</h3>
            <p className="relative mt-2 text-[0.86rem] leading-relaxed text-[var(--muted)]">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
