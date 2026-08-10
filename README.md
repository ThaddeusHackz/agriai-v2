# 🌱 AgriAI 2.0

**Intelligent Farming Assistant for Ghana** — a next-generation, full-stack AI platform built by the University of Ghana team.

🇬🇭 Multilingual AI chat (English · Twi · Ga · Ewe · Hausa · French) · 🎙️ Voice in & out · 🌐 Live web search with citations · 🔬 Crop disease detection · 💰 Market prices · 🌦️ Weather forecasts · ⚙️ Full WordPress-style admin panel

---

## ✨ What's inside

### Public website (`/`)
| Feature | How it works |
|---|---|
| **Perplexity-style AI chat** | Streaming answers (SSE) with markdown, typing indicator, stop button, source citations |
| **Web Search mode** | Tavily-powered live search, answers grounded in results with `[1][2]` citations |
| **Voice input** | Browser speech recognition with OpenAI Whisper fallback |
| **Voice output** | ElevenLabs TTS — listen to any answer |
| **Expert Mode** | Agronomist-grade advice: NPK ratios, rates, IPM strategies |
| **Agent Mode** | Autonomous research agent with structured answers |
| **6 languages** | English, Twi, Ga, Ewe, Hausa, French |
| **Crop Disease Detection** | Upload a photo → Google Gemini vision model returns disease, confidence %, treatment plan |
| **Market Prices** | Curated Ghana market board + live web intel refresh |
| **Weather** | 5-day forecast for Accra, Kumasi, Tamale, Takoradi, Cape Coast + farming advice |
| **Newsletter & contact** | Subscriber list & messages land in the admin panel |
| **SEO** | Metadata, Open Graph, robots.txt, sitemap.xml |

### Admin panel (`/admin`)
- 🔐 **Secure login** — bcrypt-hashed passwords, cookie sessions (7 days), rate-limited (5 tries / 15 min)
- 📊 **Dashboard** — chats, messages, visitors, top questions, recent conversations
- ✏️ **Content** — hero title/subtitle/badge, announcement bar, stats, quick prompts, footer
- 🎨 **Appearance** — brand colors with live preview, show/hide any page section
- 🧠 **AI Settings** — model, temperature, max tokens, all system prompts, default mode
- 💰 **Market Prices** — full CRUD on the price board
- 📚 **Knowledge Base** — offline Q&A entries (also used as AI fallback)
- 💬 **Messages** — browse/delete all conversations
- 👥 **Admin Users** — create editors/admins, reset passwords, roles
- 👍 **Feedback** — thumbs up/down analytics
- 📧 **Subscribers** — list + CSV export
- ⚠️ **Settings** — info + danger zone (database reset)

### Backend (`/api/*`)
`chat` · `search` · `transcribe` · `tts` · `vision` · `weather` · `prices` · `feedback` · `history` · `subscribe` · `contact` · `track` · `config` · `admin/login|logout|me|settings|analytics|users|messages|prices|knowledge|subscribers|feedback|reset`

### Database
Zero-configuration **JSON document store** (`./data/db.json`, gitignored, atomic writes). Works on Render's free tier with no external database, auto-seeds on first boot. Reset anytime from the admin panel.

### Resilience
Every AI/API call degrades gracefully: if a provider is unreachable or a key is missing, AgriAI answers from its built-in Ghana farming knowledge base and marks the reply as an offline demo response. The site **never breaks**.

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
GEMINI_API_KEY=your_gemini_key        # chat + crop disease vision
OPENAI_API_KEY=your_openai_key        # Whisper voice input
TAVILY_API_KEY=your_tavily_key        # live web search
ELEVENLABS_API_KEY=your_elevenlabs_key # voice output

ADMIN_EMAIL=admin@agriai.gh           # seeded admin login
ADMIN_PASSWORD=your_strong_password   # seeded admin password
ADMIN_NAME=AgriAI Admin
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> ⚠️ If a key is missing, that feature falls back to demo mode — the rest of the site still works.

## 🔐 Default admin login

| | |
|---|---|
| **URL** | `https://your-site.onrender.com/admin` |
| **Email** | `admin@agriai.gh` |
| **Password** | `AgriAI@2026Admin` (seeded from `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars) |

**Change the password immediately after first login** → Admin panel → *Admin Users* → *Password*.

---

## ☁️ Deploy on Render.com

Full step-by-step guide with screenshots-level detail: **[DEPLOYMENT.md](./DEPLOYMENT.md)**

Quick version:
1. Push this repository to GitHub.
2. Go to [render.com](https://render.com) → **New → Blueprint** → paste the repo URL.
3. Render reads `render.yaml` and creates the service; then open **Environment** and paste your 5 API keys + admin credentials into the `sync: false` variables.
4. Deploy → open `https://agriai.onrender.com` 🎉

---

## 🧪 Testing

```bash
npm run typecheck   # TypeScript strict
npm run lint        # ESLint
npm run build       # production build (32 routes)
```

## 🛠 Tech stack

Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind CSS v4 · Google Gemini (2.5 Flash + vision) · OpenAI Whisper · ElevenLabs · Tavily · Open-Meteo · bcryptjs · Framer Motion · React Markdown

## 👥 Team — University of Ghana • 2026

- **Nana Ware Henry Opoku** — Chief Programmer & Full Stack Developer
- **Thaddeus Nii Teiko Tagoe** — Overseer & Programmer
- **Comfort Poedza** — Finance & Operations
- **Edmond Nana Yaw Boateng** — Algorithms & AI

---

*Design references (white mode, Perplexity-style UI) live in [`design/`](./design).*
