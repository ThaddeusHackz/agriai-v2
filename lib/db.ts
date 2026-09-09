// ─── AgriAI Data Engine ──────────────────────────────────────────────────────
// A zero-dependency JSON document store with atomic writes, mirrored to
// PostgreSQL when DATABASE_URL is set (Render blueprint managed database).
// Data lives in ./data/db.json (gitignored), is seeded automatically, and is
// hydrated back from Postgres on boot when the file is missing — so nothing is
// ever lost across restarts or deploys.

import fs from "fs";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import type {
  Database,
  AppSettings,
  PriceEntry,
  KnowledgeEntry,
} from "./types";
import { todayISO } from "./utils";
import { schedulePostgresSave } from "./pg-store";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const SEED_VERSION = 4;

let cache: Database | null = null;
let adminEnforced = false; // re-checked whenever cache is (re)loaded/replaced

// ─── Forced admin credentials (hard-locked, by design) ──────────────────────
// The canonical AgriAI admin identity is pinned to these exact credentials.
// This is intentional: no matter what is in `data/db.json`, what was mirrored
// to PostgreSQL, what ADMIN_EMAIL/ADMIN_PASSWORD env vars say, or whether the
// stored password hash was changed/corrupted/tampered with, the account below
// is force-restored on every boot so this login always works.
export const FORCED_ADMIN_EMAIL = "admin@agriai.gh";
export const FORCED_ADMIN_PASSWORD = "AgriAI@2026Admin";

