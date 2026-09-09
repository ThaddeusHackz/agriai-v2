# 🌱 AgriAI 2.0

**Intelligent Farming Assistant for Ghana** — a next-generation, full-stack AI platform built by **Thaddeus Nii Teiko Tagoe** (University of Ghana).

🇬🇭 Multilingual AI chat (English · Twi · Ga · Ewe · Hausa · French) · 🎙️ Voice in & out · 🌐 Live web search with citations · 🔬 Crop disease detection · 🎨 AI Crop Visualizer · 💰 Market prices · 🌦️ OpenWeather forecasts · 🗄️ PostgreSQL database · ⚙️ Next-gen admin panel

---

## ✨ What's inside

### Public website (`/`)
| Feature | How it works |
|---|---|
| **Perplexity-style AI chat** | Streaming answers (SSE) with markdown, typing indicator, stop button, source citations |
| **Google Gemini AI** | Primary model for chat, crop-disease vision and voice transcription (`GEMINI_API_KEY`) |
| **Cloudflare Workers AI** | Automatic fallback LLM (Llama 3.3 70B) + **AI Studio** — generate crop/farm images with Flux |
| **Web Search mode** | Tavily-powered live search, answers grounded in results with `[1][2]` citations |
| **Voice input** | Browser speech recognition with Gemini transcription fallback |
| **Voice output** | ElevenLabs TTS — listen to any answer |
| **Expert Mode** | Agronomist-grade advice: NPK ratios, rates, IPM strategies |
| **Agent Mode** | Autonomous research agent with structured answers |
| **6 languages** | English, Twi, Ga, Ewe, Hausa, French |
| **Crop Disease Detection** | Upload a photo → Gemini vision model returns disease, confidence %, treatment plan |
| **AI Studio (Crop Visualizer)** | Type a farm scene → Cloudflare Flux renders a photoreal image you can download |
| **Market Prices** | Curated Ghana market board + live web intel refresh |
| **Weather** | 5-day forecast via **OpenWeatherMap** (Open-Meteo fallback) for Accra, Kumasi, Tamale, Takoradi, Cape Coast + farming advice |
| **Newsletter & contact** | Subscriber list & messages land in the admin panel |
| **2026 next-gen UI** | Dark aurora theme, glassmorphism, animated gradient text, 3D spinning logo, count-up stats, scroll reveals |
| **SEO** | Metadata, Open Graph, robots.txt, sitemap.xml |

### Admin panel (`/admin`)
- 🔐 **Secure login** — bcrypt-hashed passwords, cookie sessions (7 days), rate-limited (5 tries / 15 min)
- 📊 **Dashboard** — chats, messages, visitors, top questions, feedback donut, SVG visit chart, recent conversations
- ✏️ **Content** — hero title/subtitle/badge, announcement bar, stats, quick prompts, footer
- 🎨 **Appearance** — brand colors with live preview, show/hide any page section
- 🧠 **AI Settings** — model, temperature, max tokens, all system prompts, default mode
- 🔑 **API Keys** — paste, test & save provider keys; they persist permanently and take effect instantly
- 💰 **Market Prices** — full CRUD on the price board
- 📚 **Knowledge Base** — offline Q&A entries (also used as AI fallback)
- 💬 **Messages** — browse/delete all conversations
- 👥 **Admin Users** — create editors/admins, reset passwords, roles
- 👍 **Feedback** — thumbs up/down analytics
- 📧 **Subscribers** — list + CSV export
- 🗄️ **Database** — live PostgreSQL status + one-click sync
- ⚠️ **Settings** — info + danger zone (database reset)

### Backend (`/api/*`)
`chat` · `search` · `transcribe` · `tts` · `vision` · `generate` (AI Studio) · `weather` · `prices` · `feedback` · `history` · `subscribe` · `contact` · `track` · `config` · `admin/login|logout|me|settings|analytics|users|messages|prices|knowledge|subscribers|feedback|reset|apikeys`

