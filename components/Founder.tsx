"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Github, Mail, MapPin, GraduationCap } from "lucide-react";
import Section from "./Section";
import { useSite } from "@/lib/site-context";

const SKILLS = [
  "Full-Stack Development",
  "AI / Machine Learning",
  "Multilingual NLP",
  "Cloud & DevOps",
  "Computer Vision",
  "AgriTech Innovation",
];

export default function Founder() {
  const { settings } = useSite();
  return (
    <Section
      id="founder"
      title="Meet the Founder"
      subtitle="AgriAI is designed, built and maintained by one person with a mission — technology that works for every Ghanaian farmer."
      show={settings.showSections.team}
    >
      <motion.div
        initial={{ opacity: 0, y: 26 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto"
      >
        <div className="aura-border p-8 md:p-10 text-center">
          {/* avatar with rotating rings */}
          <div className="relative inline-block">
            <motion.div
              className="absolute -inset-3 rounded-full border border-dashed"
              style={{ borderColor: "color-mix(in srgb, var(--primary) 50%, transparent)" }}
              animate={{ rotate: 360 }}
              transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute -inset-6 rounded-full border"
              style={{ borderColor: "rgba(255,255,255,0.08)" }}
              animate={{ rotate: -360 }}
              transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
            />
            <div
              className="relative w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center text-[2rem] font-display font-bold text-[#03230f]"
              style={{
                background: "linear-gradient(135deg, var(--primary), var(--primary-strong))",
                boxShadow: "0 0 40px color-mix(in srgb, var(--primary) 40%, transparent)",
              }}
            >
              TT
            </div>
          </div>

          <h3 className="mt-8 text-2xl md:text-3xl font-bold text-[var(--ink)]">
            Thaddeus Nii Teiko Tagoe
          </h3>
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-[0.85rem] font-semibold text-[var(--primary)]">
            <Sparkles className="w-3.5 h-3.5" /> Founder & Lead Developer
          </p>

          <p className="mt-4 text-[0.95rem] leading-relaxed text-[var(--muted)] max-w-xl mx-auto">
            Thaddeus is a Computer Science student at the University of Ghana who
            believes the farmer&apos;s phone should be as powerful as the agronomist&apos;s
            notebook. AgriAI brings multilingual AI, disease detection, market
            intelligence and weather awareness together in one assistant — in the
            languages Ghana actually speaks.
          </p>

          {/* skills */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {SKILLS.map((s) => (
              <span key={s} className="chip !cursor-default hover:!bg-[var(--surface)]">
                {s}
              </span>
            ))}
          </div>

          {/* meta */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[0.82rem] text-[var(--muted)]">
            <span className="inline-flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4" style={{ color: "var(--primary)" }} /> University of Ghana
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-4 h-4" style={{ color: "var(--primary)" }} /> Accra, Ghana
            </span>
            <a href={`mailto:${settings.contactEmail}`} className="inline-flex items-center gap-1.5 hover:text-[var(--primary)] transition">
              <Mail className="w-4 h-4" style={{ color: "var(--primary)" }} /> {settings.contactEmail}
            </a>
            <a href="https://github.com/ThaddeusHackz" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-[var(--primary)] transition">
              <Github className="w-4 h-4" style={{ color: "var(--primary)" }} /> GitHub
            </a>
          </div>
        </div>
      </motion.div>
    </Section>
  );
}
