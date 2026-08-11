"use client";

// ─── Weather — 5-day forecast for Ghana's major cities ───────────────────────

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CloudSun, Droplets, Wind, Thermometer, Umbrella, MapPin, WifiOff } from "lucide-react";
import Section from "./Section";
import { useSite } from "@/lib/site-context";

const CITIES = [
  { key: "accra", label: "Accra" },
  { key: "kumasi", label: "Kumasi" },
  { key: "tamale", label: "Tamale" },
  { key: "takoradi", label: "Takoradi" },
  { key: "cape coast", label: "Cape Coast" },
];

interface Day {
  date: string;
  tmax: number;
  tmin: number;
  precip: number;
  wind: number;
  icon?: string;
}

// OpenWeather icon code → emoji (day/night aware)
const WX: Record<string, string> = {
  "01d": "☀️", "01n": "🌙", "02d": "⛅", "02n": "☁️", "03d": "☁️", "03n": "☁️",
  "04d": "☁️", "04n": "☁️", "09d": "🌧️", "09n": "🌧️", "10d": "🌦️", "10n": "🌧️",
  "11d": "⛈️", "11n": "⛈️", "13d": "🌨️", "13n": "🌨️", "50d": "🌫️", "50n": "🌫️",
};

interface WeatherData {
  city: string;
  current: { temp: number; humidity: number; precip: number; wind: number; icon?: string; desc?: string };
  daily: Day[];
  advice: string;
  demo: boolean;
}

const EMPTY: WeatherData = {
  city: "Accra",
  current: { temp: 28, humidity: 70, precip: 0, wind: 10 },
  daily: [],
  advice: "",
  demo: true,
};

export default function WeatherSection() {
  const { settings } = useSite();
  const [city, setCity] = useState("accra");
  const [data, setData] = useState<WeatherData>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/weather?city=${encodeURIComponent(city)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setData(EMPTY);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [city]);

  const dayLabel = (date: string) =>
    new Date(date + "T00:00:00").toLocaleDateString("en-GH", { weekday: "short", day: "numeric" });

  return (
    <Section
      id="weather"
      title="Weather & Farming Forecast"
      subtitle="Plan planting, spraying and irrigation around the weather — with practical farming advice."
      show={settings.showSections.weather}
    >
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="card rounded-3xl p-6 md:p-8"
      >
        {/* city tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CITIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setCity(c.key)}
              className={`chip ${city === c.key ? "chip-active" : ""}`}
            >
              <MapPin className="w-3.5 h-3.5" /> {c.label}
            </button>
          ))}
          {data.demo && !loading && (
            <span className="inline-flex items-center gap-1.5 text-[0.72rem] font-semibold text-[#f5c96b] bg-[rgba(249,188,19,0.12)] border border-[rgba(249,188,19,0.3)] px-3 py-1.5 rounded-full">
              <WifiOff className="w-3 h-3" /> cached forecast
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-40 rounded-3xl bg-[var(--surface-2)] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* current */}
            <div className="rounded-3xl text-white p-6 relative overflow-hidden" style={{ background: "linear-gradient(135deg, var(--deep-bg), #0f5c33)" }}>
              <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10" />
              <div className="text-[0.75rem] font-bold uppercase tracking-wider text-white/70">
                {data.city} · Now
              </div>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-[3.4rem] font-bold leading-none tracking-tighter">
                  {Math.round(data.current.temp)}°
                </span>
                <span className="text-[2.2rem] leading-none mb-1.5">{WX[data.current.icon || ""] || "🌤️"}</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-[0.78rem]">
                <div className="bg-white/12 rounded-xl px-2.5 py-2 text-center">
                  <Droplets className="w-3.5 h-3.5 mx-auto mb-1 text-white/70" />
                  {data.current.humidity}% humidity
                </div>
                <div className="bg-white/12 rounded-xl px-2.5 py-2 text-center">
                  <Umbrella className="w-3.5 h-3.5 mx-auto mb-1 text-white/70" />
                  {data.current.precip} mm rain
                </div>
                <div className="bg-white/12 rounded-xl px-2.5 py-2 text-center">
                  <Wind className="w-3.5 h-3.5 mx-auto mb-1 text-white/70" />
                  {data.current.wind} km/h
                </div>
              </div>
            </div>

            {/* advice + daily */}
            <div className="lg:col-span-2">
              <div className="rounded-3xl bg-[var(--surface)] border border-[var(--border)] px-5 py-4 mb-4 flex gap-3">
                <span className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white" style={{ background: "var(--accent)" }}>
                  <Thermometer className="w-4.5 h-4.5" />
                </span>
                <div>
                  <div className="font-bold text-[0.85rem] text-[var(--ink)]">Farming advice for today</div>
                  <p className="text-[0.83rem] text-[var(--muted)] leading-relaxed mt-0.5">{data.advice}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {data.daily.map((d, i) => (
                  <div key={d.date} className="rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.045)] px-2 py-3.5 text-center hover:shadow-md transition">
                    <div className="text-[0.7rem] font-bold text-[var(--muted)] uppercase">{i === 0 ? "Today" : dayLabel(d.date)}</div>
                    <div className="mt-2 text-[1.3rem] font-bold text-[var(--ink)]">{Math.round(d.tmax)}° <span className="text-[1rem]">{WX[d.icon || ""] || ""}</span></div>
                    <div className="text-[0.72rem] text-[var(--muted)]">↓ {Math.round(d.tmin)}°</div>
                    <div className="mt-2 inline-flex items-center gap-1 text-[0.7rem] font-semibold text-[#7cc4ff] bg-[rgba(59,130,246,0.14)] border border-[rgba(59,130,246,0.3)] px-2 py-0.5 rounded-full">
                      <Umbrella className="w-3 h-3" /> {d.precip}mm
                    </div>
                    <div className="mt-1 text-[0.68rem] text-[var(--muted)]">💨 {d.wind} km/h</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </Section>
  );
}