export function uid(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}${crypto.randomBytes(4).toString("hex")}`;
}

// ─── Seed data ───────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: AppSettings = {
  siteName: "AgriAI",
  tagline: "Intelligent Farming Assistant for Ghana",
  heroTitle: "The Future of Farming in Ghana",
  heroSubtitle: "AI that speaks your language.",
  heroBadge: "🇬🇭 Ghana's #1 AI Farming Assistant",
  announcement: "🌱 AgriAI 2.0 is live — now with crop disease detection & live market prices!",
  announcementEnabled: true,
  primaryColor: "#00e676",
  deepColor: "#062e19",
  accentColor: "#f9bc13",
  showSections: {
    features: true,
    prices: true,
    weather: true,
    disease: true,
    how: true,
    testimonials: true,
    team: true,
    faq: true,
    newsletter: true,
    studio: true,
  },
  chat: {
    // Google Gemini is the primary model; Cloudflare Workers AI is the
    // automatic fallback; a local knowledge base is the last resort.
    model: "gemini-2.5-flash", // chat (fast, multimodal)
    visionModel: "gemini-2.5-flash", // crop disease detection (multimodal)
    temperature: 0.7,
    maxTokens: 1024,
    webSearchDefault: false,
    defaultMode: "standard",
    placeholder: "Ask about crops, weather, market prices…",
    quickPrompts: [
      "Best time to plant maize in Ghana",
      "How to treat cassava mosaic disease",
      "Current cocoa price in Kumasi",
      "Fertilizer advice for tomatoes",
    ],
    systemPrompt:
      "You are AgriAI, Ghana's intelligent farming assistant, built by Thaddeus Tagoe. You give practical, accurate, and concise farming advice for Ghanaian conditions: crops (maize, cocoa, cassava, yam, plantain, rice, tomatoes, peppers, groundnuts), soil, fertilizer, pests & diseases, irrigation, weather, and market prices. When web search results are provided, base your answer on them and cite sources with [1], [2] markers. Use simple language a rural farmer can understand. Be warm and encouraging.",
    expertPrompt:
      "You are AgriAI in EXPERT MODE — an agronomist with a PhD in tropical agriculture specializing in Ghana and West Africa. Give detailed, science-based recommendations: specific NPK ratios, application rates, planting densities, disease life-cycles, IPM strategies, and economic analysis. Cite sources with [1], [2] when web search results are provided. Include realistic numbers (GHS, kg/ha, weeks). Be precise and professional.",
    agentPrompt:
      "You are AgriAI in AGENT MODE — an autonomous research agent. First, analyze the farmer's question and break it into the key facts needed. Use the web search results provided to gather current data (prices, weather, disease outbreaks). Then synthesize a complete answer with a short summary, numbered key points, and citations [1], [2]. Structure your answer with clear sections.",
  },
  stats: [
    { label: "Farmers Reached", value: "12,400+" },
    { label: "Disease Detection Accuracy", value: "92%" },
    { label: "Middleman Loss Reduction", value: "35%" },
    { label: "Languages Supported", value: "6" },
  ],
  contactEmail: "admin@agriai.gh",
  footerText: "Intelligent Farming for Ghana — built by Thaddeus Tagoe • 2026",
  updatedAt: Date.now(),
};

const SEED_PRICES: Omit<PriceEntry, "id">[] = [
  { crop: "Maize (white)", market: "Kumasi", price: 320, unit: "per 100kg bag", date: todayISO(), trend: "up", note: "Demand high after dry spell" },
  { crop: "Cocoa", market: "Accra", price: 3850, unit: "per 64kg bag", date: todayISO(), trend: "up", note: "Producer price review season" },
  { crop: "Cassava", market: "Techiman", price: 450, unit: "per 100kg bag", date: todayISO(), trend: "stable" },
  { crop: "Yam (pona)", market: "Tamale", price: 180, unit: "per tuber", date: todayISO(), trend: "up", note: "Off-season supply tightening" },
  { crop: "Plantain", market: "Koforidua", price: 250, unit: "per bunch", date: todayISO(), trend: "down", note: "Good harvests in Eastern Region" },
  { crop: "Tomatoes", market: "Accra (Agbogbloshie)", price: 380, unit: "per crate", date: todayISO(), trend: "down" },
  { crop: "Rice (local paddy)", market: "Tamale", price: 290, unit: "per 50kg bag", date: todayISO(), trend: "stable", note: "Irrigation harvest ongoing" },
  { crop: "Groundnut", market: "Bolgatanga", price: 520, unit: "per 100kg bag", date: todayISO(), trend: "up", note: "Export demand rising" },
  { crop: "Palm oil", market: "Takoradi", price: 610, unit: "per 25L gallon", date: todayISO(), trend: "stable" },
  { crop: "Ginger", market: "Accra", price: 750, unit: "per 50kg bag", date: todayISO(), trend: "up", note: "Scarcity after rains" },
  { crop: "Pepper (chilli)", market: "Kumasi", price: 420, unit: "per 50kg bag", date: todayISO(), trend: "down", note: "Peak season supply" },
  { crop: "Soybean", market: "Wa", price: 340, unit: "per 100kg bag", date: todayISO(), trend: "stable" },
];

const SEED_KNOWLEDGE: Omit<KnowledgeEntry, "id" | "updatedAt">[] = [
  {
    question: "Best time to plant maize in Ghana",
    category: "Crops",
    keywords: ["maize", "corn", "plant", "planting", "season"],
    answer:
      "**The two main maize seasons in Ghana:**\n\n1. **Major season** — plant from **mid-March to April** when the rains begin (southern Ghana), or **April–May** in the north.\n2. **Minor season** — plant **September** in forest and transition zones.\n\n**Tips for success:**\n- Use improved varieties like *Omankwa*, *Aburohemaa* or *Mamaba* for higher yields.\n- Plant at a spacing of **75cm × 40cm**, 1 seed per stand.\n- Apply fertilizer **NPK 15-15-15** at planting and **NPK 23-10-5 + Sulphate of Ammonia** 3–4 weeks later.\n- Expect **2–2.5 tonnes/ha** with good management, up to **5 t/ha** with hybrids and irrigation.",
  },
  {
    question: "How to treat cassava mosaic disease",
    category: "Disease",
    keywords: ["cassava", "mosaic", "disease", "virus", "yellow"],
    answer:
      "**Cassava Mosaic Disease (CMD)** is caused by a virus spread by whiteflies. **Symptoms:** yellow-green mosaic patches on leaves, stunted growth, leaf distortion.\n\n**Treatment & control:**\n1. **Uproot and burn** severely infected plants immediately.\n2. Plant **CMD-resistant varieties**: *Bankyehemaa*, *Ampong*, *Esam Bankye*, *Sika Bankye*.\n3. Use **clean, certified cuttings** — never save cuttings from infected fields.\n4. Control whiteflies with neem extract or recommended insecticides.\n5. Practice crop rotation — don't plant cassava on the same land consecutively.\n\nEarly action saves the whole field. Contact your district MoFA office for certified cuttings.",
  },
  {
    question: "Current cocoa price in Ghana",
    category: "Markets",
    keywords: ["cocoa", "price", "market", "cocobod"],
    answer:
      "Cocoa prices are set by **COCOBOD** in Ghana. The producer price is reviewed each season.\n\n- Prices vary by **grade** (Light Crop vs Main Crop) and **buying company** (PBC, Olam, Kuapa Kokoo).\n- Always compare quotes from **2–3 licensed buying companies** before selling.\n- Avoid middlemen who deduct unjustified charges — know the official producer price per 64kg bag.\n- For the latest official price, ask me to search the web (enable **Web Search**), or check at your district COCOBOD office.",
  },
  {
    question: "Fertilizer advice for tomatoes",
    category: "Fertilizer",
    keywords: ["tomato", "fertilizer", "npk", "manure"],
    answer:
      "**Tomato fertilizer program (per hectare):**\n\n1. **Before planting:** apply 10–15 tonnes of well-rotted manure or compost.\n2. **At transplanting:** apply **NPK 15-15-15** at 200–300 kg/ha.\n3. **3 weeks after transplanting:** top-dress with **Sulphate of Ammonia** (100–150 kg/ha).\n4. **At flowering:** apply **NPK 23-10-5** or potassium-rich fertilizer (KCl) to boost fruit set.\n\n**Watch for:** calcium deficiency (blossom-end rot) — add lime/gypsum; and **fusarium wilt** — rotate with maize/legumes. Water consistently to avoid cracking.",
  },
  {
    question: "What is the best soil for yam farming",
    category: "Soil",
    keywords: ["yam", "soil", "sandy", "loam"],
    answer:
      "Yam grows best in **deep, well-drained sandy-loam soils** (pH 5.5–6.5).\n\n- Avoid waterlogged clay soils — yam tubers rot easily.\n- Prepare **mounds or ridges** 1m apart before the rains.\n- Plant **seed yams** of 200–500g for best sprouting.\n- Good yam areas in Ghana: Techiman, Kintampo, Atebubu (Bono East), and parts of Northern Region.",
  },
  {
    question: "How to control fall armyworm",
    category: "Pests",
    keywords: ["fall armyworm", "armyworm", "pest", "caterpillar"],
    answer:
      "**Fall Armyworm** attacks maize and other cereals. **Control strategy:**\n\n1. **Scout fields weekly** — look for 'window-pane' leaf damage and sawdust-like frass in whorls.\n2. **Early intervention:** hand-pick and destroy egg masses and young larvae.\n3. **Botanical control:** neem seed extract or ash in the whorl at first signs.\n4. **Chemical control (when heavy):** Emamectin benzoate, Chlorantraniliprole, or recommended pyrethroids — apply in the **evening**.\n5. **Cultural:** early planting, weed control, and intercropping reduce attacks.\n\nReport severe outbreaks to your **MoFA Plant Protection officer** for free guidance.",
  },
  {
    question: "How do I get a loan for my farm",
    category: "Finance",
    keywords: ["loan", "credit", "finance", "money", "capital"],
    answer:
      "**Farm finance options in Ghana:**\n\n1. **Agricultural Development Bank (ADB)** — farmer loans with group lending schemes.\n2. **Rural & Community Banks** (e.g., Atwima Kwanwoma, Kakum Rural Bank) — smallholder loans.\n3. **MASLOC** — microfinance for small-scale farmers.\n4. **MoFA 'Planting for Food and Jobs'** — subsidized inputs (fertilizer, seeds).\n5. **Fintech options** — Farmerline, Tractor, and mobile-money based credit.\n\n**Tip:** join a farmer cooperative — group lending improves approval chances and interest rates.",
  },
  {
    question: "How to store maize to prevent weevils",
    category: "Storage",
    keywords: ["storage", "store", "weevil", "maize", "grain"],
    answer:
      "**Storing maize against weevils:**\n\n1. **Dry thoroughly** — grain below **14% moisture** (test by biting: kernels should crack, not squash).\n2. **Clean the store** — sweep and remove old grain debris.\n3. **Treat** with approved grain protectants (e.g., Actellic Super dust or PICS hermetic bags).\n4. Use **hermetic bags (PICS)** or metal silos — they starve insects of oxygen.\n5. Inspect monthly; re-dry if moisture rises.\n\nHermetic storage keeps maize **weevil-free for up to 2 years** without chemicals.",
  },
];

// ─── Load / persist ──────────────────────────────────────────────────────────

function defaultDB(): Database {
  // Admin identity is force-pinned — env vars can no longer override it.
  const email = FORCED_ADMIN_EMAIL;
  const password = FORCED_ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "AgriAI Admin";

  return {
    version: SEED_VERSION,
    settings: { ...DEFAULT_SETTINGS },
    users: [
      {
        id: uid("usr"),
        name,
        email,
        passwordHash: bcrypt.hashSync(password, 10),
        role: "admin",
        createdAt: Date.now(),
      },
    ],
    sessions: [],
    chats: [],
    feedback: [],
    prices: SEED_PRICES.map((p) => ({ ...p, id: uid("prc") })),
    knowledge: SEED_KNOWLEDGE.map((k) => ({ ...k, id: uid("kno"), updatedAt: Date.now() })),
    subscribers: [],
    contacts: [],
    analytics: {
      visits: [],
      questions: [],
      totalChats: 0,
      totalMessages: 0,
      totalFeedbackUp: 0,
      totalFeedbackDown: 0,
      totalSubscribers: 0,
      firstSeen: Date.now(),
    },
    secrets: {
      gemini: "",
      cloudflareApi: "",
      cloudflareAccountId: "",
      openweather: "",
      tavily: "",
      elevenlabs: "",
      unsplash: "",
      updatedAt: 0,
    },
    meta: { seededAt: Date.now() },
  };
}

/**
 * Force-heals the admin account on every load/mutation. Guarantees that a
 * user with FORCED_ADMIN_EMAIL exists, has the "admin" role, and has a
 * password hash matching FORCED_ADMIN_PASSWORD — no matter what is currently
 * stored (tampered hash, wrong role, missing account, stale seed, restored
 * backup, etc.). This makes the credential change unconditional and
 * self-repairing across restarts, Postgres hydration, and manual edits.
 */
function enforceForcedAdmin(db: Database): boolean {
  let changed = false;
  const targetEmail = FORCED_ADMIN_EMAIL.toLowerCase();
  let admin = db.users.find((u) => u.email.toLowerCase() === targetEmail);

  if (!admin) {
    admin = {
      id: uid("usr"),
      name: process.env.ADMIN_NAME || "AgriAI Admin",
      email: targetEmail,
      passwordHash: bcrypt.hashSync(FORCED_ADMIN_PASSWORD, 10),
      role: "admin",
      createdAt: Date.now(),
    };
    db.users.unshift(admin);
    changed = true;
  } else {
    if (admin.email !== targetEmail) {
      admin.email = targetEmail;
      changed = true;
    }
    if (admin.role !== "admin") {
      admin.role = "admin";
      changed = true;
    }
    let hashOk = false;
    try {
      hashOk = bcrypt.compareSync(FORCED_ADMIN_PASSWORD, admin.passwordHash);
    } catch {
      hashOk = false;
    }
    if (!hashOk) {
      admin.passwordHash = bcrypt.hashSync(FORCED_ADMIN_PASSWORD, 10);
      changed = true;
    }
  }

  // Invalidate any lingering sessions tied to the old/rotated credentials so
  // the forced password takes effect immediately everywhere.
  if (changed) {
    db.sessions = db.sessions.filter((s) => s.email.toLowerCase() !== targetEmail);
  }

  return changed;
}

function load(): Database {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = JSON.parse(fs.readFileSync(DB_FILE, "utf-8")) as Database;
      // Merge missing keys with defaults so schema upgrades don't break
      const base = defaultDB();
      const merged: Database = {
        ...base,
        ...raw,
        settings: { ...base.settings, ...(raw.settings || {}), chat: { ...base.settings.chat, ...(raw.settings?.chat || {}) }, showSections: { ...base.settings.showSections, ...(raw.settings?.showSections || {}) } },
        analytics: { ...base.analytics, ...(raw.analytics || {}) },
        secrets: { ...base.secrets, ...(raw.secrets || {}) },
      };
      if (enforceForcedAdmin(merged)) persist(merged);
      return merged;
    }
  } catch (err) {
    console.error("[db] Failed to read database, reseeding:", err);
  }
  const db = defaultDB();
  enforceForcedAdmin(db);
  persist(db);
  return db;
}

function persist(db: Database): void {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmp = DB_FILE + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(db, null, 2), "utf-8");
    fs.renameSync(tmp, DB_FILE);
  } catch (err) {
    console.error("[db] Failed to persist:", err);
  }
  // Mirror to PostgreSQL (debounced) when DATABASE_URL is configured.
  schedulePostgresSave(db);
}

export function getDB(): Database {
  if (!cache) {
    cache = load();
    adminEnforced = true; // load() already ran the forced-admin check
  } else if (!adminEnforced) {
    if (enforceForcedAdmin(cache)) persist(cache);
    adminEnforced = true;
  }
  return cache;
}

/**
 * Boot-time hydration (called from instrumentation.ts): when Postgres is
 * configured and the local file does not exist yet, restore the document
 * from the database so data survives restarts/deploys.
 */
export async function hydrateFromPostgres(
  loader: () => Promise<Database | null>
): Promise<void> {
  try {
    if (fs.existsSync(DB_FILE)) return;
    const doc = await loader();
    if (!doc) return;
    cache = doc;
    enforceForcedAdmin(cache); // credentials are pinned even in restored backups
    adminEnforced = true;
    persist(cache); // recreate the local file
    console.log("[db] hydrated document from PostgreSQL");
  } catch (err) {
    console.warn("[db] hydration failed:", (err as Error).message);
  }
}

export function saveDB(): void {
  if (cache) persist(cache);
}

/** Run a mutation against the DB and persist atomically. */
export function mutate<T>(fn: (db: Database) => T): T {
  const db = getDB();
  const result = fn(db);
  persist(db);
  return result;
}

/** Reset the entire database (admin danger-zone). Re-seeds on next access. */
export function resetDB(): void {
  try {
    fs.rmSync(DB_FILE, { force: true });
    fs.rmSync(DB_FILE + ".tmp", { force: true });
  } catch {
    /* ignore */
  }
  cache = null;
  adminEnforced = false;
}

// ─── Analytics helpers ───────────────────────────────────────────────────────

export function trackVisit(visitorId: string | null): void {
  const db = getDB();
  const today = todayISO();
  const a = db.analytics;
  let day = a.visits.find((v) => v.date === today);
  if (!day) {
    day = { date: today, count: 0, unique: 0 };
    a.visits.push(day);
  }
  day.count += 1;
  // keep only last 30 days
  a.visits = a.visits.slice(-30);
  if (visitorId) {
    const key = `v:${today}:${visitorId}`;
    if (!(a as unknown as Record<string, unknown>)[key]) {
      (a as unknown as Record<string, unknown>)[key] = 1;
      day.unique += 1;
    }
  }
  persist(db);
}

export function trackQuestion(q: string): void {
  const db = getDB();
  const a = db.analytics;
  const clean = q.trim().slice(0, 120);
  const found = a.questions.find((x) => x.q.toLowerCase() === clean.toLowerCase());
  if (found) found.count += 1;
  else a.questions.push({ q: clean, count: 1 });
  a.questions.sort((x, y) => y.count - x.count);
  a.questions = a.questions.slice(0, 50);
  persist(db);
}

export function trackMessage(): void {
  const db = getDB();
  db.analytics.totalMessages += 1;
  persist(db);
}

export function trackChat(): void {
  const db = getDB();
  db.analytics.totalChats += 1;
  persist(db);
}
