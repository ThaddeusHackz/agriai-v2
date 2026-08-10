// ─── AgriAI intelligence layer (Google Gemini) ───────────────────────────────
// Wraps Google Gemini (chat + vision). Every call degrades gracefully:
// if the API is unreachable or no key is set, a rich local knowledge-base
// answer is returned so the product always works (full live AI when the key is set).

import { GoogleGenAI } from "@google/genai";
import { getDB } from "./db";
import { getLanguage, languageInstruction } from "./languages";

let aiClient: GoogleGenAI | null = null;

/** Returns a Gemini client, or null when GEMINI_API_KEY is unset (offline demo). */
export function getGemini(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  if (!aiClient) aiClient = new GoogleGenAI({ apiKey: key });
  return aiClient;
}

/** Parse a data-URL (data:image/...;base64,...) or raw base64 into Gemini inline parts. */
function parseImageData(input: string): { mimeType: string; data: string } {
  const m = input.match(/^data:([^;]+);base64,(.*)$/);
  if (m) return { mimeType: m[1], data: m[2] };
  return { mimeType: "image/jpeg", data: input.replace(/\s/g, "") };
}

export interface DiseaseResult {
  detected: string;
  confidence: number;
  description: string;
  treatment: string[];
  demo: boolean;
}

const FALLBACK_DISEASE: DiseaseResult = {
  detected: "Unable to analyze (offline demo mode)",
  confidence: 0,
  description:
    "The crop disease analyzer needs the Gemini API key to run the vision model. Connect the key (see README) and try again — on the live site this returns the detected disease, confidence score, and treatment plan.",
  treatment: [
    "Remove and destroy severely infected plants",
    "Apply recommended fungicide / insecticide per MoFA guidelines",
    "Consult your district MoFA agricultural extension officer",
  ],
  demo: true,
};

const FALLBACK_ANSWERS: { match: RegExp; answer: string }[] = [
  {
    match: /maize|corn|planting season/i,
    answer:
      "**Best time to plant maize in Ghana** 🌽\n\n- **Major season:** mid‑March to **April** (southern Ghana), **April–May** in the north.\n- **Minor season:** **September** in forest & transition zones.\n\n**Quick tips:**\n1. Use improved varieties — *Omankwa*, *Aburohemaa*, *Mamaba*.\n2. Spacing: **75 cm × 40 cm**, one seed per stand.\n3. Apply **NPK 15‑15‑15** at planting, then **NPK 23‑10‑5** 3–4 weeks later.\n4. Expect 2–2.5 t/ha with good management.\n\n> I'm currently in **offline demo mode** — enable Web Search or connect my API keys for live, sourced answers.",
  },
  {
    match: /cassava|mosaic/i,
    answer:
      "**Cassava Mosaic Disease (CMD)** 🍃\n\nIt is a virus spread by whiteflies. **Symptoms:** yellow‑green mosaic patches, stunted growth, leaf distortion.\n\n**Control:**\n1. Uproot & burn severely infected plants.\n2. Plant resistant varieties (*Bankyehemaa*, *Ampong*, *Esam Bankye*).\n3. Use only **certified clean cuttings**.\n4. Control whiteflies with neem extract.\n5. Rotate crops — don't replant cassava on the same land.\n\n> I'm currently in **offline demo mode** — connect my API keys for live diagnosis.",
  },
  {
    match: /cocoa|price/i,
    answer:
      "**Cocoa prices in Ghana** 🍫\n\nCocoa producer prices are set by **COCOBOD** and reviewed each season. Prices differ by grade (Light Crop / Main Crop) and by Licensed Buying Company (PBC, Olam, Kuapa Kokoo).\n\n**Advice:**\n- Compare quotes from **2–3 LBCs** before selling.\n- Ask for the official producer price per 64 kg bag.\n- Avoid middlemen charging unexplained deductions.\n\n> I'm currently in **offline demo mode** — enable Web Search for today's live price.",
  },
  {
    match: /tomato|fertilizer|npk/i,
    answer:
      "**Tomato fertilizer program (per hectare)** 🍅\n\n1. Before planting: **10–15 t** well‑rotted manure/compost.\n2. At transplanting: **NPK 15‑15‑15** at 200–300 kg/ha.\n3. 3 weeks after: **Sulphate of Ammonia** 100–150 kg/ha.\n4. At flowering: potassium‑rich fertilizer (KCl) for fruit set.\n\nWatch for **blossom‑end rot** (add lime/gypsum) and **fusarium wilt** (rotate with maize/legumes).\n\n> I'm currently in **offline demo mode** — connect my API keys for live expert advice.",
  },
  {
    match: /armyworm|pest|weevil|insect/i,
    answer:
      "**Pest control — quick guide** 🐛\n\n**Fall Armyworm (maize):**\n1. Scout weekly — look for 'window‑pane' leaf damage.\n2. Hand‑pick egg masses & young larvae.\n3. Neem extract or ash in the whorl at first signs.\n4. If heavy: emamectin benzoate or chlorantraniliprole, apply in the evening.\n\n**Storage weevils (maize):** dry grain below **14% moisture**, treat with approved protectants, store in **PICS hermetic bags**.\n\n> I'm currently in **offline demo mode** — connect my API keys for live, sourced answers.",
  },
  {
    match: /loan|credit|finance|capital|money/i,
    answer:
      "**Farm finance options in Ghana** 💰\n\n1. **ADB (Agricultural Development Bank)** — farmer loans & group lending.\n2. **Rural & Community Banks** — smallholder loans.\n3. **MASLOC** — microfinance for small farmers.\n4. **MoFA 'Planting for Food & Jobs'** — subsidized inputs.\n5. **Fintech:** Farmerline, Tractor, mobile‑money credit.\n\n**Tip:** join a cooperative — group lending improves approval & rates.\n\n> I'm currently in **offline demo mode** — connect my API keys for live answers.",
  },
  {
    match: /weather|rain|forecast|dry/i,
    answer:
      "**Weather & farming** 🌦️\n\nCheck the **Weather section** on this page for the live 5‑day forecast for Accra, Kumasi, Tamale, Takoradi & Cape Coast.\n\nGeneral guidance:\n- **Rainy season start (south):** March–April → plant maize, peppers, tomatoes.\n- **Dry season (north):** Nov–March → focus on irrigation, dry‑season vegetables.\n- Always mulch to conserve soil moisture.\n\n> I'm currently in **offline demo mode** — connect my API keys for live weather-aware advice.",
  },
];

