#!/usr/bin/env python3
"""AgriAI 2.0 Forensic Documentation Pack.
Sole author: Thaddeus Nii Teiko Tagoe.
No em dashes are used in generated text.
"""

from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white, black
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    ListFlowable, ListItem, KeepTogether, HRFlowable,
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY

OUT = Path(__file__).resolve().parent / "pdfs"
OUT.mkdir(parents=True, exist_ok=True)

GREEN = HexColor("#062e19")
ACCENT = HexColor("#00a853")
GOLD = HexColor("#c9a227")
INK = HexColor("#1a1a1a")
MUTED = HexColor("#444444")
RULE = HexColor("#d0d5cc")
PALE = HexColor("#f4f7f3")


def styles():
    s = getSampleStyleSheet()
    s.add(ParagraphStyle(
        name="CoverTitle", fontName="Times-Bold", fontSize=26, leading=32,
        textColor=GREEN, alignment=TA_CENTER, spaceAfter=8,
    ))
    s.add(ParagraphStyle(
        name="CoverSub", fontName="Times-Italic", fontSize=13, leading=18,
        textColor=MUTED, alignment=TA_CENTER, spaceAfter=6,
    ))
    s.add(ParagraphStyle(
        name="H1", fontName="Times-Bold", fontSize=16, leading=20,
        textColor=GREEN, spaceBefore=14, spaceAfter=8,
    ))
    s.add(ParagraphStyle(
        name="H2", fontName="Times-Bold", fontSize=13, leading=17,
        textColor=HexColor("#0a4024"), spaceBefore=11, spaceAfter=6,
    ))
    s.add(ParagraphStyle(
        name="H3", fontName="Times-Bold", fontSize=11.5, leading=15,
        textColor=INK, spaceBefore=8, spaceAfter=4,
    ))
    s.add(ParagraphStyle(
        name="Body", fontName="Times-Roman", fontSize=10.5, leading=15,
        textColor=INK, alignment=TA_JUSTIFY, spaceAfter=7,
    ))
    s.add(ParagraphStyle(
        name="BulletBody", fontName="Times-Roman", fontSize=10.5, leading=15,
        textColor=INK, leftIndent=12, spaceAfter=3,
    ))
    s.add(ParagraphStyle(
        name="CodeBlock", fontName="Courier", fontSize=8.5, leading=12,
        textColor=HexColor("#16301f"), backColor=PALE, leftIndent=6,
        rightIndent=6, spaceBefore=4, spaceAfter=6,
    ))
    s.add(ParagraphStyle(
        name="Caption", fontName="Times-Italic", fontSize=9, leading=12,
        textColor=MUTED, alignment=TA_CENTER, spaceAfter=10,
    ))
    s.add(ParagraphStyle(
        name="Footer", fontName="Times-Roman", fontSize=8, leading=10,
        textColor=MUTED, alignment=TA_CENTER,
    ))
    s.add(ParagraphStyle(
        name="Meta", fontName="Times-Roman", fontSize=10, leading=14,
        textColor=MUTED, alignment=TA_CENTER, spaceAfter=4,
    ))
    return s


def header_footer(canvas, doc):
    canvas.saveState()
    w, h = A4
    canvas.setFillColor(GREEN)
    canvas.rect(0, h - 14 * mm, w, 14 * mm, fill=1, stroke=0)
    canvas.setFillColor(white)
    canvas.setFont("Times-Bold", 9)
    canvas.drawString(18 * mm, h - 9 * mm, "AgriAI 2.0 Forensic Technical Dossier")
    canvas.setFont("Times-Roman", 8)
    canvas.drawRightString(w - 18 * mm, h - 9 * mm, "Thaddeus Nii Teiko Tagoe")
    canvas.setFillColor(GOLD)
    canvas.rect(0, h - 15.2 * mm, w, 1.2 * mm, fill=1, stroke=0)
    canvas.setFillColor(GREEN)
    canvas.rect(0, 0, w, 12 * mm, fill=1, stroke=0)
    canvas.setFillColor(white)
    canvas.setFont("Times-Roman", 8)
    canvas.drawString(18 * mm, 5 * mm, "Sole creator: Thaddeus Tagoe  |  Confidential engineering record  |  18 August 2026")
    canvas.drawRightString(w - 18 * mm, 5 * mm, f"Page {doc.page}")
    canvas.restoreState()


def cover(story, S, title, subtitle):
    story.append(Spacer(1, 18 * mm))
    story.append(Paragraph("AGRIAI 2.0", S["CoverTitle"]))
    story.append(Paragraph("INTELLIGENT FARMING ASSISTANT FOR GHANA", S["CoverSub"]))
    story.append(HRFlowable(width="80%", thickness=1.5, color=GREEN, spaceBefore=6, spaceAfter=10))
    story.append(Paragraph(title, S["CoverTitle"]))
    story.append(Paragraph(subtitle, S["CoverSub"]))
    story.append(Spacer(1, 8 * mm))
    meta = [
        "Prepared and authored solely by Thaddeus Nii Teiko Tagoe",
        "Computer Science, University of Ghana",
        "Founder, designer, and sole engineer of AgriAI",
        "Repository: ThaddeusHackz/agriai-v2",
        "Document date: 18 August 2026",
        "Classification: Internal forensic architecture pack",
    ]
    for line in meta:
        story.append(Paragraph(line, S["Meta"]))
    story.append(Spacer(1, 10 * mm))
    story.append(Paragraph(
        "This document explains how AgriAI was built, which source files make the AI work, "
        "and how the public and admin APIs stay reliable when a provider is missing. "
        "Every claim below is taken from the live codebase, not from marketing copy.",
        S["Body"],
    ))
    story.append(HRFlowable(width="100%", thickness=0.4, color=RULE, spaceBefore=8, spaceAfter=8))


def P(story, S, text):
    story.append(Paragraph(text, S["Body"]))


def H(story, S, text, level=1):
    story.append(Paragraph(text, S[f"H{level}"]))


def bullets(story, S, items):
    for it in items:
        story.append(Paragraph(f"• {it}", S["BulletBody"]))
    story.append(Spacer(1, 3 * mm))


def code(story, S, text):
    safe = (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace(" ", "&nbsp;")
        .replace("\n", "<br/>")
    )
    story.append(Paragraph(safe, S["CodeBlock"]))


