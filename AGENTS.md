# AgriAI 2.0 — Agent Guide

## What this is
AgriAI 2.0: an intelligent, multilingual farming assistant for Ghana
(Next.js 16 app router, TypeScript, Tailwind v4). Full-stack with an
admin panel, PostgreSQL mirror + JSON document store, AI via Google Gemini
with Cloudflare Workers AI fallback, weather via OpenWeatherMap,
voice via Gemini transcription + ElevenLabs, web search via Tavily.

## Architecture
- `app/page.tsx` — public site (hero, chat, disease detection, prices, weather, AI studio…)
- `app/admin/` — admin panel (login + dashboard tabs)
- `app/api/` — backend routes (chat, search, transcribe, tts, vision, generate,
  weather, prices, feedback, history, subscribe, contact, track, admin/*)
- `lib/db.ts` — data engine: seeds `./data/db.json`, mirrors to PostgreSQL
- `lib/pg-store.ts` — Postgres mirror (DATABASE_URL) with debounced upserts
- `instrumentation.ts` — boot-time hydration of the document from Postgres
- `lib/auth.ts` — bcrypt passwords, cookie sessions, login rate limiting
- `lib/ai.ts` — Gemini wrapper (chat + vision) with local knowledge-base fallback
- `lib/cloudflare.ts` — Workers AI: Llama 3.3 chat fallback + Flux image gen
- `lib/openweather.ts` — OpenWeatherMap forecast (Open-Meteo fallback in route)
- `components/Logo3D.tsx` — animated 3D logo used across site & admin

## Rules
- NEVER commit `.env.local` or `data/` — both gitignored.
- API keys are read from env only; there are NO hardcoded key fallbacks.
- Admin seeding: `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars (defaults in code).
- Next.js 16: Turbopack default, async `cookies()`, no `middleware.ts`
  (use `proxy.ts` if ever needed). Google Fonts are loaded via <link> tags.
- Provider chain (never break): Gemini → Cloudflare → local KB for chat;
  OpenWeather → Open-Meteo → seed for weather.
- Keep every route gracefully degrading: if an AI/API call fails the app
  must still respond (local fallbacks in lib/ai.ts, lib/search.ts).
- Founder is Thaddeus Nii Teiko Tagoe only — no other team members anywhere.
