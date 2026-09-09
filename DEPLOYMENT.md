# 🚀 Deploy AgriAI 2.0 on Render.com — Step-by-Step Guide

This guide walks you through deploying the complete AgriAI platform (frontend + backend + admin panel + **PostgreSQL database**) on Render's **free tier** in about 10 minutes.

---

## Before you start — what you need

- A **GitHub account** with this repository pushed to it
- A **Render account** (free at [render.com](https://render.com) — sign in with GitHub)
- Your API keys:
  - `GEMINI_API_KEY` — Google AI Studio (ai.google.dev) — powers chat, crop-disease vision & voice transcription
  - `CLOUDFLARE_API_KEY` + `CLOUDFLARE_ACCOUNT_ID` — Cloudflare dashboard → *My Profile → API Tokens* (token with **Workers AI** permission; Account ID is on the right sidebar of the dashboard) — powers the fallback LLM & the AI Studio image generator
  - `OPENWEATHER_API_KEY` — openweathermap.org → *API Keys* (free tier is enough) — powers weather forecasts
  - `TAVILY_API_KEY` *(optional)* — tavily.com — live web search
  - `ELEVENLABS_API_KEY` *(optional)* — elevenlabs.io — voice output
- Your chosen admin email + password (defaults: `admin@agriai.gh` / set your own strong password)

> 💡 Only `GEMINI_API_KEY` is truly required for full live AI. Everything else has a built-in fallback.

---

## Step 1 — Push the repository to GitHub

```bash
git add -A
git commit -m "AgriAI 2.0 — Gemini + Cloudflare + OpenWeather + PostgreSQL"
git push origin arena/019ff1f3-agriai-v2
```

> ⚠️ **Never commit `.env.local`** — it's gitignored. Render gets the keys from its Environment dashboard instead (Step 3).

---

## Step 2 — Create the Render service (Blueprint)

1. Log in to [dashboard.render.com](https://dashboard.render.com)
2. Click **New ➜ Blueprint** (top-right)
3. Click **Connect repository** and pick your repo (`ThaddeusHackz/agriai-v2`)
4. Render reads the included **`render.yaml`** and shows:
   - a **PostgreSQL database** (`agriai-db`) — created automatically 🎉
   - the **web service** (`agriai`) with `DATABASE_URL` already wired to it
5. Click **Apply** → Render provisions the database and starts the first build automatically

That's it — the blueprint already configures:
- Node runtime, free plan, Oregon region
- Build: `npm ci --include=dev && npm run build`
- Start: `npm start`
- Health check on `/`
- `DATABASE_URL` from the managed Postgres

**Build time on free tier:** ~3–6 minutes. You'll see `✓ Ready` in the logs when done.

---

## Step 3 — Add your environment variables (THE critical step)

1. In the Render dashboard, open your **`agriai`** service
2. Go to the **Environment** tab
3. Click **Add Environment Variable** for each of these (Render asks you to fill in all `sync: false` variables from the blueprint):

| Key | Value |
|---|---|
| `GEMINI_API_KEY` | *your Google Gemini key* |
| `CLOUDFLARE_API_KEY` | *your Cloudflare API token* |
| `CLOUDFLARE_ACCOUNT_ID` | *your Cloudflare account ID* |
| `OPENWEATHER_API_KEY` | *your OpenWeather key* |
| `TAVILY_API_KEY` | *your Tavily key (optional)* |
| `ELEVENLABS_API_KEY` | *your ElevenLabs key (optional)* |
| `ADMIN_EMAIL` | `admin@agriai.gh` |
| `ADMIN_PASSWORD` | *a strong password — this seeds your admin login* |
| `ADMIN_NAME` | `AgriAI Admin` |

(`NODE_ENV`, `NEXT_PUBLIC_SITE_URL` and `DATABASE_URL` are already set by the blueprint.)

4. Click **Save Changes** — Render redeploys automatically.

---

## Step 4 — First launch & check

1. Wait for the deploy to finish (green checkmark in **Events/Deploys** tab)
2. Open **`https://agriai.onrender.com`**
3. Check the **Logs** tab for errors if anything looks off

**First-run checklist:**

- [ ] Homepage loads with the dark aurora theme & animated 3D logo
- [ ] Chat answers live (asks Gemini) — you'll see the **⚡ Gemini** badge under answers
- [ ] If Gemini fails, you'll see the **☁️ Cloudflare AI** badge (fallback works)
- [ ] Crop disease detection works (`/disease` section — upload a photo)
- [ ] **AI Studio** generates farm images (Cloudflare Flux)
- [ ] Weather shows **live** data from OpenWeather (the "cached forecast" chip disappears)
- [ ] Market Prices board loads
- [ ] `/admin` login works with your seeded credentials

**Database check:** Admin panel → *Settings* → you should see **PostgreSQL ● connected**. Restart the service and confirm chats/subscribers survive the restart (that's the database doing its job).

---

## FAQ

**Q: The free Postgres expires (Render free databases last 30 days)?**
A: Correct — Render's free Postgres is for testing. When you're ready, upgrade the database plan (or switch to Neon/Supabase) and just change `DATABASE_URL` — no code changes needed.

**Q: Do I need all the keys?**
A: Only `GEMINI_API_KEY` for live AI answers. Without others: weather falls back to Open-Meteo, search runs offline, voice output is disabled, and the AI Studio hides gracefully. The site always works.

**Q: Can I paste my keys in the admin panel instead of Render env vars?**
A: Yes. Sign in to `/admin` → *API Keys* → paste each key, hit **Test** to verify it live, then **Save all keys**. They're stored server-side (and mirrored to PostgreSQL), so they persist across restarts and deploys — and a pasted key always takes priority over the environment variable.

**Q: How do I change admin password?**
A: Admin panel → *Admin Users* → edit → set new password. (Or change `ADMIN_PASSWORD` env var and reset the database in Settings → Danger zone.)

---

*Design: 2026 next-gen dark aurora theme · glassmorphism · animated gradients · 3D logo · PostgreSQL-backed.*
