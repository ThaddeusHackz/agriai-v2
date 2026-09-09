"use client";

// ─── Site settings context ───────────────────────────────────────────────────
// Loads public settings from the backend (which the admin panel edits) and
// applies the brand colors to CSS variables so the whole site re-themes live.

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface PublicSettings {
  siteName: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  heroBadge: string;
  announcement: string;
  announcementEnabled: boolean;
  primaryColor: string;
  deepColor: string;
  accentColor: string;
  showSections: {
    features: boolean;
    prices: boolean;
    weather: boolean;
    disease: boolean;
    how: boolean;
    testimonials: boolean;
    team: boolean;
    faq: boolean;
    newsletter: boolean;
    studio: boolean;
  };
  chat: {
    placeholder: string;
    quickPrompts: string[];
    webSearchDefault: boolean;
    defaultMode: "standard" | "expert" | "agent";
    model: string;
  };
  stats: { label: string; value: string }[];
  contactEmail: string;
  footerText: string;
}

const DEFAULTS: PublicSettings = {
  siteName: "AgriAI",
  tagline: "Intelligent Farming Assistant for Ghana",
  heroTitle: "The Future of Farming in Ghana",
  heroSubtitle: "AI that speaks your language.",
  heroBadge: "🇬🇭 Ghana's #1 AI Farming Assistant",
  announcement: "🌱 AgriAI 2.0 is live!",
  announcementEnabled: false,
  primaryColor: "#00c853",
  deepColor: "#0b3d1f",
  accentColor: "#f9bc13",
  showSections: {
    features: true, prices: true, weather: true, disease: true,
    how: true, testimonials: true, team: true, faq: true, newsletter: true, studio: true,
  },
  chat: {
    placeholder: "Ask about crops, weather, market prices…",
    quickPrompts: ["Best time to plant maize in Ghana"],
    webSearchDefault: false,
    defaultMode: "standard",
    model: "gemini-3.5-flash",
  },
  stats: [{ label: "Farmers Reached", value: "12,400+" }],
  contactEmail: "admin@agriai.gh",
  footerText: "Intelligent Farming for Ghana — University of Ghana • 2026",
};

interface SiteContextValue {
  settings: PublicSettings;
  loaded: boolean;
  reload: () => Promise<void>;
}

const SiteContext = createContext<SiteContextValue>({
  settings: DEFAULTS,
  loaded: false,
  reload: async () => {},
});

export function applyTheme(settings: PublicSettings) {
  const root = document.documentElement;
  root.style.setProperty("--primary", settings.primaryColor);
  root.style.setProperty("--primary-strong", settings.primaryColor);
  root.style.setProperty("--deep", settings.deepColor);
  root.style.setProperty("--accent", settings.accentColor);
  root.style.setProperty("--primary-soft", colorMix(settings.primaryColor, "#ffffff", 0.88));
}

function colorMix(c1: string, c2: string, weight: number): string {
  try {
    const p = (h: string) => parseInt(h.slice(1), 16);
    const a = p(c1), b = p(c2);
    const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
    const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
    const mix = (x: number, y: number) => Math.round(x * weight + y * (1 - weight));
    return `rgb(${mix(ar, br)}, ${mix(ag, bg)}, ${mix(ab, bb)})`;
  } catch {
    return "#e8f9ef";
  }
}

export function SiteProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<PublicSettings>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/config", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const s: PublicSettings = { ...DEFAULTS, ...data.settings };
        setSettings(s);
        applyTheme(s);
      }
    } catch {
      // keep defaults
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <SiteContext.Provider value={{ settings, loaded, reload }}>
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  return useContext(SiteContext);
}
