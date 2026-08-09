"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, MessageCircleQuestion } from "lucide-react";
import Section from "./Section";
import { useSite } from "@/lib/site-context";

const FAQS = [
  {
    q: "Is AgriAI free to use?",
    a: "Yes — the web app is completely free for all farmers in Ghana. It was built as a University of Ghana student project to support the digital agriculture transition.",
  },
  {
    q: "Which languages does AgriAI speak?",
    a: "English, Twi, Ga, Ewe, Hausa and French. Pick your language in the chat — answers come back in the same language, with technical terms explained simply.",
  },
  {
    q: "Can I use voice on any phone?",
    a: "Yes. On any smartphone with a browser (Chrome recommended), tap the microphone button and speak. If your browser doesn't support voice, AgriAI falls back to OpenAI Whisper transcription.",
  },
  {
    q: "How accurate is crop disease detection?",
    a: "The vision model reaches around 92% accuracy on common Ghanaian crop diseases in our tests. Always confirm with your district MoFA agricultural extension officer before large-scale treatment.",
  },
  {
    q: "Where do market prices come from?",
    a: "The AgriAI team curates prices from Ghana's major markets (Accra, Kumasi, Tamale, Techiman…) and the board refreshes them with live web intel. Prices are indicative — always compare 2–3 buyers.",
  },
  {
    q: "Who built AgriAI?",
    a: "A team of four University of Ghana students: Nana Ware Henry Opoku (lead developer), Thaddeus Nii Teiko Tagoe, Comfort Poedza and Edmond Nana Yaw Boateng.",
  },
];

export default function FAQ() {
  const { settings } = useSite();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <Section
      id="faq"
      title="Frequently asked questions"
      subtitle="Everything you need to know about AgriAI."
      show={settings.showSections.faq}
    >
      <div className="max-w-3xl mx-auto space-y-3">
        {FAQS.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="card rounded-3xl overflow-hidden"
          >
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between gap-4 px-6 py-4.5 text-left hover:bg-[var(--surface)]/50 transition"
            >
              <span className="flex items-center gap-3 font-semibold text-[0.95rem] text-[var(--deep)]">
                <MessageCircleQuestion className="w-4.5 h-4.5 shrink-0" style={{ color: "var(--primary)" }} />
                {f.q}
              </span>
              <ChevronDown
                className={`w-4.5 h-4.5 shrink-0 text-[var(--muted)] transition-transform ${open === i ? "rotate-180" : ""}`}
              />
            </button>
            {open === i && (
              <div className="px-6 pb-5 pl-[3.35rem] text-[0.88rem] leading-relaxed text-[var(--muted)] fade-up">
                {f.a}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
