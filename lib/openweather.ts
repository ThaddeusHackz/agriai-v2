// ─── OpenWeatherMap integration (5-day forecast for Ghana) ───────────────────
// Uses the free-tier 2.5 endpoints:
//   current:  /data/2.5/weather
//   forecast: /data/2.5/forecast  (5 days, 3-hour steps)
// When OPENWEATHER_API_KEY is missing or the API fails, callers fall back to
// Open-Meteo and then to curated seed data — the site never breaks.

export interface WeatherDay {
  date: string;
  tmax: number;
  tmin: number;
  precip: number;
  wind: number;
  icon?: string; // OpenWeather icon code, e.g. "01d"
}

export interface WeatherNow {
  temp: number;
  humidity: number;
  precip: number;
  wind: number;
  icon?: string;
  desc?: string;
}

export interface WeatherResult {
  current: WeatherNow;
  daily: WeatherDay[];
  demo: boolean;
}

import { openweatherApiKey } from "./env";

const BASE = "https://api.openweathermap.org/data/2.5";

export function openweatherConfigured(): boolean {
  return Boolean(openweatherApiKey());
}

interface ForecastEntry {
  dt_txt?: string;
  main?: { temp?: number };
  rain?: { "3h"?: number };
  wind?: { speed?: number };
  weather?: { icon?: string }[];
}

function aggregateDaily(list: ForecastEntry[]): WeatherDay[] {
  const groups = new Map<string, WeatherDay>();
  for (const entry of list || []) {
    const dt = entry.dt_txt as string; // "YYYY-MM-DD HH:00:00"
    if (!dt) continue;
    const date = dt.slice(0, 10);
    const t = entry.main?.temp ?? 0;
    const day = groups.get(date) || {
      date,
      tmax: -Infinity,
      tmin: Infinity,
      precip: 0,
      wind: 0,
      icon: entry.weather?.[0]?.icon,
    };
    day.tmax = Math.max(day.tmax, t);
    day.tmin = Math.min(day.tmin, t);
    day.precip += Number(entry.rain?.["3h"] ?? 0);
    day.wind = Math.max(day.wind, Math.round(entry.wind?.speed ?? 0));
    if (day.tmax === t || day.tmin === t) {
      day.icon = entry.weather?.[0]?.icon || day.icon;
    }
    groups.set(date, day);
  }
  return [...groups.values()]
    .slice(0, 5)
    .map((d) => ({
      date: d.date,
      tmax: Math.round(d.tmax),
      tmin: Math.round(d.tmin),
      precip: Math.round(d.precip * 10) / 10,
      wind: Math.round(d.wind),
      icon: d.icon,
    }));
}

/** Primary weather source: OpenWeatherMap (needs OPENWEATHER_API_KEY). */
export async function openweatherForecast(
  lat: number,
  lon: number
): Promise<WeatherResult> {
  const key = openweatherApiKey();
  if (!key) throw new Error("OPENWEATHER_API_KEY is not set");

  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    appid: key,
    units: "metric",
  });

  const [currentRes, forecastRes] = await Promise.all([
    fetch(`${BASE}/weather?${params}`, {
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    }),
    fetch(`${BASE}/forecast?${params}&cnt=40`, {
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    }),
  ]);

  if (!currentRes.ok) throw new Error(`openweather current ${currentRes.status}`);
  if (!forecastRes.ok) throw new Error(`openweather forecast ${forecastRes.status}`);

  const currentData = await currentRes.json();
  const forecastData = await forecastRes.json();

  const daily = aggregateDaily(forecastData.list);
  const weather = currentData.weather?.[0];
  const current: WeatherNow = {
    temp: Math.round(currentData.main?.temp ?? daily[0]?.tmax ?? 28),
    humidity: Math.round(currentData.main?.humidity ?? 70),
    precip: Number(currentData.rain?.["1h"] ?? 0),
    wind: Math.round(currentData.wind?.speed ?? 10),
    icon: weather?.icon,
    desc: weather?.description
      ? weather.description.charAt(0).toUpperCase() + weather.description.slice(1)
      : undefined,
  };

  if (daily.length === 0) throw new Error("openweather returned no daily data");
  return { current, daily, demo: false };
}