def simple_table(story, S, headers, rows):
    data = [[Paragraph(f"<b>{h}</b>", S["BulletBody"]) for h in headers]]
    for r in rows:
        data.append([Paragraph(str(c), S["BulletBody"]) for c in r])
    t = Table(data, colWidths=[None] * len(headers))
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), GREEN),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("BACKGROUND", (0, 1), (-1, -1), PALE),
        ("GRID", (0, 0), (-1, -1), 0.3, RULE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    # fix header text color by using white paragraphs
    data[0] = [Paragraph(f"<font color='white'><b>{h}</b></font>", S["BulletBody"]) for h in headers]
    t = Table(data, colWidths=None)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), GREEN),
        ("BACKGROUND", (0, 1), (-1, -1), PALE),
        ("GRID", (0, 0), (-1, -1), 0.3, RULE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(t)
    story.append(Spacer(1, 5 * mm))


def build_pdf(filename, builder):
    path = OUT / filename
    doc = SimpleDocTemplate(
        str(path),
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=22 * mm,
        bottomMargin=18 * mm,
        title=filename.replace(".pdf", ""),
        author="Thaddeus Nii Teiko Tagoe",
        subject="AgriAI 2.0 forensic architecture",
        creator="Thaddeus Tagoe, sole creator of AgriAI",
    )
    S = styles()
    story = []
    builder(story, S)
    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
    return path


def doc1_framework(story, S):
    cover(
        story, S,
        "Volume I. Framework and Construction",
        "How the whole AgriAI system was assembled, file by file",
    )
    H(story, S, "1. Purpose of this forensic volume")
    P(story, S,
      "This volume is a construction record. It answers a simple question: how was AgriAI 2.0 "
      "put together so that a Ghanaian farmer can open one website and receive chat advice, "
      "crop disease analysis, weather, market prices, and voice, while an administrator can "
      "control the same product from a private panel? The answers come from the repository "
      "layout, the Next.js App Router, the data engine, and the deployment blueprint.")
    H(story, S, "2. Product identity")
    P(story, S,
      "AgriAI 2.0 is a full stack TypeScript application. Package name agriai, version 2.0.0. "
      "The public description in package.json states that it is an intelligent farming assistant "
      "for Ghana with multilingual AI chat, voice, web search, crop disease detection, market "
      "prices, weather, and a full admin panel. The founder of record in README.md is "
      "Thaddeus Nii Teiko Tagoe, Computer Science student at the University of Ghana, "
      "and the sole designer, developer, and maintainer.")
    H(story, S, "3. Technology stack that actually ships")
    bullets(story, S, [
        "Next.js 16.2.10 with the App Router and Node.js runtime on API routes.",
        "React 19.2.4 and React DOM 19.2.4 for the public site and admin shell.",
        "TypeScript 5 with a strict project tsconfig.",
        "Tailwind CSS v4 with PostCSS for the 2026 aurora and glass UI.",
        "Google Gemini via the official @google/genai SDK 2.16 for chat, vision, and transcription.",
        "Cloudflare Workers AI REST API for Llama 3.3 70B chat fallback and Flux image generation.",
        "OpenWeatherMap with Open-Meteo fallback for five Ghanaian cities.",
        "Tavily search with Wikipedia and DuckDuckGo keyless fallback.",
        "ElevenLabs multilingual TTS for spoken answers.",
        "PostgreSQL through the pg driver, plus a local atomic JSON document store.",
        "bcryptjs for admin password hashes and cookie sessions.",
        "Framer Motion, Lucide icons, react-markdown with remark-gfm, and Sonner toasts.",
    ])
    H(story, S, "4. Repository map (the skeleton)")
    P(story, S,
      "The checkout is a single Next.js project. There is no separate microservice repo. "
      "Everything a farmer or an admin needs lives under one process.")
    bullets(story, S, [
        "app/page.tsx and app/layout.tsx: the public marketing and product surface.",
        "app/admin/page.tsx and app/admin/login/page.tsx: the control room.",
        "app/api/*: twenty plus HTTP route handlers. This is the entire backend.",
        "components/: public sections (Hero, Chat, DiseaseDetector, CropStudio, Weather, Prices) and components/admin/* tabs.",
        "lib/ai.ts: Gemini client, model waterfall, streaming, vision, local knowledge answers.",
        "lib/cloudflare.ts: Workers AI chat and Flux image calls.",
        "lib/search.ts: Tavily plus keyless search and citation blocks.",
        "lib/db.ts: seed data, atomic JSON writes, analytics, knowledge base.",
        "lib/pg-store.ts: PostgreSQL mirror so Render deploys do not wipe state.",
        "lib/auth.ts: admin cookies and bcrypt.",
        "lib/env.ts: one place that reads GEMINI_API_KEY and aliases.",
        "lib/languages.ts: English, Twi, Ga, Ewe, Hausa, French instructions.",
        "lib/openweather.ts and lib/images.ts: weather and Unsplash helpers.",
        "instrumentation.ts: boot hydration from Postgres when db.json is missing.",
        "render.yaml and Dockerfile: production shape on Render.",
    ])
    H(story, S, "5. How Next.js makes the framework hold")
    P(story, S,
      "AgriAI uses the App Router. A file named route.ts inside app/api/chat becomes POST /api/chat. "
      "There is no Express server. Each route sets export const runtime = \"nodejs\" and "
      "export const maxDuration = 60 so long Gemini or Flux calls are not killed at the default "
      "edge timeout. The browser never talks to Gemini, Cloudflare, Tavily, OpenWeather, or "
      "ElevenLabs directly. The browser talks only to AgriAI routes. That is why API keys stay "
      "on the server and why CORS and key leakage are not a farmer facing problem.")
    H(story, S, "6. User interface construction")
    P(story, S,
      "The home page is a composition of section components controlled by settings.showSections "
      "in the database. An admin can hide weather or studio without a redeploy. Chat.tsx is the "
      "Perplexity style conversation surface: Server Sent Events, markdown, stop button, source "
      "chips, language and mode selectors. DiseaseDetector.tsx posts a data URL to /api/vision. "
      "CropStudio.tsx posts a farm prompt to /api/generate. WeatherSection.tsx and MarketPrices.tsx "
      "read /api/weather and /api/prices. The admin shell is a tabbed SPA that calls /api/admin/* "
      "through components/admin/api.ts.")
    H(story, S, "7. Data framework")
    P(story, S,
      "lib/db.ts is a zero extra dependency document store. On first boot it seeds settings, "
      "an admin user (bcrypt hash of ADMIN_PASSWORD), twelve Ghana market prices, and eight "
      "knowledge base articles (maize season, cassava mosaic, cocoa price, tomato fertilizer, "
      "yam soil, fall armyworm, farm loans, maize storage). Writes go to data/db.json through "
      "a temp file then rename, so a crash cannot leave a half written file. When DATABASE_URL "
      "is set, schedulePostgresSave mirrors the same document into an agriai_state table. "
      "instrumentation.ts hydrates that document back if the disk file is gone after a Render "
      "redeploy. That is how a free tier filesystem that resets still keeps chats, prices, and "
      "subscribers.")
    H(story, S, "8. Security and admin framework")
    P(story, S,
      "Admin login is POST /api/admin/login. Failures are rate limited (five tries per fifteen "
      "minutes). Success sets a cookie session lasting seven days. Routes under /api/admin "
      "check that session except login itself. Passwords never sit in plaintext in the document. "
      "Public chat input is clipped to 2000 characters. Vision images are capped near 4.5 MB. "
      "Transcription audio is capped at 25 MB. Image generation only accepts farm related "
      "subjects from a SAFE_SUBJECTS list so the studio cannot be used as a general image toy.")
    H(story, S, "9. Deployment framework")
    P(story, S,
      "render.yaml describes a web service plus managed Postgres. Environment variables for "
      "Gemini, Cloudflare, OpenWeather, Tavily, ElevenLabs, and admin seed credentials are "
      "sync false so they are pasted in the Render dashboard, not committed. Dockerfile wraps "
      "the same Next.js build for container hosts. DEPLOYMENT.md is the operator runbook.")
    H(story, S, "10. Forensic conclusion of Volume I")
    P(story, S,
      "AgriAI is not a prompt pasted into a chatbot widget. It is a single Next.js process "
      "designed by Thaddeus Tagoe so that UI, AI, search, weather, prices, voice, persistence, "
      "and administration share one typed data model. The next volumes explain the AI chain "
      "and the HTTP contracts that make that design work under failure.")


def doc2_ai(story, S):
    cover(
        story, S,
        "Volume II. How the AI Actually Works",
        "Gemini, Cloudflare, local knowledge, and why answers still arrive",
    )
    H(story, S, "1. The question this volume answers")
    P(story, S,
      "A reader who is not a machine learning engineer still needs to understand why AgriAI "
      "can speak like an agronomist. There is no custom trained crop model sitting in this "
      "repo. The intelligence is a carefully ordered pipeline: system prompts written for "
      "Ghana, live model calls, optional web grounding, and a local knowledge base that never "
      "lets the product go silent.")
    H(story, S, "2. The three layer brain")
    P(story, S,
      "Every chat request walks the same ladder. Layer 1 is Google Gemini (primary). Layer 2 "
      "is Cloudflare Workers AI Llama 3.3 70B instruct (automatic fallback). Layer 3 is "
      "localAnswer() in lib/ai.ts, which searches the admin editable knowledge base and then "
      "regex curated Ghana answers for maize, cassava, cocoa, tomato, armyworm, loans, and "
      "weather. The product never returns an empty bubble because of a missing key.")
    H(story, S, "3. File that makes Gemini possible: lib/ai.ts")
    P(story, S,
      "getGemini() reads geminiApiKey() from lib/env.ts. Accepted env names are GEMINI_API_KEY, "
      "GOOGLE_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, and GOOGLE_GENAI_API_KEY. The client is "
      "cached and rebuilt if the key changes at runtime. geminiConfigured() is the boolean "
      "the chat route uses before it even tries a live call.")
    H(story, S, "4. Model waterfall (why one failed model does not kill chat)")
    P(story, S,
      "CHAT_MODELS is an ordered list: gemini-2.5-flash, gemini-2.5-flash-lite, gemini-2.0-flash, "
      "gemini-2.0-flash-001, gemini-flash-latest, gemini-1.5-flash, gemini-1.5-flash-latest. "
      "uniqueModels(preferred) puts the admin chosen model first, then the rest, without "
      "duplicates. geminiGenerateText and geminiGenerateStream loop that list. If a model "
      "returns empty text or throws, the next model is tried. Gemini 2.5 models receive "
      "thinkingBudget 0 so the Flash thinking tax does not eat the token budget.")
    H(story, S, "5. Streaming is how the UI feels instant")
    P(story, S,
      "geminiGenerateStream calls client.models.generateContentStream. Each chunk.text is "
      "handed to onDelta. The chat route wraps that in a ReadableStream that writes Server "
      "Sent Events: event delta with a JSON text fragment, then event done with the full "
      "text, demo flag, sources, searchDemo, and provider (gemini, cloudflare, or local). "
      "The browser Chat component paints tokens as they arrive. If Gemini fails mid way, "
      "the route clears fullText and tries Cloudflare, then local.")
    H(story, S, "6. System prompts: the Ghana personality")
    P(story, S,
      "Prompts live in the database settings.chat object, seeded in lib/db.ts, editable in "
      "the admin AI tab. Three modes exist.")
    bullets(story, S, [
        "standard (systemPrompt): AgriAI as a practical Ghana farming assistant built by Thaddeus Tagoe. Crops named: maize, cocoa, cassava, yam, plantain, rice, tomatoes, peppers, groundnuts. Simple language a rural farmer can use. Cite [1] [2] when search context is present.",
        "expert (expertPrompt): agronomist voice. NPK ratios, rates, densities, disease life cycles, IPM, GHS and kg/ha numbers.",
        "agent (agentPrompt): research agent. Break the question, use search results, return summary, numbered points, citations, sections.",
    ])
    P(story, S,
      "languageInstruction(language) from lib/languages.ts is appended so replies can be "
      "English, Twi, Ga, Ewe, Hausa, or French. If web search ran, CURRENT WEB SEARCH RESULTS "
      "are appended to the system string. The model is told to cite [1], [2]. That is how "
      "grounding works without a vector database.")
    H(story, S, "7. Conversation memory without a vector store")
    P(story, S,
      "The client sends history: last user and assistant turns. The route keeps the last ten "
      "valid messages, clips each to 4000 characters, and sends the last eight to Gemini as "
      "role user or role model parts. After the answer, mutate() appends both the farmer "
      "message and the assistant message to a chat keyed by sessionId. Admin Messages tab "
      "reads that same document. There is no Pinecone, no embeddings file, no RAG index. "
      "Recall is short context plus the knowledge base.")
    H(story, S, "8. Web search grounding: lib/search.ts")
    P(story, S,
      "When the farmer toggles webSearch, the chat route calls searchWeb(message + \" Ghana 2026\"). "
      "If TAVILY_API_KEY exists, POST https://api.tavily.com/search with advanced depth, "
      "include_answer, max_results 6. On missing key or Tavily error, keylessSearch hits "
      "Wikipedia OpenSearch and DuckDuckGo Instant Answer. contextBlock() turns the result "
      "into a numbered text block the LLM can cite. Sources travel back on the done event "
      "so the UI can show links.")
    H(story, S, "9. Vision: crop disease detection")
    P(story, S,
      "detectCropDisease(imageInput, language) in lib/ai.ts is the whole vision product. "
      "parseImageData accepts a data URL or raw base64. The prompt forces STRICT JSON: "
      "detected, confidence 0-100, description, treatment array. Temperature is 0.2 so the "
      "model stays conservative. The same CHAT_MODELS waterfall is used, preferring "
      "settings.chat.visionModel. JSON is extracted with a brace regex and parsed. If no "
      "key exists, FALLBACK_DISEASE is returned with demo true so the UI still teaches "
      "the farmer what a live result looks like. /api/vision is a thin validator: language "
      "whitelist, size cap, then detectCropDisease.")
    H(story, S, "10. Voice in and voice out")
    P(story, S,
      "Primary voice input is the browser SpeechRecognition API inside Chat.tsx. Browsers "
      "without it POST audio FormData to /api/transcribe. That route base64 encodes the "
      "file and asks Gemini 2.5 Flash to transcribe verbatim with temperature 0. One key "
      "therefore powers chat, vision, and speech to text. Voice output is /api/tts. It "
      "sends up to 1500 characters to ElevenLabs eleven_multilingual_v2 with voice Rachel "
      "for English and French and a multilingual default for Ghanaian languages. The route "
      "returns audio/mpeg. If ELEVENLABS_API_KEY is missing, status 501 tells the UI to hide "
      "or disable speak.")
    H(story, S, "11. Image generation: AgriAI Studio")
    P(story, S,
      "POST /api/generate first requires Cloudflare or Gemini to be configured. The prompt "
      "must mention a crop or farm word from SAFE_SUBJECTS (maize, cocoa, cassava, yam, "
      "and many others). The prompt is rewritten with photorealistic agricultural photography "
      "language. Cloudflare Flux-1-schnell runs first (4 steps). Gemini native image models "
      "are the second try: gemini-2.5-flash-image, then two 2.0 preview image models. The "
      "response is a PNG or JPEG data URL. This is how Crop Visualizer works without a "
      "separate GPU box.")
    H(story, S, "12. Cloudflare as the insurance policy: lib/cloudflare.ts")
    P(story, S,
      "cloudflareConfigured() needs both CLOUDFLARE_API_KEY and CLOUDFLARE_ACCOUNT_ID. "
      "Chat model is @cf/meta/llama-3.3-70b-instruct-fp8-fast. Image model is "
      "@cf/black-forest-labs/flux-1-schnell. Calls are POST to "
      "https://api.cloudflare.com/client/v4/accounts/{id}/ai/run/{model} with a Bearer token "
      "and a 30 second abort. Failures throw so the caller can step down the ladder.")
    H(story, S, "13. Local knowledge: the AI that works on an airplane")
    P(story, S,
      "localAnswer(question, language, mode) first scans db.knowledge for keyword hits or "
      "a prefix of the stored question. Then FALLBACK_ANSWERS regexes fire. Then a generic "
      "AgriAI help card is returned, naming crops, pests, soil, prices, and weather. Admin "
      "staff can add knowledge rows without a deploy. Those rows become live fallbacks "
      "immediately because getDB() is in process memory.")
    H(story, S, "14. What was not built (honest forensic note)")
    P(story, S,
      "There is no fine tuned Ghana crop weights file. There is no on device TFLite model. "
      "Disease detection accuracy advertised in seed stats is a product metric, not a "
      "confusion matrix checked into this repo. The AI works because Thaddeus Tagoe wired "
      "production APIs, Ghana specific prompts, search citations, and a fail closed local "
      "brain into one typed module. That engineering is the invention.")
    H(story, S, "15. End to end farmer story")
    P(story, S,
      "A farmer in Kumasi types in Twi, enables web search, and asks about cocoa. Chat.tsx "
      "POSTs to /api/chat. Analytics increment. Tavily (or Wikipedia) returns sources. "
      "Gemini streams an expert or standard answer in Twi with [1] markers. The done event "
      "carries provider gemini. The farmer taps speak. /api/tts returns MP3. If Gemini is "
      "down the same second, Llama answers. If Cloudflare is also down, the cocoa knowledge "
      "article still teaches COCOBOD grades and licensed buying companies. That chain is "
      "why the AI feels reliable.")


def doc3_api(story, S):
    cover(
        story, S,
        "Volume III. API Contracts and Reliability",
        "How every route is shaped so the product stays up",
    )
    H(story, S, "1. Design rule")
    P(story, S,
      "AgriAI APIs are Next.js Route Handlers. They accept JSON or FormData, validate early, "
      "never throw an uncaught error to the farmer, and degrade to a useful payload when a "
      "vendor is offline. This volume is the contract sheet.")
    H(story, S, "2. Public AI and media routes")
    simple_table(story, S, ["Route", "Role"], [
        ["POST /api/chat", "SSE conversation. Body: message, language, mode, webSearch, history, sessionId. Events: delta, done."],
        ["POST /api/vision", "Crop photo to JSON disease report via detectCropDisease."],
        ["POST /api/generate", "Farm scene to image data URL. Cloudflare Flux then Gemini image."],
        ["POST /api/transcribe", "Audio file to text via Gemini multimodal."],
        ["POST /api/tts", "Text to MPEG via ElevenLabs."],
        ["POST /api/search", "Standalone web search used by UI helpers."],
    ])
    H(story, S, "3. Chat request contract in detail")
    bullets(story, S, [
        "message required, trimmed, max 2000 characters. Empty returns 400.",
        "language must match en|tw|ga|ee|ha|fr or it becomes en.",
        "mode must be expert or agent or it becomes standard.",
        "webSearch boolean. If true, searchWeb runs before the model.",
        "sessionId clipped to 64 chars, or anon_ plus a time token.",
        "history filtered to user/assistant strings, last 10 kept.",
        "Invalid JSON returns 400 Invalid JSON body.",
        "Success is not JSON. It is text/event-stream with no-cache, keep-alive, X-Accel-Buffering no (so nginx does not hide tokens).",
        "done payload: text, demo, sources, searchDemo, provider.",
    ])
    H(story, S, "4. Why chat stays \"perfect\" under failure")
    P(story, S,
      "Perfect here means the farmer always gets a structured stream and a persisted turn. "
      "Gemini stream errors are caught, logged as [chat] Gemini stream failed, trying Cloudflare. "
      "Cloudflare errors are caught the same way. Local answer sets demo true and clears "
      "sources so the UI does not fake citations. Persistence happens after generation so "
      "even offline answers are in the admin transcript. request.signal aborts upstream "
      "work if the farmer hits stop.")
    H(story, S, "5. Data and utility routes")
    simple_table(story, S, ["Route", "Role"], [
        ["GET /api/weather", "5 day forecast. OpenWeather then Open-Meteo then curated city data."],
        ["GET/POST /api/prices", "Market board read and refresh with optional live intel."],
        ["GET /api/config", "Public site settings the home page needs (no secrets)."],
        ["GET /api/health", "Liveness for Render."],
        ["POST /api/feedback", "Thumbs on an answer."],
        ["GET /api/history", "Session transcript for the returning browser."],
        ["POST /api/subscribe", "Newsletter into subscribers[]."],
        ["POST /api/contact", "Contact form into contacts[]."],
        ["POST /api/track", "Visit analytics."],
        ["GET /api/images", "Unsplash crop photos when a key exists."],
    ])
    H(story, S, "6. Admin API surface")
    P(story, S,
      "All of these sit under app/api/admin/. They share cookie auth from lib/auth.ts.")
    bullets(story, S, [
        "login, logout, me: session life cycle. Login is rate limited.",
        "settings: read and write site copy, colors, section flags, AI model, temperature, maxTokens, three prompts.",
        "analytics: chats, messages, visits, top questions, feedback counts.",
        "users: create editors and admins, reset passwords.",
        "messages: list and delete conversations.",
        "knowledge: CRUD for offline Q and A used by localAnswer.",
        "prices: CRUD for the public board.",
        "subscribers and feedback: lists and CSV minded exports.",
        "reset: danger zone wipe and reseed.",
    ])
    H(story, S, "7. Weather reliability pattern")
    P(story, S,
      "Weather copies the AI ladder. OpenWeather is primary when OPENWEATHER_API_KEY is set. "
      "Open-Meteo is a no key scientific fallback. Seeded city advice is last. Cities in the "
      "product are Accra, Kumasi, Tamale, Takoradi, and Cape Coast. The UI never shows a "
      "hard crash page because the route always has a payload.")
    H(story, S, "8. Environment contract (what must be set for live AI)")
    bullets(story, S, [
        "GEMINI_API_KEY (or Google aliases): live chat, vision, transcription.",
        "CLOUDFLARE_API_KEY + CLOUDFLARE_ACCOUNT_ID: Llama fallback and Flux studio.",
        "OPENWEATHER_API_KEY: best weather.",
        "TAVILY_API_KEY: best search citations.",
        "ELEVENLABS_API_KEY: spoken answers.",
        "UNSPLASH_ACCESS_KEY: crop photos on the price board.",
        "DATABASE_URL: survive Render disk resets.",
        "ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME: first admin seed.",
        "NEXT_PUBLIC_SITE_URL: canonical links, sitemap, robots.",
    ])
    P(story, S,
      "Missing keys do not crash boot. Each helper returns null or a demo structure. That "
      "is the operational reason the site can be demoed in a classroom without secrets.")
    H(story, S, "9. Validation habits that keep APIs clean")
    P(story, S,
      "Routes parse JSON in try/catch. Strings are typeof checked. Arrays are filtered. "
      "Language and mode are whitelisted, never trusted from the client as free text in "
      "system position except after they pass the regex. Image generate rejects off topic "
      "prompts with 400. Vision rejects tiny or huge payloads. TTS clips to 1500 characters. "
      "These boring checks are why the APIs look stable in production.")
    H(story, S, "10. Forensic conclusion of Volume III")
    P(story, S,
      "The APIs work well because Thaddeus Tagoe treated every vendor as optional and every "
      "farmer request as something that must end in a typed, persisted, explainable result. "
      "Streaming, fallbacks, caps, and admin CRUD are one system, not plugins glued on later.")


def doc4_codepath(story, S):
    cover(
        story, S,
        "Volume IV. Code Path Atlas",
        "Which files execute when a farmer or admin clicks",
    )
    H(story, S, "1. How to read this atlas")
    P(story, S,
      "Each path is a real call chain from a UI file to a library. Use it as a study map.")
    H(story, S, "2. Path A. Typed question in the chat box")
    bullets(story, S, [
        "components/Chat.tsx collects message, language, mode, webSearch, history, sessionId.",
        "fetch POST /api/chat with JSON.",
        "app/api/chat/route.ts validates and calls trackQuestion + trackMessage.",
        "Optional: lib/search.ts searchWeb then contextBlock.",
        "getDB().settings.chat selects model, temperature, maxTokens, and the mode prompt.",
        "If geminiConfigured: lib/ai.ts geminiGenerateStream, SSE delta events.",
        "Else or on failure: lib/cloudflare.ts cloudflareChat.",
        "Else: lib/ai.ts localAnswer using lib/db.ts knowledge.",
        "mutate() writes both turns. SSE done. Chat.tsx renders markdown and sources.",
    ])
    H(story, S, "3. Path B. Photo of a sick leaf")
    bullets(story, S, [
        "components/DiseaseDetector.tsx reads the file as a data URL.",
        "POST /api/vision { image, language }.",
        "app/api/vision/route.ts size and language checks.",
        "lib/ai.ts detectCropDisease: Gemini multimodal JSON, or FALLBACK_DISEASE.",
        "UI shows detected name, confidence, description, treatment steps, demo badge.",
    ])
    H(story, S, "4. Path C. Crop Visualizer")
    bullets(story, S, [
        "components/CropStudio.tsx POST /api/generate { prompt }.",
        "SAFE_SUBJECTS gate in app/api/generate/route.ts.",
        "lib/cloudflare.ts cloudflareImage Flux, else lib/ai.ts geminiImage.",
        "JSON { ok, image, provider }. Farmer downloads the PNG.",
    ])
    H(story, S, "5. Path D. Microphone")
    bullets(story, S, [
        "Chat.tsx prefers window SpeechRecognition.",
        "Fallback: MediaRecorder blob to POST /api/transcribe multipart audio.",
        "Gemini 2.5 Flash inlineData audio, returns { text } into the input box.",
    ])
    H(story, S, "6. Path E. Speaker")
    bullets(story, S, [
        "Chat.tsx POST /api/tts { text, language, speed }.",
        "ElevenLabs voice map, audio/mpeg response, Audio element plays it.",
    ])
    H(story, S, "7. Path F. Weather strip")
    bullets(story, S, [
        "components/WeatherSection.tsx GET /api/weather.",
        "lib/openweather.ts then Open-Meteo then curated.",
        "Advice strings stay Ghana season aware even in fallback.",
    ])
    H(story, S, "8. Path G. Admin changes the AI personality")
    bullets(story, S, [
        "components/admin/AITab.tsx edits model, temperature, prompts.",
        "components/admin/api.ts PUT /api/admin/settings.",
        "lib/auth.ts accepts the cookie. mutate() writes settings.chat.",
        "Next farmer message uses the new prompt with no rebuild.",
    ])
    H(story, S, "9. Path H. First boot")
    bullets(story, S, [
        "instrumentation.ts runs hydrateFromPostgres if data/db.json is absent.",
        "lib/db.ts load() or defaultDB() seeds prices, knowledge, bcrypt admin.",
        "app/layout.tsx and lib/site-context.tsx feed public config to components.",
    ])
    H(story, S, "10. Source file roster for AI enablement")
    simple_table(story, S, ["File", "Why AI cannot work without it"], [
        ["lib/ai.ts", "Gemini client, stream, vision, image, localAnswer."],
        ["lib/cloudflare.ts", "Fallback LLM and Flux."],
        ["lib/search.ts", "Citations and grounding text."],
        ["lib/env.ts", "Secret resolution and aliases."],
        ["lib/languages.ts", "Six language system addenda."],
        ["lib/db.ts", "Prompts, knowledge, persistence."],
        ["app/api/chat/route.ts", "Orchestrates the ladder and SSE."],
        ["app/api/vision/route.ts", "Disease HTTP edge."],
        ["app/api/generate/route.ts", "Studio HTTP edge."],
        ["app/api/transcribe/route.ts", "Voice to text HTTP edge."],
        ["app/api/tts/route.ts", "Text to voice HTTP edge."],
        ["components/Chat.tsx", "The farmer facing brain."],
    ])
    H(story, S, "11. Closing statement of authorship")
    P(story, S,
      "Volumes I to IV map construction, intelligence, APIs, and call chains. Volumes V and VI "
      "add the security threat model and the sequence posters. The whole pack is authored by "
      "Thaddeus Nii Teiko Tagoe, sole creator of AgriAI and of this documentation.")


def doc5_security(story, S):
    cover(
        story, S,
        "Volume V. Security Threat Model",
        "What is already locked, what can still bite, and how to operate safely",
    )
    H(story, S, "1. Scope")
    P(story, S,
      "This volume is an honest forensic review of AgriAI 2.0 as it exists in "
      "ThaddeusHackz/agriai-v2. It is not a penetration test against a live host. It reads "
      "lib/auth.ts, next.config.ts, route validators, env handling, and the data store, then "
      "names real risks a Ghana deployment will meet.")
    H(story, S, "2. Trust boundaries")
    bullets(story, S, [
        "Browser (farmer or attacker) may only call AgriAI HTTP routes. Vendor keys never ship in NEXT_PUBLIC_* except site URL.",
        "Next.js Node runtime holds GEMINI, Cloudflare, Tavily, OpenWeather, ElevenLabs, Unsplash, DATABASE_URL, and admin seed secrets.",
        "Google, Cloudflare, Tavily, OpenWeather, and ElevenLabs are third parties. AgriAI must treat their output as untrusted text.",
        "Admin cookie agriai_session is the only proof of staff identity. Role is admin or editor.",
        "data/db.json and PostgreSQL agriai_state hold chats, hashes, sessions, prices, and subscribers. Disk and DB are the crown jewels.",
    ])
    H(story, S, "3. Controls that already work")
    bullets(story, S, [
        "Passwords hashed with bcryptjs cost 10. publicUser() strips passwordHash from JSON.",
        "Session token is 32 random bytes hex. Cookie is httpOnly, sameSite lax, secure in production, path /.",
        "Remember me: 7 day maxAge. Without remember: 8 hours. Expired sessions pruned on login.",
        "Login rate limit: 5 failures per IP per 15 minutes, HTTP 429. Failed login does not reveal whether the email exists.",
        "Chat message clipped to 2000 chars. History clipped. Language and mode whitelisted.",
        "Vision body cap about 4.5 MB. Transcribe audio cap 25 MB. TTS text cap 1500 chars.",
        "Studio SAFE_SUBJECTS block turns the image API away from general abuse.",
        "lib/env.ts strips quotes, rejects YOUR_ and CHANGE_ME placeholders, never logs secret values.",
        "next.config.ts sets X-Content-Type-Options nosniff and Referrer-Policy strict-origin-when-cross-origin.",
        "GET /api/health reports provider configured/live flags without dumping keys.",
        "Reset and user CRUD sit behind getSessionUser.",
    ])
    H(story, S, "4. Threat catalog")
    H(story, S, "4.1 Prompt injection and jailbreak of AgriAI", 2)
    P(story, S,
      "A farmer (or a script) can put instructions in the message or in a pasted web page that "
      "Tavily later injects into the system block. The model may ignore Ghana agronomy rules, "
      "invent pesticide doses, or echo hidden text from a source. Mitigation already present: "
      "citation markers, short maxTokens, temperature from admin. Residual risk: high for "
      "advice quality, medium for brand. Operator action: keep expert mode for trained staff, "
      "and treat every chemical rate as something a MoFA officer must confirm.")
    H(story, S, "4.2 Cost abuse and denial of wallet", 2)
    P(story, S,
      "POST /api/chat, /api/vision, /api/generate, /api/transcribe, and /api/tts have no farmer "
      "login and no per IP quota. An open Render URL can be scripted until Gemini, Flux, or "
      "ElevenLabs bills spike. Chat also writes every turn to disk. Mitigation: 60s maxDuration "
      "and payload caps. Residual risk: high on a public hostname. Operator action: put a "
      "reverse proxy rate limit, Cloudflare WAF, or a simple token in front of AI routes "
      "before a national launch.")
    H(story, S, "4.3 Admin session theft", 2)
    P(story, S,
      "sameSite lax blocks most CSRF cookie sends from evil sites on POST in modern browsers, "
      "but XSS on the AgriAI origin would still read nothing (httpOnly) while still being able "
      "to call /api/admin/* as the victim. There is no CSRF token pair. Session lives in the "
      "JSON document, so a stolen db.json is a stolen session list. Residual risk: medium. "
      "Operator action: HTTPS only, short remember windows, rotate admin passwords after any "
      "disk leak, add Content-Security-Policy when the UI is stable.")
    H(story, S, "4.4 Default and seed credentials", 2)
    P(story, S,
      "defaultDB() seeds ADMIN_EMAIL or admin@agriai.gh and ADMIN_PASSWORD or AgriAI@2026Admin. "
      "If env is forgotten on first boot, that well known password is in bcrypt form on disk. "
      "README already says change it in Admin Users. Residual risk: critical on any public "
      "demo that skipped env. Operator action: set a long ADMIN_PASSWORD before the first "
      "process start, then change it again in the panel.")
    H(story, S, "4.5 Rate limit bypass", 2)
    P(story, S,
      "attempts is an in-memory Map keyed by x-forwarded-for first hop. On multi instance "
      "Render or if an attacker spoofs X-Forwarded-For in front of a misconfigured proxy, "
      "the 5/15 limit evaporates. Residual risk: medium. Operator action: trust only the "
      "platform hop, or move limits to the edge.")
    H(story, S, "4.6 Sensitive data in the document store", 2)
    P(story, S,
      "Chats may contain farm locations, phone numbers, and distress. Subscribers and contacts "
      "are emails. Sessions include IP and user agent. The JSON file is gitignored, which is "
      "correct, but a backup or a world readable Render disk snapshot would expose them. "
      "Postgres mirror helps durability and also concentrates the same PII. Residual risk: "
      "high if backups are casual. Operator action: encrypt at rest on the host, restrict "
      "who can open the admin Messages tab, publish a retention rule.")
    H(story, S, "4.7 SSRF and outbound fetch", 2)
    P(story, S,
      "Search, weather, Cloudflare, Tavily, Wikipedia, DuckDuckGo, ElevenLabs, and Unsplash "
      "use fixed vendor URLs, not farmer supplied URLs. That is good. Image generate does not "
      "fetch a farmer URL. Residual SSRF risk is low unless a future feature fetches arbitrary "
      "links for scraping.")
    H(story, S, "4.8 File and vision abuse", 2)
    P(story, S,
      "Vision accepts a huge base64 string in JSON. Caps exist, but a flood of 4 MB posts still "
      "burns CPU and Gemini quota. There is no virus scan because the bytes go to Gemini, not "
      "to a shared disk gallery. Residual risk: medium (cost and CPU), low (malware on server).")
    H(story, S, "4.9 Health probe information leak", 2)
    P(story, S,
      "/api/health is public and tells the world which providers are configured and whether "
      "Gemini answered OK. That helps Thaddeus debug Render. It also helps an attacker know "
      "which wallet to drain. Residual risk: low to medium. Operator action: lock health to "
      "the platform checker or strip live error strings in production.")
    H(story, S, "4.10 Missing browser hardening headers", 2)
    P(story, S,
      "nosniff and referrer policy are set. There is no Content-Security-Policy, no "
      "Permissions-Policy, no X-Frame-Options or CSP frame-ancestors in next.config.ts. "
      "Clickjacking the admin login in an iframe is a residual risk on older browsers. "
      "Operator action: add frame-ancestors 'self' and a strict CSP once inline styles are inventoried.")
    H(story, S, "5. Abuse cases tied to AI quality")
    bullets(story, S, [
        "Medical or pesticide overconfidence: expert mode can state kg/ha figures that a model invented. UI should keep the demo and live disclaimer.",
        "Language mismatch: a Twi request can still get English if the model ignores languageInstruction. Farmer safety depends on the farmer noticing.",
        "Citation theater: if search fails, local mode clears sources. If search succeeds, a wrong snippet can still be cited as [1]. Citations are not proof.",
        "Image studio: SAFE_SUBJECTS is substring based. Creative spelling can slip past. Keep Flux account limits on.",
    ])
    H(story, S, "6. Recommended hardening order (for the sole operator)")
    bullets(story, S, [
        "1. Unique ADMIN_PASSWORD in env before first boot. Change again in the panel.",
        "2. HTTPS and Render secret store only. Never commit .env.local.",
        "3. Edge rate limits on /api/chat, /api/vision, /api/generate, /api/tts, /api/transcribe.",
        "4. Restrict /admin and /api/admin to known staff IPs if the panel is not public on purpose.",
        "5. Add CSP and frame-ancestors.",
        "6. Move sessions to a signed cookie or Redis so db.json theft does not clone logins.",
        "7. Redact health error strings.",
        "8. Write a 90 day chat retention job.",
    ])
    H(story, S, "7. Forensic verdict")
    P(story, S,
      "AgriAI was built as a product that must stay up for farmers, not as a bank. Auth, "
      "hashing, httpOnly cookies, input caps, and key isolation are real engineering by "
      "Thaddeus Tagoe. The largest remaining holes are unauthenticated AI spend, seed "
      "password discipline, in-memory rate limits, and PII sitting in one document. Close "
      "those before a ministry scale rollout.")


def doc6_sequences(story, S):
    cover(
        story, S,
        "Volume VI. Sequence Poster Pack",
        "Read these diagrams top to bottom. Each box is a real file or vendor.",
    )
    H(story, S, "How to read the posters")
    P(story, S,
      "Time flows downward. A line of the form A -> B : message means A calls B. "
      "Alt blocks are fallbacks. These are study posters, not UML for a tool.")
    H(story, S, "Poster 1. Chat answer (the main brain)")
    code(story, S,
"""Farmer
  -> Chat.tsx : type question, pick Twi, mode, webSearch
  -> POST /api/chat/route.ts : JSON body
       route.ts -> lib/db.ts : trackQuestion, trackMessage
       alt webSearch on
         route.ts -> lib/search.ts : searchWeb(q + " Ghana 2026")
         search.ts -> Tavily or Wikipedia or DuckDuckGo
         search.ts -> contextBlock() numbered sources
       route.ts -> settings.chat : system / expert / agent prompt
       route.ts -> lib/languages.ts : languageInstruction
       alt GEMINI_API_KEY present
         route.ts -> lib/ai.ts geminiGenerateStream
         ai.ts -> Google Gemini model waterfall
         ai.ts -> route.ts onDelta
         route.ts -> Farmer : SSE event delta { text }
       else or Gemini threw
         route.ts -> lib/cloudflare.ts cloudflareChat
         cloudflare.ts -> Llama 3.3 70B Workers AI
       else both empty
         route.ts -> lib/ai.ts localAnswer
         localAnswer -> db.knowledge then FALLBACK_ANSWERS
       route.ts -> lib/db.ts mutate : save user + assistant
       route.ts -> Farmer : SSE event done { text, demo, sources, provider }
  -> Chat.tsx : markdown, source chips, provider badge""")
    H(story, S, "Poster 2. Sick leaf (vision)")
    code(story, S,
"""Farmer
  -> DiseaseDetector.tsx : pick photo
  -> POST /api/vision : { image data URL, language }
       vision/route.ts : size <= 4.5MB, language whitelist
       vision/route.ts -> lib/ai.ts detectCropDisease
       alt no Gemini key
         ai.ts -> FALLBACK_DISEASE demo=true
       else
         ai.ts -> Gemini multimodal JSON prompt
         loop CHAT_MODELS until JSON parses
       vision/route.ts -> Farmer : { detected, confidence, description, treatment, demo }""")
    H(story, S, "Poster 3. Crop Visualizer")
    code(story, S,
"""Farmer
  -> CropStudio.tsx : "healthy maize field at sunrise in Ghana"
  -> POST /api/generate
       generate/route.ts : SAFE_SUBJECTS gate
       alt Cloudflare configured
         -> lib/cloudflare.ts Flux-1-schnell 4 steps
         -> { ok, image data URL, provider cloudflare }
       else Gemini configured
         -> lib/ai.ts geminiImage IMAGE_MODELS
         -> { ok, image, provider gemini }
       else 503 or 502 with a clear error""")
    H(story, S, "Poster 4. Voice in and voice out")
    code(story, S,
"""VOICE IN
Farmer mic -> Chat.tsx SpeechRecognition (primary)
  alt browser has no SpeechRecognition
    Chat.tsx -> POST /api/transcribe multipart audio
    transcribe/route.ts -> Gemini 2.5 Flash inline audio
    -> { text } into the chat box

VOICE OUT
Farmer taps speak -> POST /api/tts { text, language, speed }
  tts/route.ts -> ElevenLabs eleven_multilingual_v2
  -> audio/mpeg -> Chat.tsx Audio element
  alt no ELEVENLABS_API_KEY : HTTP 501""")
    H(story, S, "Poster 5. Admin login and prompt edit")
    code(story, S,
"""Staff
  -> /admin/login -> POST /api/admin/login
       auth.ts : rate limit IP (5 / 15 min)
       bcrypt compare passwordHash
       startSession 32-byte token
       cookie agriai_session httpOnly SameSite=Lax
  -> AdminShell AITab
  -> PUT /api/admin/settings { chat.systemPrompt, model, temperature }
       getSessionUser or 401
       mutate db.settings
  Next farmer chat uses the new prompt with no rebuild""")
    H(story, S, "Poster 6. Boot and memory")
    code(story, S,
"""Process start
  -> instrumentation.ts
  alt no data/db.json and DATABASE_URL set
    -> lib/pg-store load agriai_state
    -> lib/db.ts hydrateFromPostgres, rewrite db.json
  else
    -> lib/db.ts load or defaultDB seed
         seed prices, knowledge, bcrypt admin
  Request write
    -> mutate() atomic tmp rename db.json
    -> schedulePostgresSave debounce mirror""")
    H(story, S, "Poster 7. Full provider ladder (one glance)")
    code(story, S,
"""CHAT text     : Gemini stream -> Cloudflare Llama -> local knowledge
VISION photo  : Gemini JSON   -> FALLBACK_DISEASE demo card
IMAGE studio  : Cloudflare Flux -> Gemini image models -> 502
SEARCH ground : Tavily -> Wikipedia + DuckDuckGo -> empty sources
WEATHER       : OpenWeather -> Open-Meteo -> curated city card
VOICE in      : Browser STT -> Gemini audio
VOICE out     : ElevenLabs -> disable speak
STATE         : db.json -> PostgreSQL agriai_state""")
    H(story, S, "Why these posters matter")
    P(story, S,
      "If you can redraw Poster 1 and Poster 7 from memory, you understand how AgriAI "
      "intelligence was made to work. The AI is a ladder of real APIs plus Ghana prompts "
      "plus a local brain, orchestrated in TypeScript by Thaddeus Nii Teiko Tagoe, sole "
      "creator of AgriAI 2.0 and of this forensic pack.")


def main():
    files = [
        ("01_AgriAI_Framework_and_Construction.pdf", doc1_framework),
        ("02_AgriAI_How_the_AI_Functions.pdf", doc2_ai),
        ("03_AgriAI_API_Reliability_and_Contracts.pdf", doc3_api),
        ("04_AgriAI_Code_Path_Atlas.pdf", doc4_codepath),
        ("05_AgriAI_Security_Threat_Model.pdf", doc5_security),
        ("06_AgriAI_Sequence_Poster_Pack.pdf", doc6_sequences),
    ]
    for name, fn in files:
        p = build_pdf(name, fn)
        print("wrote", p)


if __name__ == "__main__":
    main()