export function localAnswer(question: string, language: string, mode: string): string {
  const db = getDB();
  const q = question.toLowerCase();
  // 1) exact knowledge base hit
  for (const k of db.knowledge) {
    const words = k.keywords.some((kw) => q.includes(kw.toLowerCase()));
    if (words) return k.answer;
    if (q.includes(k.question.toLowerCase().slice(0, 12))) return k.answer;
  }
  // 2) curated fallbacks
  for (const f of FALLBACK_ANSWERS) {
    if (f.match.test(q)) return f.answer;
  }
  // 3) generic
  const lang = getLanguage(language);
  const modeLabel = mode === "expert" ? "expert" : mode === "agent" ? "research" : "farming";
  return `I'm AgriAI, your ${modeLabel} assistant for Ghanaian agriculture 🌱\n\nI can help you with:\n- 🌽 **Crops** — planting seasons, varieties, yields (maize, cocoa, cassava, yam, rice…)\n- 🐛 **Pests & diseases** — identification and treatment\n- 🧪 **Soil & fertilizer** — NPK programs, manure, pH\n- 💰 **Market prices** — check the Market Prices section\n- 🌦️ **Weather** — check the Weather section\n\nTry asking: *"Best time to plant maize in Ghana"* or *"How to treat cassava mosaic disease"*.\n\n> I'm currently in **offline demo mode** — connect my API keys (see README) to unlock live AI answers in ${lang.native}.`;
}

// ─── Vision (crop disease detection) ─────────────────────────────────────────

export async function detectCropDisease(
  imageInput: string,
  language: string
): Promise<DiseaseResult> {
  const client = getGemini();
  if (!client) return FALLBACK_DISEASE;
  const model = getDB().settings.chat.visionModel;
  const { mimeType, data } = parseImageData(imageInput);
  try {
    const response = await client.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are a crop disease detection expert for Ghanaian agriculture. Analyze this photo of a crop/plant.
Respond in ${language === "en" ? "English" : "English with a short summary in the farmer's language"}.
Return STRICT JSON with exactly this shape:
{"detected":"disease or condition name (or 'Healthy plant')","confidence":0-100,"description":"2-3 sentence description of symptoms and cause","treatment":["step1","step2","step3","step4"]}
If the image is not a plant, set detected to "Not a plant image" and confidence 0.`,
            },
            { inlineData: { mimeType, data } },
          ],
        },
      ],
      config: {
        temperature: 0.2,
        maxOutputTokens: 1024,
        // Disable Gemini 2.5 thinking for fast, predictable, clean JSON output.
        thinkingConfig: { thinkingBudget: 0 },
      },
    });
    const raw = response.text || "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("no JSON in vision response");
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      detected: String(parsed.detected || "Unknown"),
      confidence: Math.min(100, Math.max(0, Number(parsed.confidence) || 0)),
      description: String(parsed.description || ""),
      treatment: Array.isArray(parsed.treatment) ? parsed.treatment.map(String).slice(0, 6) : [],
      demo: false,
    };
  } catch (err) {
    console.error("[ai] Gemini vision failed:", (err as Error).message);
    return FALLBACK_DISEASE;
  }
}