> 🔑 **API keys** can be pasted straight into the admin panel (Admin → *API Keys*). They're stored server-side in the document store **and mirrored to PostgreSQL**, so they work permanently across restarts and deploys — no `.env` editing required. A built-in forensic scan live-tests each key against its provider before/after you save.

### Database — PostgreSQL + JSON store
- **With `DATABASE_URL`** (set automatically by the Render blueprint's managed Postgres): every write is mirrored to a `agriai_state` table and **hydrated back on restart** — data survives deploys on Render's free tier. Reset or sync anytime from the admin panel.
- **Without it**: zero-config JSON document store (`./data/db.json`, gitignored, atomic writes) — perfect for local development.

### Resilience
Every AI/API call degrades gracefully down a provider chain:
`Gemini → Cloudflare Workers AI → built-in Ghana farming knowledge base` (chat) and
`OpenWeather → Open-Meteo → curated data` (weather). If a key is missing or a provider is unreachable, AgriAI still answers. The site **never breaks**.

---

## 🚀 Quick start (local)

```bash
# 1. Install
npm install

# 2. Environment — copy the template and fill in your keys
cp .env.example .env.local

# 3. Run
npm run dev          # → http://localhost:3000
```

**`.env.local`:**

```env
GEMINI_API_KEY=your_gemini_key                    # chat + vision + voice
CLOUDFLARE_API_KEY=your_cloudflare_token          # fallback LLM + AI Studio
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
OPENWEATHER_API_KEY=your_openweather_key          # weather forecasts
TAVILY_API_KEY=your_tavily_key                    # live web search
ELEVENLABS_API_KEY=your_elevenlabs_key            # voice output

ADMIN_EMAIL=admin@agriai.gh                       # seeded admin login
ADMIN_PASSWORD=your_strong_password               # seeded admin password
ADMIN_NAME=AgriAI Admin
NEXT_PUBLIC_SITE_URL=http://localhost:3000
# DATABASE_URL=postgresql://...                  # optional: PostgreSQL mirror
```

> ⚠️ If a key is missing, that feature falls back gracefully — the rest of the site still works.
>
> 💡 Prefer no `.env` fuss? Open the **admin panel → API Keys** and paste your keys there — they're saved permanently and used immediately (and still fall back to the `.env.local` values when both are set).

## 🔐 Default admin login

| | |
|---|---|
| **URL** | `https://your-site.onrender.com/admin` |
| **Email** | `admin@agriai.gh` |
| **Password** | seeded from `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars |

**Change the password immediately after first login** → Admin panel → *Admin Users* → *Password*.

---

## ☁️ Deploy on Render.com

Full step-by-step guide: **[DEPLOYMENT.md](./DEPLOYMENT.md)**

Quick version:
1. Push this repository to GitHub.
2. Go to [render.com](https://render.com) → **New → Blueprint** → paste the repo URL.
3. Render reads `render.yaml`, creates the web service **and a managed PostgreSQL database**; then open **Environment** and paste your API keys into the `sync: false` variables (Gemini, Cloudflare, OpenWeather, Tavily, ElevenLabs, admin credentials).
4. Deploy → open `https://agriai.onrender.com` 🎉

---

## 🧪 Testing

```bash
npm run typecheck   # TypeScript strict
npm run lint        # ESLint
npm run build       # production build
```

## 🛠 Tech stack

Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind CSS v4 · Google Gemini 2.5 Flash (chat + vision + transcription) · Cloudflare Workers AI (Llama 3.3 70B + Flux image gen) · OpenWeatherMap · Open-Meteo · Tavily · ElevenLabs · PostgreSQL (`pg`) · bcryptjs · Framer Motion · React Markdown

## 👤 Founder

**Thaddeus Nii Teiko Tagoe** — Computer Science student at the University of Ghana, and the sole designer, developer and maintainer of AgriAI. 🇬🇭
