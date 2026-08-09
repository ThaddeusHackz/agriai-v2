"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Globe, Mic, Volume2, FlaskConical, Bot, Languages, TrendingUp, CloudSun,
} from "lucide-react";
import Section from "./Section";
import { useSite } from "@/lib/site-context";

const FEATURES = [
  {
    icon: Globe,
    title: "Live Web Search",
    desc: "Real-time answers grounded in the latest news, prices and research — with citations you can click.",
  },
  {
    icon: Mic,
    title: "Voice Input",
    desc: "Speak in your own words. Browser speech recognition with OpenAI Whisper as backup.",
  },
  {
    icon: Volume2,
    title: "Voice Output",
    desc: "Listen to answers in a natural ElevenLabs voice — perfect for farmers on the go.",
  },
  {
    icon: FlaskConical,
    title: "Expert Mode",
    desc: "Deep agronomy: NPK ratios, application rates, disease life-cycles and IPM strategies.",
  },
  {
    icon: Bot,
    title: "Agent Mode",
    desc: "An autonomous research agent that gathers data, then answers with structured steps.",
  },
  {
    icon: Languages,
    title: "6 Languages",
    desc: "English, Twi, Ga, Ewe, Hausa & French — AI that speaks your language.",
  },
  {
    icon: TrendingUp,
    title: "Market Prices",
    desc: "Crop prices across Ghana's major markets, refreshed with live web intel.",
  },
  {
    icon: CloudSun,
    title: "Weather Aware",
    desc: "5-day forecasts for Accra, Kumasi, Tamale, Takoradi & Cape Coast with farming advice.",
  },
];

export default function Features() {
  const { settings } = useSite();
  return (
    <Section
      id="features"
      title="Everything a Ghanaian farmer needs"
      subtitle="One assistant for crops, disease, prices, weather and finance — built with the University of Ghana team."
      show={settings.showSections.features}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45, delay: (i % 4) * 0.07 }}
            className="card p-6 rounded-3xl hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] transition-all duration-300"
          >
            <span
              className="inline-flex w-11 h-11 rounded-2xl items-center justify-center text-white mb-4 shadow-md"
              style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-strong))" }}
            >
              <f.icon className="w-5 h-5" />
            </span>
            <h3 className="font-bold text-[1.02rem] text-[var(--deep)]">{f.title}</h3>
            <p className="mt-1.5 text-[0.85rem] leading-relaxed text-[var(--muted)]">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
