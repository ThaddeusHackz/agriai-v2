// ─── GET /api/weather — Ghana 5-day forecast ─────────────────────────────────
// Provider chain: OpenWeatherMap (OPENWEATHER_API_KEY) → Open-Meteo (keyless)
// → curated seed data. The site never breaks; `demo` tells the UI which
// quality tier the data came from.

import { NextRequest, NextResponse } from "next/server";
import { openweatherForecast } from "@/lib/openweather";

export const runtime = "nodejs";
export const maxDuration = 30;

const CITIES: Record<string, { name: string; lat: number; lon: number }> = {
  accra: { name: "Accra", lat: 5.6037, lon: -0.187 },
  kumasi: { name: "Kumasi", lat: 6.6885, lon: -1.6244 },
  tamale: { name: "Tamale", lat: 9.4008, lon: -0.8393 },
  takoradi: { name: "Takoradi", lat: 4.8845, lon: -1.7554 },
  "cape coast": { name: "Cape Coast", lat: 5.1053, lon: -1.2466 },
};

function adviceFor(temp: number, precip: number, humidity: number): string {
  if (precip >= 5) return "Good rain expected — ideal for transplanting and fertilizer top-dressing.";
  if (precip >= 1) return "Light showers — good for planting; keep drainage clear.";
  if (temp >= 34) return "Very hot — irrigate early morning/evening and mulch to hold moisture.";
  if (humidity >= 85) return "High humidity — watch for fungal diseases (spray preventively).";
  return "Dry conditions — plan irrigation and check soil moisture before planting.";
}

function seedForecast(seed: number) {
  // deterministic pseudo-random from seed so fallback data is stable per city
  let s = seed;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const daily = [];
  const start = new Date();
  for (let i = 0; i < 5; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    daily.push({
      date: d.toISOString().slice(0, 10),
      tmax: Math.round(29 + rnd() * 6),
      tmin: Math.round(21 + rnd() * 4),
      precip: Math.round(rnd() * 18 * 10) / 10,
      wind: Math.round(8 + rnd() * 14),
    });
  }
  const cur = daily[0];
  return {
    current: {
      temp: Math.round((cur.tmax + cur.tmin) / 2),
      humidity: Math.round(70 + rnd() * 20),
      precip: cur.precip,
      wind: cur.wind,
    },
    daily,
  };
}

async function openMeteoFallback(lat: number, lon: number) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m"
  );
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max");
  url.searchParams.set("timezone", "Africa/Accra");
  url.searchParams.set("forecast_days", "5");

  const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`open-meteo ${res.status}`);
  const data = await res.json();

  const daily = (data.daily?.time || []).map((date: string, i: number) => ({
    date,
    tmax: Math.round(data.daily.temperature_2m_max[i]),
    tmin: Math.round(data.daily.temperature_2m_min[i]),
    precip: data.daily.precipitation_sum[i] ?? 0,
    wind: Math.round(data.daily.wind_speed_10m_max[i] ?? 0),
  }));

  const cur = data.current || {};
  const current = {
    temp: Math.round(cur.temperature_2m ?? daily[0]?.tmax ?? 28),
    humidity: Math.round(cur.relative_humidity_2m ?? 70),
    precip: cur.precipitation ?? 0,
    wind: Math.round(cur.wind_speed_10m ?? 10),
  };
  return { current, daily };
}

export async function GET(request: NextRequest) {
  const cityKey = (request.nextUrl.searchParams.get("city") || "accra").toLowerCase();
  const city = CITIES[cityKey] || CITIES.accra;

  // 1) OpenWeatherMap (real API key from Render)
  try {
    const ow = await openweatherForecast(city.lat, city.lon);
    return NextResponse.json({
      city: city.name,
      current: ow.current,
      daily: ow.daily,
      advice: adviceFor(ow.current.temp, ow.current.precip, ow.current.humidity),
      source: "openweather",
      demo: false,
    });
  } catch (err) {
    console.error("[weather] OpenWeather failed, trying Open-Meteo:", (err as Error).message);
  }

  // 2) Open-Meteo (keyless)
  try {
    const om = await openMeteoFallback(city.lat, city.lon);
    return NextResponse.json({
      city: city.name,
      current: om.current,
      daily: om.daily,
      advice: adviceFor(om.current.temp, om.current.precip, om.current.humidity),
      source: "open-meteo",
      demo: true,
    });
  } catch (err) {
    console.error("[weather] Open-Meteo failed, using seed data:", (err as Error).message);
  }

  // 3) deterministic seed data — never breaks
  const fb = seedForecast(city.lat * 1000 + city.lon);
  return NextResponse.json({
    city: city.name,
    current: fb.current,
    daily: fb.daily,
    advice: adviceFor(fb.current.temp, fb.current.precip, fb.current.humidity),
    source: "seed",
    demo: true,
  });
}
