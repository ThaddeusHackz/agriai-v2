"use client";

// ─── AgriAI 2.0 — main landing page ──────────────────────────────────────────

import React, { useEffect } from "react";
import { SiteProvider, useSite } from "@/lib/site-context";
import AnnouncementBar from "@/components/AnnouncementBar";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Chat from "@/components/Chat";
import Features from "@/components/Features";
import DiseaseDetector from "@/components/DiseaseDetector";
import MarketPrices from "@/components/MarketPrices";
import WeatherSection from "@/components/WeatherSection";
import HowItWorks from "@/components/HowItWorks";
import Testimonials from "@/components/Testimonials";
import Founder from "@/components/Founder";
import CropStudio from "@/components/CropStudio";
import FAQ from "@/components/FAQ";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";

const MARQUEE_ITEMS = [
  "🌽 Maize", "🍫 Cocoa", "🌿 Cassava", "🍠 Yam", "🍌 Plantain", "🌾 Rice",
  "🍅 Tomatoes", "🌶️ Pepper", "🥜 Groundnut", "🫘 Soybean", "🫚 Ginger", "🌴 Palm Oil",
  "🍍 Pineapple", "🥭 Mango", "💧 Irrigation", "🌦️ Weather", "📈 Prices", "🧪 Soil",
];

function MarqueeStrip() {
  return (
    <div className="relative border-y border-[var(--border)] bg-[rgba(255,255,255,0.02)] py-3.5 overflow-hidden select-none">
      <div className="marquee-track">
        {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
          <span key={i} className="text-[0.85rem] font-medium text-[var(--muted)] whitespace-nowrap">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function VisitorTracker() {
  useEffect(() => {
    let vid = localStorage.getItem("agriai_visitor");
    if (!vid) {
      vid = `v_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem("agriai_visitor", vid);
    }
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId: vid }),
    }).catch(() => {});
  }, []);
  return null;
}

function PageInner() {
  const { loaded } = useSite();
  return (
    <div id="top" className="min-h-screen bg-[var(--bg)]">
      <VisitorTracker />
      <AnnouncementBar />
      <Nav />
      <main className={loaded ? "opacity-100 transition-opacity duration-300" : "opacity-0"}>
        <Hero />
        <MarqueeStrip />
        <div className="max-w-6xl mx-auto px-5 md:px-8 pb-6">
          <Chat />
        </div>
        <HowItWorks />
        <div className="bg-gradient-to-b from-[var(--bg)] via-[rgba(255,255,255,0.02)] to-[var(--bg)]">
          <Features />
        </div>
        <DiseaseDetector />
        <div className="bg-gradient-to-b from-[var(--bg)] via-[rgba(255,255,255,0.02)] to-[var(--bg)]">
          <MarketPrices />
        </div>
        <WeatherSection />
        <CropStudio />
        <Testimonials />
        <Founder />
        <FAQ />
        <Newsletter />
      </main>
      <Footer />
    </div>
  );
}

export default function Home() {
  return (
    <SiteProvider>
      <PageInner />
    </SiteProvider>
  );
}
