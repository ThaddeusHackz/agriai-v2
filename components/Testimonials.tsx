"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import Section from "./Section";
import { useSite } from "@/lib/site-context";

const TESTIMONIALS = [
  {
    quote:
      "I asked in Twi about my wilting tomato plants and AgriAI told me it was fusarium — the treatment worked and I saved my nursery.",
    name: "Ama Serwaa",
    role: "Tomato farmer · Ashanti Region",
    initials: "AS",
  },
  {
    quote:
      "The market prices board saved me from underselling my maize. I checked Kumasi prices before the middleman came — he matched them!",
    name: "Kwame Boateng",
    role: "Maize farmer · Bono East",
    initials: "KB",
  },
  {
    quote:
      "I used the voice feature while working on the farm. It speaks back to me in Ewe. My father thinks it's magic!",
    name: "Efua Mensah",
    role: "Cassava farmer · Volta Region",
    initials: "EM",
  },
];

export default function Testimonials() {
  const { settings } = useSite();
  return (
    <Section
      id="testimonials"
      title="Farmers love AgriAI"
      subtitle="Built with farmers, tested in the field — from the University of Ghana team."
      show={settings.showSections.testimonials}
    >
      <div className="grid md:grid-cols-3 gap-5">
        {TESTIMONIALS.map((t, i) => (
          <motion.figure
            key={t.name}
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: i * 0.1 }}
            className="card rounded-3xl p-7 flex flex-col"
          >
            <Quote className="w-6 h-6 mb-3" style={{ color: "var(--primary)" }} />
            <blockquote className="text-[0.9rem] leading-relaxed text-[var(--text)] flex-1">
              &ldquo;{t.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-5 pt-4 border-t border-[var(--border)] flex items-center gap-3">
              <span
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-[0.85rem]"
                style={{ background: "linear-gradient(135deg, var(--primary), var(--deep))" }}
              >
                {t.initials}
              </span>
              <div>
                <div className="font-bold text-[0.88rem] text-[var(--deep)]">{t.name}</div>
                <div className="text-[0.75rem] text-[var(--muted)]">{t.role}</div>
              </div>
              <span className="ml-auto flex gap-0.5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 fill-current" style={{ color: "var(--accent)" }} />
                ))}
              </span>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </Section>
  );
}
