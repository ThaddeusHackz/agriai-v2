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
import Team from "@/components/Team";
import FAQ from "@/components/FAQ";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";

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
    <div id="top" className="min-h-screen bg-white">
      <VisitorTracker />
      <AnnouncementBar />
      <Nav />
      <main className={loaded ? "opacity-100 transition-opacity duration-300" : "opacity-0"}>
        <Hero />
        <div className="max-w-6xl mx-auto px-5 md:px-8 pb-6">
          <Chat />
        </div>
        <HowItWorks />
        <div className="bg-gradient-to-b from-white via-[#f6faf7] to-white">
          <Features />
        </div>
        <DiseaseDetector />
        <div className="bg-gradient-to-b from-white via-[#f6faf7] to-white">
          <MarketPrices />
        </div>
        <WeatherSection />
        <Testimonials />
        <Team />
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
