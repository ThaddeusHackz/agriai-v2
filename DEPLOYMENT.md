# 🚀 Deploy AgriAI 2.0 on Render.com — Step-by-Step Guide

This guide walks you through deploying the complete AgriAI platform (frontend + backend + admin panel + database) on Render's **free tier** in about 10 minutes.

---

## Before you start — what you need

- A **GitHub account** with this repository pushed to it
- A **Render account** (free at [render.com](https://render.com) — sign in with GitHub)
- Your 4 API keys (already in your `.env.local`):
  - `GEMINI_API_KEY`
  - `OPENAI_API_KEY`
  - `TAVILY_API_KEY`
  - `ELEVENLABS_API_KEY`
- Your chosen admin email + password (defaults: `admin@agriai.gh` / `AgriAI@2026Admin` — **change after first login**)

---

## Step 1 — Push the repository to GitHub

```bash
# in the project folder
git add -A
git commit -m "AgriAI 2.0 — full rebuild"
git push origin arena/019fe6f7-agriai-v2
```

> ⚠️ **Never commit `.env.local`** — it's gitignored. Render gets the keys from its Environment dashboard instead (Step 4).

---

## Step 2 — Create the Render service (Blueprint)

1. Log in to [dashboard.render.com](https://dashboard.render.com)
2. Click **New ➜ Blueprint** (top-right)
3. Click **Connect repository** and pick your repo (`ThaddeusHackz/agriai-v2`)
4. Render reads the included **`render.yaml`** and shows one service: `agriai`
5. Click **Apply** → Render starts the first build automatically

That's it — the blueprint already configures:
- Node runtime, free plan, Oregon region
- Build: `npm ci --include=dev && npm run build`
- Start: `npm start`
- Health check on `/`

**Build time on free tier:** ~3–6 minutes. You'll see `✓ Ready` in the logs when done.

---

## Step 3 — Add your environment variables (THE critical step)

1. In the Render dashboard, open your **`agriai`** service
2. Go to the **Environment** tab
3. Click **Add Environment Variable** for each of these (Render asks you to fill in all `sync: false` variables from the blueprint):

| Key | Value |
|---|---|
| `NODE_ENV` | `production` (set by blueprint) |
| `NEXT_PUBLIC_SITE_URL` | `https://agriai.onrender.com` (or your custom domain later) |
| `GEMINI_API_KEY` | *your Gemini key* |
| `OPENAI_API_KEY` | *your OpenAI key* |
| `TAVILY_API_KEY` | *your Tavily key* |
| `ELEVENLABS_API_KEY` | *your ElevenLabs key* |
| `ADMIN_EMAIL` | `admin@agriai.gh` |
| `ADMIN_PASSWORD` | *a strong password — this seeds your admin login* |
| `ADMIN_NAME` | `AgriAI Admin` |

4. Click **Save Changes** — Render redeploys automatically.

---

## Step 4 — First launch & check

1. Wait for the deploy to finish (green checkmark in **Events/Deploys** tab)
2. Open **`https://agriai.onrender.com`**
3. Check the **Logs** tab for errors if anything looks off

**First-run checklist:**

- [ ] Homepage loads (hero + chat + sections)
- [ ] Type a question in the chat → streaming answer with markdown
- [ ] Toggle **Web Search** → answer includes `[1][2]` source chips
- [ ] **Voice input** mic button works (Chrome on desktop/Android)
- [ ] **Listen** button on an answer plays audio (ElevenLabs)
- [ ] Upload a crop photo in **Crop Disease Detection** → diagnosis + confidence
- [ ] Market Prices board + **Live intel** button
- [ ] Weather section shows a 5-day forecast

---

## Step 5 — Admin panel

1. Open **`https://agriai.onrender.com/admin`**
2. Sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` you set
3. **Immediately** change the password: *Admin Users → Password*
4. Explore the tabs: Dashboard, Content, Appearance, AI Settings, Market Prices, Knowledge Base, Messages, Users, Feedback, Subscribers, Settings

Everything you save (hero text, colors, prices, prompts…) updates the live site **instantly** — no redeploy needed. Data persists in `./data/db.json` on the Render disk.

> ⚠️ **Note for the free tier:** Render's free web services **spin down after 15 minutes of inactivity** and take ~30–60s to wake on the next visit. Data on disk persists. To keep it always-on, upgrade to the Starter plan ($7/mo) — no code changes needed.

---

## Step 6 — Custom domain (optional)

1. Service → **Settings → Custom Domain**
2. Add e.g. `agriai.gh` or `agriai.example.com`
3. At your domain registrar add the CNAME record Render shows you
4. Update `NEXT_PUBLIC_SITE_URL` to the new URL and re-deploy

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Chat answers are "offline demo" | `GEMINI_API_KEY` missing/wrong in Render Environment → re-add → deploy |
| Voice input fails | `OPENAI_API_KEY` missing, or browser not Chrome — enable mic permission |
| "Listen" button errors | `ELEVENLABS_API_KEY` missing or account quota used |
| No source chips with Web Search | `TAVILY_API_KEY` missing, or search genuinely returned nothing |
| Admin login says invalid | You're using the pre-seed password before `ADMIN_PASSWORD` was set — set it in Environment and deploy; or reset via `data/db.json` (delete file → redeploy or restart service) |
| Build fails | Check the build logs: usually a missing env var at build time isn't fatal; ensure `npm install` completed |
| Site slow after idle | Free-tier cold start — normal; upgrade plan for always-on |

## Security notes

- The admin panel is rate-limited (5 failed logins → 15 min lockout) and sessions expire after 7 days.
- API keys live **only** in Render's Environment dashboard — never in code or GitHub.
- If you ever committed a key to a public repo, **rotate it** in the provider's dashboard.

---

*AgriAI 2.0 — University of Ghana • 2026*
