# AgriAI 2.0 — Agent Guide

## What this is
AgriAI 2.0: an intelligent, multilingual farming assistant for Ghana
(Next.js 16 app router, TypeScript, Tailwind v4). Full-stack with an
admin panel, JSON document database (no external DB needed), AI via Groq,
voice via OpenAI Whisper + ElevenLabs, web search via Tavily.

## Architecture
- `app/page.tsx` — public site (hero, chat, disease detection, prices, weather…)
- `app/admin/` — admin panel (login + dashboard tabs)
- `app/api/` — backend routes (chat, search, transcribe, tts, vision, weather,
  prices, feedback, history, subscribe, contact, track, admin/*)
- `lib/db.ts` — JSON data engine, seeds `./data/db.json` on first run
- `lib/auth.ts` — bcrypt passwords, cookie sessions, login rate limiting
- `lib/ai.ts` — Gemini wrapper with offline fallback (local knowledge base)
- `design/` — original UI mockups (white mode, Perplexity-style)

## Rules
- NEVER commit `.env.local` or `data/` — both gitignored.
- API keys are read from env only; there are NO hardcoded key fallbacks.
- Admin seeding: `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars (defaults in code).
- Next.js 16: Turbopack default, async `cookies()`, no `middleware.ts`
  (use `proxy.ts` if ever needed). No Google Fonts — system stack only.
- Keep every route gracefully degrading: if an AI/API call fails the app
  must still respond (local fallbacks in lib/ai.ts, lib/search.ts).
