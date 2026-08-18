#!/usr/bin/env python3
"""Build the complete AgriAI forensic engineering dossier.

Document author and owner: Thaddeus Nii Teiko Tagoe.
The output intentionally contains no em dash or en dash characters.
"""

from __future__ import annotations

import hashlib
import html
import json
import re
import shutil
import subprocess
import textwrap
import zipfile
from pathlib import Path
from typing import Callable, Iterable, Sequence

from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    HRFlowable,
    LongTable,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "forensic" / "pdfs"
ZIP_PATH = ROOT / "Thaddeus_Tagoe_AgriAI_Complete_Forensic_Engineering_Dossier.zip"
SNAPSHOT_COMMIT = "991457272b7fec548e02c645c5593b930af5ea29"
SNAPSHOT_DATE = "18 August 2026"
AUTHOR = "Thaddeus Nii Teiko Tagoe"
SHORT_AUTHOR = "Thaddeus Tagoe"
REPOSITORY = "ThaddeusHackz/agriai-v2"

NAVY = HexColor("#081f17")
GREEN = HexColor("#0b6b3a")
GREEN_2 = HexColor("#159957")
LIME = HexColor("#83c341")
GOLD = HexColor("#c99524")
INK = HexColor("#17211b")
MUTED = HexColor("#526057")
PALE = HexColor("#f2f7f3")
PALE_GOLD = HexColor("#fff8e8")
RULE = HexColor("#cbd7cf")
RED = HexColor("#9f2f2f")
ORANGE = HexColor("#b65d12")
WHITE = colors.white

FORBIDDEN_DASHES = {
    "\u2010": "-",
    "\u2011": "-",
    "\u2012": "-",
    "\u2013": "-",
    "\u2014": ",",
    "\u2212": "-",
}


def clean(value: object) -> str:
    text = str(value)
    for bad, replacement in FORBIDDEN_DASHES.items():
        text = text.replace(bad, replacement)
    return text


def source_hash(path: str) -> str:
    return hashlib.sha256((ROOT / path).read_bytes()).hexdigest()


def shell(command: str) -> str:
    return subprocess.check_output(command, cwd=ROOT, shell=True, text=True).strip()


def styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    return {
        "cover_kicker": ParagraphStyle(
            "CoverKicker", parent=base["Normal"], fontName="Helvetica-Bold",
            fontSize=10, leading=13, textColor=GREEN, alignment=TA_CENTER,
            tracking=1.2, spaceAfter=8,
        ),
        "cover_title": ParagraphStyle(
            "CoverTitle", parent=base["Title"], fontName="Helvetica-Bold",
            fontSize=27, leading=32, textColor=NAVY, alignment=TA_CENTER,
            spaceAfter=11,
        ),
        "cover_sub": ParagraphStyle(
            "CoverSub", parent=base["Normal"], fontName="Helvetica",
            fontSize=12.5, leading=18, textColor=MUTED, alignment=TA_CENTER,
            spaceAfter=7,
        ),
        "meta": ParagraphStyle(
            "Meta", parent=base["Normal"], fontName="Helvetica",
            fontSize=9.3, leading=13, textColor=MUTED, alignment=TA_CENTER,
            spaceAfter=3,
        ),
        "h1": ParagraphStyle(
            "H1", parent=base["Heading1"], fontName="Helvetica-Bold",
            fontSize=16, leading=20, textColor=NAVY, spaceBefore=13,
            spaceAfter=7, keepWithNext=True,
        ),
        "h2": ParagraphStyle(
            "H2", parent=base["Heading2"], fontName="Helvetica-Bold",
            fontSize=12.5, leading=16, textColor=GREEN, spaceBefore=10,
            spaceAfter=5, keepWithNext=True,
        ),
        "h3": ParagraphStyle(
            "H3", parent=base["Heading3"], fontName="Helvetica-Bold",
            fontSize=10.5, leading=14, textColor=INK, spaceBefore=7,
            spaceAfter=4, keepWithNext=True,
        ),
        "body": ParagraphStyle(
            "Body", parent=base["BodyText"], fontName="Helvetica",
            fontSize=8.8, leading=12.8, textColor=INK, alignment=TA_JUSTIFY,
            spaceAfter=6,
        ),
        "body_left": ParagraphStyle(
            "BodyLeft", parent=base["BodyText"], fontName="Helvetica",
            fontSize=8.8, leading=12.8, textColor=INK, alignment=TA_LEFT,
            spaceAfter=6,
        ),
        "bullet": ParagraphStyle(
            "Bullet", parent=base["BodyText"], fontName="Helvetica",
            fontSize=8.7, leading=12.4, textColor=INK, leftIndent=10,
            firstLineIndent=-8, spaceAfter=3,
        ),
        "number": ParagraphStyle(
            "Number", parent=base["BodyText"], fontName="Helvetica",
            fontSize=8.7, leading=12.4, textColor=INK, leftIndent=13,
            firstLineIndent=-11, spaceAfter=3,
        ),
        "code": ParagraphStyle(
            "Code", parent=base["Code"], fontName="Courier",
            fontSize=7.1, leading=9.6, textColor=HexColor("#123423"),
            backColor=PALE, borderColor=RULE, borderWidth=0.5,
            borderPadding=6, leftIndent=2, rightIndent=2, spaceBefore=4,
            spaceAfter=7,
        ),
        "small": ParagraphStyle(
            "Small", parent=base["BodyText"], fontName="Helvetica",
            fontSize=7.4, leading=10.2, textColor=INK, spaceAfter=3,
        ),
        "table": ParagraphStyle(
            "Table", parent=base["BodyText"], fontName="Helvetica",
            fontSize=6.9, leading=9.1, textColor=INK,
        ),
        "table_head": ParagraphStyle(
            "TableHead", parent=base["BodyText"], fontName="Helvetica-Bold",
            fontSize=7, leading=9, textColor=WHITE,
        ),
        "caption": ParagraphStyle(
            "Caption", parent=base["BodyText"], fontName="Helvetica-Oblique",
            fontSize=7.4, leading=10, textColor=MUTED, alignment=TA_CENTER,
            spaceAfter=6,
        ),
        "callout": ParagraphStyle(
            "Callout", parent=base["BodyText"], fontName="Helvetica",
            fontSize=8.6, leading=12.4, textColor=INK, backColor=PALE_GOLD,
            borderColor=GOLD, borderWidth=0.7, borderPadding=7,
            spaceBefore=4, spaceAfter=8,
        ),
        "finding": ParagraphStyle(
            "Finding", parent=base["BodyText"], fontName="Helvetica",
            fontSize=8.5, leading=12.2, textColor=INK, backColor=PALE,
            borderColor=GREEN_2, borderWidth=0.8, borderPadding=7,
            spaceBefore=4, spaceAfter=8,
        ),
    }


S = styles()


class ForensicDocTemplate(BaseDocTemplate):
    def __init__(self, filename: str, *, title: str, volume: str):
        super().__init__(
            filename,
            pagesize=A4,
            leftMargin=16 * mm,
            rightMargin=16 * mm,
            topMargin=21 * mm,
            bottomMargin=17 * mm,
            title=clean(title),
            author=AUTHOR,
            subject="AgriAI forensic software architecture and security engineering",
            creator=f"{AUTHOR}, sole author of this forensic dossier",
            keywords="AgriAI, Thaddeus Tagoe, software architecture, AI, API, security, forensics",
        )
        self.volume = volume
        frame = Frame(
            self.leftMargin,
            self.bottomMargin,
            self.width,
            self.height,
            id="main",
        )
        self.addPageTemplates([PageTemplate(id="forensic", frames=[frame], onPage=self._page)])

    def _page(self, canvas, doc):
        canvas.saveState()
        width, height = A4
        canvas.setFillColor(NAVY)
        canvas.rect(0, height - 12.5 * mm, width, 12.5 * mm, fill=1, stroke=0)
        canvas.setFillColor(LIME)
        canvas.rect(0, height - 13.4 * mm, width, 0.9 * mm, fill=1, stroke=0)
        canvas.setFillColor(WHITE)
        canvas.setFont("Helvetica-Bold", 7.8)
        canvas.drawString(16 * mm, height - 8.2 * mm, "AGRIAI FORENSIC ENGINEERING DOSSIER")
        canvas.setFont("Helvetica", 7.4)
        canvas.drawRightString(width - 16 * mm, height - 8.2 * mm, clean(self.volume))
        canvas.setStrokeColor(RULE)
        canvas.line(16 * mm, 12.2 * mm, width - 16 * mm, 12.2 * mm)
        canvas.setFillColor(MUTED)
        canvas.setFont("Helvetica", 6.9)
        canvas.drawString(16 * mm, 7.6 * mm, f"Sole author: {SHORT_AUTHOR} | Technical evidence snapshot: {SNAPSHOT_DATE}")
        canvas.drawRightString(width - 16 * mm, 7.6 * mm, f"Page {doc.page}")
        canvas.restoreState()


Story = list


def para(story: Story, text: str, style: str = "body") -> None:
    story.append(Paragraph(clean(text), S[style]))


def heading(story: Story, text: str, level: int = 1) -> None:
    story.append(Paragraph(clean(text), S[f"h{level}"]))


def bullets(story: Story, items: Iterable[str]) -> None:
    for item in items:
        para(story, f"<b>*</b> {item}", "bullet")
    story.append(Spacer(1, 2 * mm))


def numbered(story: Story, items: Iterable[str]) -> None:
    for index, item in enumerate(items, 1):
        para(story, f"<b>{index}.</b> {item}", "number")
    story.append(Spacer(1, 2 * mm))


def code(story: Story, value: str) -> None:
    escaped = html.escape(clean(textwrap.dedent(value).strip())).replace(" ", "&nbsp;").replace("\n", "<br/>")
    story.append(Paragraph(escaped, S["code"]))


def callout(story: Story, title: str, value: str) -> None:
    para(story, f"<b>{title}</b><br/>{value}", "callout")


def finding(story: Story, fid: str, severity: str, title: str, evidence: str, impact: str, fix: str) -> None:
    color = {"CRITICAL": "#9f2f2f", "HIGH": "#b65d12", "MEDIUM": "#886b15", "LOW": "#21629b", "INFO": "#526057"}.get(severity, "#526057")
    text = (
        f"<font color='{color}'><b>{fid} | {severity}</b></font>  <b>{title}</b><br/>"
        f"<b>Evidence:</b> {evidence}<br/><b>Impact:</b> {impact}<br/><b>Engineering action:</b> {fix}"
    )
    para(story, text, "finding")


def table(
    story: Story,
    headers: Sequence[str],
    rows: Sequence[Sequence[object]],
    widths: Sequence[float] | None = None,
    font_size: float | None = None,
) -> None:
    head = [Paragraph(clean(f"<b>{html.escape(str(h))}</b>"), S["table_head"]) for h in headers]
    body = []
    for row in rows:
        body.append([
            Paragraph(clean(html.escape(str(cell))).replace("\n", "<br/>"), S["table"])
            for cell in row
        ])
    data = [head] + body
    t = LongTable(data, colWidths=widths, repeatRows=1, hAlign="LEFT")
    commands = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.35, RULE),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 3.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5),
    ]
    for idx in range(1, len(data)):
        commands.append(("BACKGROUND", (0, idx), (-1, idx), WHITE if idx % 2 else PALE))
    if font_size:
        commands.append(("FONTSIZE", (0, 1), (-1, -1), font_size))
    t.setStyle(TableStyle(commands))
    story.append(t)
    story.append(Spacer(1, 4 * mm))


def cover(story: Story, volume: str, title: str, subtitle: str, classification: str = "Internal technical record") -> None:
    story.append(Spacer(1, 16 * mm))
    para(story, "AGRIAI 2.0 | FORENSIC SOFTWARE EXAMINATION", "cover_kicker")
    para(story, title, "cover_title")
    para(story, subtitle, "cover_sub")
    story.append(HRFlowable(width="82%", thickness=1.3, color=GREEN, spaceBefore=6, spaceAfter=13))
    for line in [
        f"{volume}",
        f"Prepared and authored solely by {AUTHOR}",
        "Founder, designer and sole creator of AgriAI",
        "Computer Science, University of Ghana",
        f"Repository examined: {REPOSITORY}",
        f"Evidence commit: {SNAPSHOT_COMMIT}",
        f"Examination date: {SNAPSHOT_DATE}",
        f"Classification: {classification}",
    ]:
        para(story, line, "meta")
    story.append(Spacer(1, 9 * mm))
    callout(
        story,
        "Technical basis",
        "This document is grounded in direct source review, route enumeration, dependency audit, secret pattern scanning, strict TypeScript checking, ESLint, production compilation, PostgreSQL integration tests and local HTTP behavior tests. Live third party AI accounts were not available in the examination environment, so provider success is assessed from code paths and contracts rather than a claim of live production availability.",
    )
    story.append(PageBreak())


def closing(story: Story, statement: str) -> None:
    story.append(Spacer(1, 6 * mm))
    story.append(HRFlowable(width="100%", thickness=0.6, color=GREEN, spaceBefore=4, spaceAfter=8))
    heading(story, "Authorship and control statement", 2)
    para(
        story,
        f"This volume was prepared, authored and issued solely under the name of {AUTHOR}. {statement} The repository records identify Thaddeus Tagoe as the founder, sole designer, developer and maintainer of AgriAI.",
    )


def doc00(story: Story) -> None:
    cover(story, "Volume 00", "Complete Forensic Examination", "Executive verdict, evidence boundaries and risk register")
    heading(story, "1. Examination mandate")
    para(story, "The mandate was to explain, at engineering depth, how AgriAI was built, which code makes its AI functions possible, why its APIs return useful responses, how data and authentication work, and where failure or abuse can occur. The analysis treats source code as primary evidence. Product copy is accepted only when the implementation supports it.")
    heading(story, "2. Snapshot identity")
    table(story, ["Property", "Observed value"], [
        ["Repository", REPOSITORY],
        ["Commit", SNAPSHOT_COMMIT],
        ["Application", "agriai version 2.0.0"],
        ["Framework", "Next.js 16.2.10 App Router, React 19.2.4, TypeScript 5"],
        ["Source size", "79 TS, TSX and CJS source files, 8,100 lines"],
        ["HTTP surface", "27 route files exposing 40 method handlers"],
        ["Data engine", "Atomic JSON document plus debounced PostgreSQL JSONB mirror"],
        ["Primary AI", "Google Gemini through @google/genai"],
        ["Fallback AI", "Cloudflare Workers AI Llama, then local knowledge"],
        ["Author of dossier", AUTHOR],
    ], [42 * mm, 130 * mm])
    heading(story, "3. What the system actually is")
    para(story, "AgriAI is a single full-stack Next.js application, not a group of microservices and not a custom machine learning model. React client components collect farmer actions. Next.js route handlers validate requests and keep provider keys on the server. Library modules call Gemini, Cloudflare, Tavily, Wikipedia, DuckDuckGo, OpenWeatherMap, Open-Meteo, ElevenLabs and Unsplash. The same Node.js process owns configuration, chat records, admin sessions, analytics and the local knowledge base.")
    code(story, """
Browser UI
  -> Next.js route handler
     -> validation and configuration
     -> optional search or weather provider
     -> Gemini or Cloudflare AI
     -> local fallback when required
     -> JSON document mutation
     -> debounced PostgreSQL mirror
  <- SSE, JSON, image data URL or MPEG audio
""")
    heading(story, "4. Why the AI appears reliable")
    bullets(story, [
        "The chat path has three answer tiers: Gemini stream, Cloudflare complete response, local Ghana knowledge.",
        "Gemini model selection is itself a waterfall. A preferred admin model is tried first, followed by seven configured model names without duplicates.",
        "Web search is optional. Tavily is primary, while Wikipedia and DuckDuckGo are keyless fallbacks.",
        "Weather has three tiers: OpenWeatherMap, Open-Meteo and deterministic seeded output.",
        "The browser receives Server Sent Events and renders Gemini deltas immediately. Cloudflare and local answers are sent in the final done event.",
        "Provider secrets are resolved server-side through lib/env.ts and are never intentionally embedded into the client bundle.",
    ])
    heading(story, "5. Assurance verdict")
    callout(story, "Verdict", "The architecture is understandable and functional as an offline-safe demonstration. Strict type checking, production compilation and PostgreSQL tests passed. Local smoke testing confirmed the public page, configuration, market prices, weather fallback, local chat SSE, session authentication and protected admin reads. This does not mean the application is production hardened. The critical default credential path, public history object access, absent request throttling and vulnerable dependency snapshot must be resolved before high traffic or sensitive deployment.")
    heading(story, "6. Risk register at one glance")
    table(story, ["ID", "Severity", "Finding", "Primary evidence"], [
        ["F-01", "Critical", "Known fallback admin credentials work when seed env is absent", "lib/db.ts:166-184, local HTTP login test"],
        ["F-02", "High", "Public history read, overwrite and deletion by sessionId", "app/api/history/route.ts:8-69"],
        ["F-03", "High", "No shared rate limits on cost-bearing or public write routes", "chat, vision, generate, TTS, transcribe routes"],
        ["F-04", "High", "Dependency audit reports three high severity packages", "next 16.2.10 dependency tree"],
        ["F-05", "High", "Public health probe can spend Gemini quota and return raw error text", "app/api/health/route.ts:23-37"],
        ["F-06", "High", "Single full-document store risks growth and multi-instance lost updates", "lib/db.ts and lib/pg-store.ts"],
        ["F-07", "Medium", "Editor sessions can access sensitive content and destructive endpoints", "admin route authorization checks"],
        ["F-08", "Medium", "No explicit CSRF token or Origin validation", "all state-changing authenticated routes"],
        ["F-09", "Medium", "Browser security headers are incomplete", "next.config.ts"],
        ["F-10", "Medium", "Search text can inject instructions into the system instruction", "chat route system assembly"],
        ["F-11", "Medium", "TTS marks user-derived audio as publicly cacheable", "app/api/tts/route.ts:55-61"],
        ["F-12", "Medium", "Image and audio content validation trusts MIME and base64 shape", "vision and transcribe routes"],
        ["F-13", "Medium", "Provider configuration is public and health errors aid fingerprinting", "config and health routes"],
        ["F-14", "Medium", "No application encryption, retention job or tamper-evident audit log", "Database schema and admin actions"],
        ["F-15", "Medium", "CSV export does not quote fields or neutralize spreadsheet formulas", "admin/subscribers route"],
        ["F-16", "Low", "X-Powered-By identifies Next.js", "local response headers"],
        ["F-17", "Low", "Automated coverage is concentrated on PostgreSQL storage", "package.json and scripts"],
        ["F-18", "Info", "Seeded product metrics are not backed by evaluation artifacts", "lib/db.ts:79-84"],
    ], [13 * mm, 18 * mm, 78 * mm, 65 * mm])
    heading(story, "7. Scan execution summary")
    table(story, ["Control", "Result", "Meaning"], [
        ["npm ci", "PASS with audit warning", "539 packages installed in the scan environment"],
        ["TypeScript strict", "PASS", "No compiler error under tsc --noEmit"],
        ["ESLint", "PASS with 22 warnings", "No lint error, performance and unused import warnings remain"],
        ["Production build", "PASS with 4 warnings", "35 pages/routes generated, Edge instrumentation warnings remain"],
        ["PostgreSQL test", "14 PASS", "Create, save, load, debounce, health, hydrate and reset paths executed"],
        ["Dependency audit", "3 high", "next, nested postcss and sharp require upgrade"],
        ["Secret pattern scan", "No live key found", "Two deliberate example database URLs were classified as fixtures"],
        ["HTTP smoke tests", "20 behavior checks", "Expected 2xx, 4xx, 5xx, SSE and cookie behavior observed"],
    ], [38 * mm, 35 * mm, 101 * mm])
    heading(story, "8. Evidence limitations")
    bullets(story, [
        "No Google, Cloudflare, Tavily, OpenWeather or ElevenLabs production secret was used. Provider authentication and quota were not independently validated.",
        "No attack was sent to a public production host. Security findings come from static review and a local build.",
        "The checkout history is shallow at the examined commit. The scan proves the state of that commit, not every historical revision.",
        "No agronomic accuracy study, confusion matrix or multilingual human review dataset exists in the checkout.",
        "Generated fallback weather was exercised because outbound Open-Meteo access failed from the isolated test environment.",
    ])
    closing(story, "The verdict, risk register and evidence statements in this volume are the controlling summary for the full ten-volume dossier.")


def doc01(story: Story) -> None:
    cover(story, "Volume 01", "System Architecture and Construction", "How the framework, frontend, backend and deployment units were assembled")
    heading(story, "1. Construction model")
    para(story, "The codebase uses the Next.js App Router as both web framework and application server. There is no Express entry point. A route.ts file under app/api becomes an HTTP endpoint. A page.tsx file becomes a page. Client components use relative URLs, so the same origin receives UI and API traffic. The design keeps browser code independent from vendor hostnames and keeps secret keys in the Node.js runtime.")
    heading(story, "2. Technology bill of materials")
    table(story, ["Layer", "Technology", "Repository role"], [
        ["Framework", "Next.js 16.2.10", "Routing, rendering, route handlers, build and production server"],
        ["View", "React 19.2.4", "Public product, streaming chat and admin single-page shell"],
        ["Language", "TypeScript 5", "Strict types across UI, route handlers and libraries"],
        ["Styling", "Tailwind CSS 4 and PostCSS", "Theme, responsive layout and utility classes"],
        ["Primary AI SDK", "@google/genai 2.16", "Gemini text, streaming, vision, audio transcription and image attempts"],
        ["Fallback AI", "Cloudflare REST", "Llama chat and Flux image generation"],
        ["Persistence", "Node fs and pg", "Atomic local JSON plus PostgreSQL JSONB mirror"],
        ["Authentication", "bcryptjs and random opaque cookies", "Password hashing and server-stored sessions"],
        ["Search", "Tavily, Wikipedia and DuckDuckGo", "Grounding context and source metadata"],
        ["Weather", "OpenWeatherMap and Open-Meteo", "Current conditions and five-day forecasts"],
        ["Voice", "Browser SpeechRecognition, Gemini, ElevenLabs", "Speech input and audio output"],
        ["UI libraries", "Framer Motion, Lucide, Sonner, react-markdown", "Motion, icons, notices and answer rendering"],
    ], [29 * mm, 46 * mm, 99 * mm])
    heading(story, "3. Repository anatomy")
    table(story, ["Path", "Engineering responsibility"], [
        ["app/page.tsx", "Composes the public product sections and sends visit tracking"],
        ["app/layout.tsx", "Global metadata, fonts, providers and application shell"],
        ["app/admin", "Login page and authenticated dashboard host"],
        ["app/api", "27 route files and 40 method handlers"],
        ["components/Chat.tsx", "SSE client, modes, languages, search toggle, microphone, TTS and feedback"],
        ["components/DiseaseDetector.tsx", "Crop photo preview, upload and disease result presentation"],
        ["components/CropStudio.tsx", "Agricultural image prompt and data URL download"],
        ["components/admin", "Dashboard, content, AI, price, knowledge, message, user and settings tabs"],
        ["lib/ai.ts", "Gemini adapters, model waterfall, local answers, disease parser and image generation"],
        ["lib/cloudflare.ts", "Workers AI HTTP adapter"],
        ["lib/search.ts", "Tavily and keyless search adapter"],
        ["lib/db.ts", "Schema seed, in-memory cache, JSON persistence and analytics mutation"],
        ["lib/pg-store.ts", "PostgreSQL connection, table creation and document upsert"],
        ["lib/auth.ts", "bcrypt, rate limit, sessions, cookies and role helpers"],
        ["instrumentation.ts", "Server boot PostgreSQL initialization and conditional hydration"],
        ["render.yaml", "Render web service, PostgreSQL and secret declarations"],
        ["Dockerfile", "Node 22 Alpine build and runtime image"],
    ], [54 * mm, 120 * mm])
    heading(story, "4. Public page assembly")
    para(story, "app/page.tsx renders AnnouncementBar, Nav, Hero, Chat, Features, MarketPrices, WeatherSection, DiseaseDetector, HowItWorks, CropStudio, Testimonials, Founder, FAQ, Newsletter and Footer. SiteProvider in lib/site-context.tsx retrieves /api/config, merges public settings and writes CSS custom properties. Each optional section receives a show flag from settings.showSections. This permits display changes without rebuilding the application.")
    code(story, """
app/layout.tsx
  -> SiteProvider
     -> GET /api/config
     -> applyTheme(primaryColor, deepColor, accentColor)
  -> app/page.tsx
     -> public section components
     -> relative fetch calls to /api/*
""")
    heading(story, "5. Server boundary")
    para(story, "All API route files explicitly use the Node.js runtime. AI and storage routes set maxDuration values of 30 or 60 seconds. Browser requests never require CORS to call AgriAI because they use the same origin. Route handlers import server-only modules such as fs, crypto, pg and provider secret readers. The Next.js build marks every API route as dynamic and the public and admin pages as statically generated shells.")
    heading(story, "6. UI state and data flow")
    bullets(story, [
        "Chat state is local React state. Each browser stores an agriai_session_id in localStorage.",
        "Admin state is tab-local. AdminShell calls /api/admin/me and redirects to login if the cookie is invalid.",
        "Site settings load after the static shell mounts. Defaults in site-context prevent a blank first render.",
        "Disease images remain in browser memory and are posted as base64 JSON. They are not written to a server gallery.",
        "Generated images return as data URLs and the browser creates a temporary download link.",
        "Market and weather components use no-store fetches to avoid stale browser content.",
    ])
    heading(story, "7. Route construction statistics")
    table(story, ["Category", "Route files", "Handlers", "Examples"], [
        ["AI and media", "6", "6", "chat, vision, generate, transcribe, tts, search"],
        ["Public data and forms", "10", "13", "config, weather, prices, history, contact, subscribe"],
        ["Admin and auth", "11", "21", "login, settings, users, knowledge, analytics"],
        ["Total", "27", "40", "All handlers use the App Router route.ts convention"],
    ], [38 * mm, 25 * mm, 24 * mm, 87 * mm])
    heading(story, "8. Build and deployment shape")
    para(story, "render.yaml provisions a Node web service and a PostgreSQL database. npm ci --include=dev and npm run build create the production output. npm start launches next start. DATABASE_URL comes from the managed database. Provider keys and admin seed values are declared sync:false. The Dockerfile offers a three-stage Node 22 Alpine build, copies .next, public, node_modules, package.json and next.config.ts, and starts the same Next.js server.")
    callout(story, "Deployment caveat", "The Render healthCheckPath is the public home page, while /api/health performs a Gemini model call when configured. This avoids vendor spend from platform liveness checks, which is good. The public /api/health route remains callable by anyone and should be changed to a cheap internal readiness check.")
    heading(story, "9. Shared data model")
    para(story, "lib/types.ts defines ChatMessage, ChatRecord, AdminUser, Session, PriceEntry, KnowledgeEntry, FeedbackEntry, Subscriber, ContactEntry, AppSettings, Analytics and Database. This central schema is the contract connecting UI tabs, APIs and persistence. It is compile-time only. Runtime payload validation is handwritten and uneven; there is no Zod, JSON Schema or generated OpenAPI document.")
    heading(story, "10. Dependency and module boundaries")
    bullets(story, [
        "lib/env.ts is the only intended provider-secret resolution layer.",
        "lib/ai.ts may read settings and knowledge through lib/db.ts, so the intelligence layer is state-aware.",
        "app/api/chat/route.ts is the orchestration center and directly coordinates DB, search, Gemini, Cloudflare and language modules.",
        "lib/db.ts imports lib/pg-store.ts for mirror scheduling, while instrumentation imports both for hydration.",
        "Client components import only browser-safe types, language constants and site context. Server provider modules are not imported by client components.",
    ])
    heading(story, "11. Construction conclusion")
    para(story, "The framework succeeds through consolidation. One typed Next.js project owns the screen, HTTP edge, AI adapters and persistence. This reduces deployment complexity and makes the call paths easy to inspect. It also concentrates security, state consistency and scaling risk into one Node process. The design is appropriate for a focused prototype and must evolve before multi-instance national traffic.")
    closing(story, "This architectural reconstruction records how the application is assembled from source and which boundaries hold it together.")


def doc02(story: Story) -> None:
    cover(story, "Volume 02", "AI Functions and Model Orchestration", "Exact prompts, model calls, grounding, fallbacks, vision, speech and image logic")
    heading(story, "1. What makes the AI possible")
    para(story, "AgriAI does not train or ship its own neural network. Intelligence comes from provider APIs plus Ghana-specific orchestration. lib/ai.ts creates a Gemini client, chooses models, sends prompts and content, parses provider output and supplies local answers. app/api/chat/route.ts adds mode, language, conversation history and optional web context. lib/cloudflare.ts supplies a second remote language model. lib/db.ts stores the editable prompt and local knowledge rows.")
    heading(story, "2. Secret and client initialization")
    code(story, """
firstEnv(names):
  for each environment name:
    trim whitespace and surrounding quotes
    reject empty, YOUR_*, CHANGE_ME* and placeholder* values
    return the first accepted value

geminiApiKey aliases:
  GEMINI_API_KEY
  GOOGLE_API_KEY
  GOOGLE_GENERATIVE_AI_API_KEY
  GOOGLE_GENAI_API_KEY
  GOOGLE_GEMINI_API_KEY
""")
    para(story, "getGemini() caches a GoogleGenAI object and the key used to build it. A changed environment value causes client reconstruction. geminiConfigured() checks only whether a recognized value exists. It does not verify the key until a model call is attempted.")
    heading(story, "3. Chat model waterfall")
    table(story, ["Order", "Configured model name", "Role"], [
        ["0", "Admin preferred settings.chat.model", "Inserted first when non-empty"],
        ["1", "gemini-2.5-flash", "Primary seeded chat and vision model"],
        ["2", "gemini-2.5-flash-lite", "Lower-cost Gemini fallback"],
        ["3", "gemini-2.0-flash", "Compatibility fallback"],
        ["4", "gemini-2.0-flash-001", "Pinned compatibility fallback"],
        ["5", "gemini-flash-latest", "Alias fallback"],
        ["6", "gemini-1.5-flash", "Legacy fallback"],
        ["7", "gemini-1.5-flash-latest", "Legacy alias fallback"],
    ], [16 * mm, 63 * mm, 95 * mm])
    para(story, "uniqueModels() removes duplicate names while preserving order. geminiGenerateText() and geminiGenerateStream() catch each model error, log the model and continue. For names matching 2.5, thinkingBudget is set to zero. A non-empty response ends the waterfall. If all models fail, the last error is thrown to the route orchestrator.")
    heading(story, "4. Exact chat request transformation")
    numbered(story, [
        "Parse JSON. Invalid JSON returns HTTP 400.",
        "Trim message and cap it at 2,000 characters. Empty content returns HTTP 400.",
        "Whitelist language as en, tw, ga, ee, ha or fr. Default to en.",
        "Whitelist mode as expert or agent. Any other value becomes standard.",
        "Keep at most 10 client history entries, only user or assistant roles, with 4,000 characters each.",
        "If webSearch is true, search for the farmer message plus the literal suffix Ghana 2026.",
        "Read settings.chat and select systemPrompt, expertPrompt or agentPrompt.",
        "Append languageInstruction and the literal identity You are AgriAI.",
        "If sources exist, append their numbered text into the Gemini system instruction.",
        "Stream Gemini. If no complete answer remains, call Cloudflare. If that fails, call localAnswer.",
        "Persist user and assistant turns, then send the done event.",
    ])
    heading(story, "5. Prompt control plane")
    table(story, ["Mode", "Stored field", "Technical effect"], [
        ["standard", "settings.chat.systemPrompt", "Concise practical Ghana farming assistance"],
        ["expert", "settings.chat.expertPrompt", "Requests agronomic detail, rates, densities, IPM and economics"],
        ["agent", "settings.chat.agentPrompt", "Requests question decomposition, current evidence and structured synthesis"],
    ], [28 * mm, 56 * mm, 90 * mm])
    para(story, "The prompts are mutable at runtime through /api/admin/settings. This is powerful because behavior changes without deployment. It is also a security boundary because any authenticated editor can currently modify chat settings. Prompt version, approval, rollback and audit history are not stored.")
    heading(story, "6. Language steering")
    para(story, "lib/languages.ts maps English, Twi, Ga, Ewe, Hausa and French. The language function appends a text instruction to the model. It is not a translation engine and it does not verify that the answer actually uses the requested language. Vision is weaker: for non-English selections it requests English with a short summary in the farmer language. Local knowledge answers are generally English even when a non-English code is selected.")
    heading(story, "7. Server Sent Events protocol")
    code(story, """
event: delta
data: {"text":"a model text fragment"}

... repeated while Gemini streams ...

event: done
data: {
  "text":"the complete answer",
  "demo":false,
  "sources":[{"title":"...","url":"..."}],
  "searchDemo":false,
  "provider":"gemini"
}
""")
    para(story, "The response headers are text/event-stream, no-cache, no-transform, keep-alive and X-Accel-Buffering:no. Chat.tsx reads bytes, splits frames on blank lines, parses the data JSON and appends delta text. The final done payload replaces the temporary assistant content if it contains text. Cloudflare does not stream in this implementation, so the UI receives its complete text only in done.")
    heading(story, "8. Search grounding")
    para(story, "searchWeb() uses Tavily advanced search with include_answer and six results when TAVILY_API_KEY exists. On no key or failure, keylessSearch() calls English Wikipedia OpenSearch and DuckDuckGo Instant Answer. contextBlock() converts the answer and snippets into numbered plain text. The chat route places this block inside the system instruction and tells the model to cite [1], [2]. Source title and URL metadata also travels to the browser.")
    callout(story, "Grounding limitation", "This is retrieval-augmented prompting without embeddings, ranking, content sanitization or source trust scoring. Search snippets can contain adversarial instructions. A citation marker shows which snippet the model associated with a statement; it does not prove the statement is correct.")
    heading(story, "9. Local knowledge engine")
    para(story, "localAnswer() lowercases the question and scans every database knowledge row. The first row with any keyword contained in the question wins. If no keyword hits, a 12-character question prefix check runs. Seven regular-expression fallback topics follow. The final response is a generic capability card. There is no semantic embedding, BM25 score, stemming, language-specific matching or confidence calculation.")
    code(story, """
localAnswer(question):
  for knowledge row in insertion order:
    if any keyword is a substring of question: return row.answer
    if question contains first 12 chars of stored question: return row.answer
  for curated regular expression answer:
    if expression matches: return answer
  return generic offline help card
""")
    heading(story, "10. Crop disease vision")
    numbered(story, [
        "DiseaseDetector.tsx reads a selected file into a browser data URL.",
        "POST /api/vision accepts image and language. It checks string length from 100 to 4.5 million characters.",
        "detectCropDisease() parses the data URL into mimeType and base64 data.",
        "A prompt demands a strict JSON object with detected, confidence, description and treatment.",
        "The preferred vision model comes from settings.chat.visionModel, followed by the chat model waterfall.",
        "Temperature is 0.2 and max output is 1,024 tokens.",
        "A broad brace regular expression extracts JSON, then the fields are normalized and confidence is clamped from 0 to 100.",
        "Missing key or total failure returns FALLBACK_DISEASE with demo:true.",
    ])
    para(story, "No specialized disease classifier, labeled crop dataset, image preprocessor or calibration model is present. The confidence is generated by Gemini, not statistically calibrated by AgriAI. The seeded 92 percent metric is not supported by a checked-in evaluation suite.")
    heading(story, "11. Image generation")
    para(story, "POST /api/generate caps the prompt at 500 characters and requires a case-insensitive substring from SAFE_SUBJECTS. It adds a photographic suffix. Cloudflare Flux-1-schnell is attempted with four steps. Gemini image models are attempted only if Cloudflare does not return a data URL. Success returns {ok, image, provider}. The image is represented in JSON as base64, which increases payload size and memory use.")
    table(story, ["Priority", "Provider or model", "Output"], [
        ["1", "Cloudflare @cf/black-forest-labs/flux-1-schnell", "PNG data URL"],
        ["2", "gemini-2.5-flash-image", "First inline image part"],
        ["3", "gemini-2.0-flash-preview-image-generation", "First inline image part"],
        ["4", "gemini-2.0-flash-exp-image-generation", "First inline image part"],
    ], [20 * mm, 95 * mm, 59 * mm])
    heading(story, "12. Voice input and output")
    para(story, "Chat.tsx first tries the browser SpeechRecognition interface. If unavailable, MediaRecorder captures an audio blob and posts multipart FormData to /api/transcribe. That route permits up to 25 MB, base64 encodes the complete file and asks Gemini 2.5 Flash to transcribe verbatim. Output speech posts up to 1,500 characters to /api/tts. ElevenLabs eleven_multilingual_v2 returns MPEG audio. English and French use the Rachel voice identifier, while other languages use the default multilingual identifier.")
    heading(story, "13. Provider failure matrix")
    table(story, ["Capability", "Primary", "Fallback", "Last behavior"], [
        ["Chat", "Gemini stream", "Cloudflare Llama", "Local knowledge, HTTP 200 SSE, demo true"],
        ["Search", "Tavily", "Wikipedia and DuckDuckGo", "Empty sources, demo true"],
        ["Vision", "Gemini multimodal", "Other Gemini model names", "Offline disease card, demo true"],
        ["Image", "Cloudflare Flux", "Gemini image models", "HTTP 502 or 503"],
        ["Transcription", "Gemini", "None", "HTTP 501 missing key or 500 failure"],
        ["TTS", "ElevenLabs", "None", "HTTP 501 missing key or 502 failure"],
        ["Weather", "OpenWeatherMap", "Open-Meteo", "Seeded deterministic forecast"],
    ], [27 * mm, 46 * mm, 50 * mm, 51 * mm])
    heading(story, "14. The technical answer to how AI works")
    para(story, "The model is only one stage. AgriAI works because the route constructs a controlled request, attaches Ghana context, attaches language and mode instructions, optionally adds retrieved evidence, feeds recent conversation turns, handles token streaming, catches provider failure, emits a stable client protocol and records the result. The application engineering around the model creates the product experience.")
    closing(story, "This volume is the authoritative technical explanation of every AI-enabled function visible in the examined source snapshot.")


PUBLIC_ROUTES = [
    ["POST", "/api/chat", "Public", "JSON", "SSE delta and done", "2,000 char message, modes, language, history"],
    ["POST", "/api/vision", "Public", "JSON base64 image", "Disease JSON", "100 to 4.5M image string chars"],
    ["POST", "/api/generate", "Public", "JSON prompt", "Image data URL JSON", "500 chars and SAFE_SUBJECTS"],
    ["POST", "/api/transcribe", "Public", "multipart audio", "Text JSON", "File required, max 25 MB"],
    ["POST", "/api/tts", "Public", "JSON", "audio/mpeg", "Text max 1,500, speed 0.5 to 2"],
    ["POST", "/api/search", "Public", "JSON", "Search JSON", "Query max 300"],
    ["GET", "/api/weather", "Public", "city query", "Forecast JSON", "Five known cities, unknown becomes Accra"],
    ["GET", "/api/prices", "Public", "live query", "Price JSON", "live=1 invokes search"],
    ["POST, DELETE", "/api/prices", "Session", "JSON or id query", "Mutation JSON", "Any authenticated role"],
    ["GET, POST, DELETE", "/api/history", "Public", "sessionId and chat", "Chat or mutation JSON", "No ownership proof"],
    ["GET", "/api/config", "Public", "None", "Public settings JSON", "Also returns provider configured flags"],
    ["GET", "/api/health", "Public", "None", "Provider status JSON", "Can call Gemini"],
    ["GET", "/api/images", "Public", "query and count", "Unsplash result JSON", "Query 100, count max 12"],
    ["POST", "/api/feedback", "Public", "JSON", "Mutation JSON", "value up or down"],
    ["POST", "/api/subscribe", "Public", "JSON", "Mutation JSON", "Basic email check"],
    ["POST", "/api/contact", "Public", "JSON", "Mutation JSON", "Name, email, message required"],
    ["POST", "/api/track", "Public", "JSON", "Always ok JSON", "visitorId max 64"],
]

ADMIN_ROUTES = [
    ["POST", "/api/admin/login", "Public", "Credentials to cookie session"],
    ["POST", "/api/admin/logout", "Cookie optional", "Delete server session and clear cookie"],
    ["GET", "/api/admin/me", "Session", "Return public user fields"],
    ["GET", "/api/admin/analytics", "Session", "Aggregate dashboard metrics"],
    ["GET, DELETE", "/api/admin/feedback", "Session", "List or delete feedback"],
    ["GET, POST, DELETE", "/api/admin/knowledge", "Session", "Knowledge CRUD, no separate editor policy"],
    ["GET, DELETE", "/api/admin/messages", "Session", "Read or delete chat records"],
    ["POST", "/api/admin/reset", "Admin role", "Reset the full database after RESET confirmation"],
    ["GET, POST", "/api/admin/settings", "Session", "Read or patch settings, force PostgreSQL sync"],
    ["GET, DELETE", "/api/admin/subscribers", "Session", "List, CSV export or delete"],
    ["GET, POST, PATCH, DELETE", "/api/admin/users", "Admin role", "User lifecycle and password reset"],
]


def doc03(story: Story) -> None:
    cover(story, "Volume 03", "API Contracts and Reliability", "All routes, validation rules, status codes, authentication and response forms")
    heading(story, "1. API implementation rule")
    para(story, "The backend consists entirely of App Router route handlers. There is no generated OpenAPI file, controller framework or shared schema validator. Every route parses and validates its own payload. Public AI and weather routes try to return a usable degraded response. Admin routes call getSessionUser and return JSON errors when the session is absent.")
    heading(story, "2. Public and mixed-access route matrix")
    table(story, ["Method", "Path", "Access", "Input", "Output", "Important validation"], PUBLIC_ROUTES, [21 * mm, 33 * mm, 20 * mm, 29 * mm, 34 * mm, 37 * mm])
    heading(story, "3. Admin route matrix")
    table(story, ["Method", "Path", "Access", "Function"], ADMIN_ROUTES, [32 * mm, 48 * mm, 28 * mm, 66 * mm])
    heading(story, "4. Chat request contract")
    code(story, """
POST /api/chat
Content-Type: application/json
{
  "message": "required text, trimmed and capped to 2000",
  "language": "en | tw | ga | ee | ha | fr",
  "mode": "standard | expert | agent",
  "webSearch": true,
  "history": [{"role":"user|assistant","content":"..."}],
  "sessionId": "browser identifier, first 64 chars"
}
""")
    para(story, "Invalid JSON returns 400 Invalid JSON body. Empty message returns 400 Message is required. Valid requests return HTTP 200 and an SSE stream, even when all remote AI services are unavailable. Provider is gemini, cloudflare or local. demo is true only for the local answer path. Search sources are removed if the route falls all the way to localAnswer.")
    heading(story, "5. Chat reliability semantics")
    bullets(story, [
        "The route performs search before opening the output stream. A slow search delays the first byte.",
        "Gemini deltas are emitted during generation. A model failure clears server fullText and starts the next provider.",
        "Cloudflare returns a complete response, so no delta frames are emitted for that tier.",
        "localAnswer always produces non-empty text from knowledge, curated patterns or a generic card.",
        "Conversation persistence happens before done. persist() catches disk errors, so the answer can still complete even if storage fails.",
        "The client AbortController passes request.signal to Gemini and Cloudflare, but the ReadableStream cancel callback has no additional cleanup.",
    ])
    heading(story, "6. Vision contract")
    code(story, """
POST /api/vision
{"image":"data:image/jpeg;base64,...", "language":"en"}

200:
{
  "detected":"condition name",
  "confidence":0,
  "description":"text",
  "treatment":["step"],
  "demo":false
}
""")
    para(story, "The route returns 400 for a short or non-string image, 413 above the character cap, 500 for unexpected route failure and 200 with demo:true when Gemini is missing or every model fails. The server does not verify decoded bytes, image dimensions or a magic signature.")
    heading(story, "7. Generate contract")
    para(story, "POST /api/generate returns 503 before parsing the body when neither Cloudflare nor Gemini is configured. Invalid JSON returns 400. Empty or non-agricultural prompts return 400. Successful output contains ok:true, image and provider. Failure after configured provider attempts returns 502. The content gate is a substring list and not a complete safety policy.")
    heading(story, "8. Voice contracts")
    table(story, ["Route", "Success", "Expected failures", "Operational note"], [
        ["POST /api/transcribe", "200 {text}", "400 no file, 413 above 25 MB, 501 no Gemini, 500 model failure", "Entire audio buffered and base64 encoded"],
        ["POST /api/tts", "200 audio/mpeg", "400 no text, 501 no ElevenLabs, 502 vendor error, 500 route error", "Response says public max-age=3600"],
    ], [42 * mm, 35 * mm, 58 * mm, 39 * mm])
    heading(story, "9. Weather contract")
    para(story, "GET /api/weather accepts a city name. The map recognizes Accra, Kumasi, Tamale, Takoradi and Cape Coast. Unknown input silently becomes Accra. OpenWeather success returns source openweather and demo:false. Open-Meteo returns source open-meteo and demo:true. Seeded fallback returns source seed and demo:true. Current contains temp, humidity, precip and wind. Daily contains five rows with date, tmax, tmin, precip and wind.")
    heading(story, "10. Price contract")
    para(story, "GET /api/prices is public and can invoke live search with live=1. POST and DELETE are in the same route file but require any valid admin or editor session. POST accepts crop, market, numeric price and unit; date, trend and note are optional. If body.id matches an existing row, the route updates it. The API accepts negative and extremely large numbers because no economic range is checked.")
    heading(story, "11. Configuration exposure")
    para(story, "GET /api/config deliberately returns only selected site settings, but also returns providerStatus booleans and the configured model name. It does not return the secret values. GET /api/health goes further by attempting a Gemini generation and returning a trimmed raw exception message on failure. That route creates an avoidable quota and information-disclosure surface.")
    heading(story, "12. Admin session contract")
    code(story, """
POST /api/admin/login
{"email":"...", "password":"...", "remember":true}

Set-Cookie: agriai_session=<64 hex chars>
  HttpOnly
  SameSite=Lax
  Secure only in production
  Path=/
  Max-Age=7 days when remember, otherwise 8 hours
""")
    para(story, "The server session always expires seven days after creation, even when the browser cookie uses eight hours. The token is 32 random bytes encoded as 64 hex characters and is stored in the Database.sessions array. It is an opaque reference, not a signed claim. Login allows five recorded failures in 15 minutes per in-memory IP key.")
    heading(story, "13. Error response philosophy")
    para(story, "Most routes return JSON {error:string} for validation and upstream failure. Chat differs because its success envelope is SSE. Track intentionally returns {ok:true} even on malformed input. Search catches provider failure and returns keyless results. Weather logs errors and descends its provider chain. Database write failures are logged and swallowed by persist(). This keeps the UI alive but can conceal data loss unless logs and alerts are watched.")
    heading(story, "14. Reliability is not perfection")
    callout(story, "Engineering interpretation", "The API feels reliable because fallback payload shapes are stable. Reliability does not establish agronomic correctness, provider freshness, durability under concurrent instances or safety under hostile traffic. Those properties require quotas, schemas, monitoring, tests and evidence beyond graceful catch blocks.")
    closing(story, "This route inventory and contract analysis is the reference for anyone implementing an AgriAI client or reviewing backend behavior.")


def doc04(story: Story) -> None:
    cover(story, "Volume 04", "Code Path Atlas", "File-by-file execution maps from a farmer click to provider, storage and admin control")
    heading(story, "1. Reading method")
    para(story, "Every path below begins with an observable user action and follows the actual imported functions. File and line references use the examined commit. The diagrams distinguish client state, route orchestration, provider calls and persistence.")
    heading(story, "2. Path A: farmer sends a question")
    code(story, """
components/Chat.tsx:88 sendMessage
  -> POST /api/chat with message, language, mode, webSearch, history, sessionId
app/api/chat/route.ts:32 POST
  -> lib/db.ts trackQuestion and trackMessage
  -> optional lib/search.ts searchWeb and contextBlock
  -> lib/db.ts getDB settings.chat
  -> lib/languages.ts languageInstruction
  -> lib/ai.ts geminiGenerateStream
       -> @google/genai generateContentStream
       -> SSE delta for each chunk
  -> on failure lib/cloudflare.ts cloudflareChat
       -> Cloudflare Workers AI REST Llama
  -> on failure lib/ai.ts localAnswer
       -> db.knowledge then regex answers then generic card
  -> lib/db.ts mutate conversation
       -> atomic data/db.json
       -> lib/pg-store.ts schedulePostgresSave
  -> SSE done
components/Chat.tsx
  -> render Markdown, sources, provider and demo state
""")
    heading(story, "3. Path B: optional live search")
    code(story, """
webSearch=true
  -> searchWeb(message + " Ghana 2026")
     if TAVILY_API_KEY:
       POST api.tavily.com/search, advanced, six results
       on success return answer and sources
     on no key or error:
       GET Wikipedia OpenSearch
       GET DuckDuckGo Instant Answer
  -> contextBlock numbers snippets
  -> append block into the model system instruction
  -> return source title and URL in SSE done
""")
    heading(story, "4. Path C: crop photo diagnosis")
    code(story, """
components/DiseaseDetector.tsx
  -> FileReader data URL
  -> POST /api/vision
app/api/vision/route.ts
  -> type, length and language checks
  -> lib/ai.ts detectCropDisease
     -> parse data URL
     -> get settings.chat.visionModel
     -> Gemini multimodal prompt and inlineData
     -> extract first broad JSON object
     -> clamp confidence, cap treatment to six
     -> fallback demo card on missing key or all failures
  -> JSON response
""")
    heading(story, "5. Path D: agricultural image generation")
    code(story, """
components/CropStudio.tsx
  -> POST /api/generate {prompt}
app/api/generate/route.ts
  -> provider configured check
  -> 500-char cap
  -> SAFE_SUBJECTS substring check
  -> add photographic suffix
  -> lib/cloudflare.ts cloudflareImage
       -> Flux-1-schnell, four steps
  -> if failed lib/ai.ts geminiImage
       -> three image model names in order
  -> JSON image data URL
components/CropStudio.tsx
  -> img preview
  -> anchor download
""")
    heading(story, "6. Path E: voice input")
    code(story, """
components/Chat.tsx microphone
  if SpeechRecognition exists:
    browser converts speech to text
  else:
    getUserMedia -> MediaRecorder -> Blob
    POST /api/transcribe multipart form
    route buffers File -> base64
    lib/ai.ts geminiGenerateText, preferred gemini-2.5-flash
    response text is inserted into chat input
""")
    heading(story, "7. Path F: voice output")
    code(story, """
components/Chat.tsx speak(answer)
  -> POST /api/tts {text, language, speed}
  -> choose fixed ElevenLabs voice ID
  -> POST ElevenLabs text-to-speech
  -> audio/mpeg
  -> browser Blob URL and Audio.play()
""")
    heading(story, "8. Path G: weather")
    code(story, """
components/WeatherSection.tsx
  -> GET /api/weather?city=<selection>
app/api/weather/route.ts
  -> lib/openweather.ts openweatherForecast
       -> current and forecast endpoints in parallel
       -> aggregate 3-hour entries into days
  -> on failure Open-Meteo current and daily
  -> on failure deterministic seedForecast
  -> adviceFor(temp, precip, humidity)
  -> component cards
""")
    heading(story, "9. Path H: admin login")
    code(story, """
app/admin/login/page.tsx
  -> POST /api/admin/login
app/api/admin/login/route.ts
  -> lib/auth.ts clientIp
  -> isRateLimited
  -> findUserByEmail from lib/db.ts
  -> bcrypt compareSync
  -> randomBytes(32) session token
  -> mutate Database.sessions
  -> Set-Cookie agriai_session
components/admin/AdminShell.tsx
  -> GET /api/admin/me
  -> authenticated tabs
""")
    heading(story, "10. Path I: admin changes model behavior")
    code(story, """
components/admin/AITab.tsx
  -> edits model, visionModel, temperature, maxTokens and prompts
  -> components/admin/api.ts
  -> POST /api/admin/settings
  -> getSessionUser accepts admin or editor
  -> merge patch.chat into settings.chat
  -> lib/db.ts mutate and persist
next chat request
  -> reads settings.chat immediately
  -> no rebuild or restart required
""")
    heading(story, "11. Path J: boot and persistence")
    code(story, """
Next.js server boot
  -> instrumentation.ts register
  -> if DATABASE_URL:
       initPostgres creates agriai_state
       hydrateFromPostgres only when data/db.json is absent
         -> SELECT doc WHERE id=1
         -> write local JSON and set in-process cache
first ordinary DB access
  -> getDB -> load data/db.json
  -> if absent or invalid -> defaultDB seed version 4
mutation
  -> callback changes in-process object
  -> write db.json.tmp then rename db.json
  -> schedule full JSONB upsert after 1500ms
""")
    heading(story, "12. Source file roster")
    table(story, ["File", "Role", "Change impact"], [
        ["lib/env.ts", "Provider aliases and status", "All provider configuration"],
        ["lib/ai.ts", "Gemini, vision, image and local knowledge", "Every AI response tier"],
        ["lib/cloudflare.ts", "Llama and Flux REST", "Chat fallback and Studio primary"],
        ["lib/search.ts", "Grounding retrieval", "Citations and current information"],
        ["lib/languages.ts", "Language labels and instructions", "Multilingual steering"],
        ["app/api/chat/route.ts", "Chat orchestration", "Main AI behavior and persistence"],
        ["app/api/vision/route.ts", "Vision HTTP validation", "Disease upload boundary"],
        ["app/api/generate/route.ts", "Image subject gate", "Studio safety and provider order"],
        ["app/api/transcribe/route.ts", "Audio ingestion", "Server speech input"],
        ["app/api/tts/route.ts", "ElevenLabs output", "Speech privacy and voice mapping"],
        ["components/Chat.tsx", "Farmer conversation UI", "SSE, voice, feedback and control state"],
        ["components/DiseaseDetector.tsx", "Photo UI", "Image preprocessing and diagnosis display"],
        ["components/CropStudio.tsx", "Image UI", "Prompt and download workflow"],
        ["lib/db.ts", "State and seed", "All settings, records, users and analytics"],
        ["lib/pg-store.ts", "Durability mirror", "PostgreSQL consistency"],
        ["lib/auth.ts", "Identity", "Admin access and session security"],
        ["lib/types.ts", "Compile-time schema", "Cross-module shape changes"],
        ["instrumentation.ts", "Boot hydration", "Restart recovery"],
        ["next.config.ts", "Headers and development origins", "Browser hardening"],
        ["render.yaml", "Managed production topology", "Secrets, database and deployment"],
    ], [54 * mm, 65 * mm, 55 * mm])
    heading(story, "13. Change impact map")
    table(story, ["Desired change", "Primary files", "Mandatory regression checks"], [
        ["Add an AI provider", "lib/provider adapter, chat route, env.ts", "Fallback order, abort, attribution, empty output"],
        ["Add a language", "languages.ts, chat and vision whitelist, TTS mapping", "Prompt steering, UI label, audio, local fallback"],
        ["Change persistence", "db.ts, pg-store.ts, instrumentation.ts", "Atomicity, concurrency, hydration, sessions"],
        ["Change admin role", "auth.ts and every admin route", "Server authorization, hidden tabs, destructive operations"],
        ["Change chat SSE", "chat route and Chat.tsx", "Frame parsing, partial text, abort and final replacement"],
        ["Change disease schema", "ai.ts, vision route, DiseaseDetector.tsx", "JSON parser, confidence and treatments"],
    ], [45 * mm, 63 * mm, 66 * mm])
    closing(story, "This atlas makes the complete execution path traceable from user action to the exact implementation unit.")


def doc05(story: Story) -> None:
    cover(story, "Volume 05", "Security Threat Model and Findings", "Trust boundaries, abuse paths, evidence, impact and concrete remediation")
    heading(story, "1. Security model")
    para(story, "The protected assets are provider quota, admin control, session tokens, chat content, contact and subscriber data, database integrity and agronomic trust. Untrusted actors include anonymous browsers, automated bots, compromised editor accounts, hostile search content and failed or malicious upstream providers. The core trust boundaries are browser to Next.js, Next.js to vendors, Next.js to disk or PostgreSQL, and admin cookie to privileged routes.")
    heading(story, "2. Trust boundary diagram")
    code(story, """
UNTRUSTED INTERNET
  farmer browser, bot, hostile page, hostile search content
        |
        v
NEXT.JS HTTP EDGE
  public routes | admin routes | session cookie validation
        |
        +-> PROVIDERS: Gemini, Cloudflare, Tavily, weather, TTS, images
        |
        +-> STATE: in-memory document -> db.json -> PostgreSQL JSONB
        |
        +-> ADMIN UI: settings, prompts, users, chats, PII, reset
""")
    heading(story, "3. Positive controls observed")
    bullets(story, [
        "Provider keys are read from server environment variables and obvious placeholders are rejected.",
        "Passwords use bcrypt with cost 10. Public user serialization removes passwordHash.",
        "Session tokens use crypto.randomBytes(32). Cookies are HttpOnly, SameSite=Lax and Secure in production.",
        "Login failure text does not reveal whether the email exists.",
        "User management and full database reset require the admin role.",
        "Chat, vision, transcription, TTS, search and content forms apply basic length caps.",
        "Outbound provider hosts are fixed by code. No general URL fetch endpoint exists.",
        "Disk writes use temp-file rename, reducing partial local file corruption.",
        "Markdown does not enable raw HTML plugins, reducing direct model-output XSS exposure.",
        "No live provider secret was found by the tracked-file pattern and entropy scan.",
    ])
    heading(story, "4. Detailed findings")
    finding(story, "F-01", "CRITICAL", "Known fallback admin credential", "lib/db.ts:166-184 uses admin@agriai.gh and AgriAI@2026Admin when env values are absent. A local production build accepted these credentials and issued an admin cookie.", "A deployment that starts without a strong ADMIN_PASSWORD can be fully taken over. The attacker can read chats and subscribers, change prompts, create users and reset the database.", "Remove the password fallback. Fail startup when ADMIN_PASSWORD is missing, placeholder-like or weak. Add a one-time bootstrap command and force rotation. Invalidate all sessions after password changes.")
    finding(story, "F-02", "HIGH", "Public chat history object access", "app/api/history/route.ts exposes GET, POST and DELETE without authentication or ownership proof. A caller who knows sessionId can read, replace or delete that conversation.", "Chat content can be disclosed or destroyed. A malicious client can inject records into the admin message view. Client IDs use Date.now plus Math.random rather than cryptographic capability tokens.", "Delete the unused route or bind history to an HttpOnly signed browser token. Use a server-generated random record identifier, ownership check and per-action authorization. Reject arbitrary POST replacement.")
    finding(story, "F-03", "HIGH", "No rate limit for paid AI and public writes", "Chat, vision, generate, transcribe, TTS, health, search, contact, feedback, subscribe, track and history have no shared quota. Only admin login has an in-memory failure limit.", "Bots can consume provider quota, hold 60-second workers, grow the document and increase disk or PostgreSQL write load. This can become denial of wallet and denial of service.", "Apply edge limits by IP and anonymous device token. Add strict route-specific burst, sustained and body-size rules. Require authentication or proof-of-work for the expensive image and audio functions. Enforce vendor budgets.")
    finding(story, "F-04", "HIGH", "Known vulnerable dependency snapshot", "npm audit on 18 August 2026 reports high severity exposure through direct next 16.2.10 and transitive postcss and sharp. It recommends next 16.3.1.", "Impact depends on enabled framework features, but the installed framework is inside multiple published vulnerable ranges. Leaving it unpatched increases avoidable framework-level risk.", "Upgrade Next.js and lockfile to a patched release, rerun build and route tests, then audit again. Track GitHub advisories and use automated dependency update pull requests.")
    finding(story, "F-05", "HIGH", "Public health route spends quota and returns errors", "GET /api/health calls Gemini generateContent whenever a key is configured and returns up to 220 characters of thrown error text. The route has no authentication or cache.", "Repeated probes can consume model quota and reveal provider project or request details in error messages.", "Make liveness local and constant time. Put provider checks behind admin authorization, cache results for several minutes, redact all vendor text and enforce a strict rate limit.")
    finding(story, "F-06", "HIGH", "Full-document growth and multi-instance lost updates", "All records share one mutable object and one PostgreSQL row. Each process writes the full JSON document. No distributed lock, revision check or transaction prevents two instances from overwriting one another.", "Concurrent instances can lose chats, sessions or settings. Anonymous writes can grow serialization cost and JSONB row size until latency and memory become unsafe.", "Move high-growth entities into normalized tables. Use transactions, primary keys, optimistic revisions and bounded retention. Keep settings separate from chats, sessions, analytics events and PII.")
    finding(story, "F-07", "MEDIUM", "Editor authorization is broader than labels imply", "Most admin endpoints check only getSessionUser. Editors can read chats, feedback and subscribers, delete those records, change AI prompts and site settings, edit prices and force PostgreSQL sync. Only users and reset enforce role=admin.", "A compromised lower-privilege editor reaches PII and destructive operations. UI tab hiding is not an authorization control.", "Create a permission matrix and central requireRole helper. Limit editors to explicit content actions. Restrict PII, prompt control, deletes, sync and exports to admin or dedicated roles.")
    finding(story, "F-08", "MEDIUM", "No explicit CSRF validation", "State-changing admin routes rely on SameSite=Lax cookies but do not validate Origin, Referer or a CSRF token.", "SameSite reduces common cross-site form attacks but does not replace explicit request provenance, especially under same-site subdomain compromise or browser edge cases.", "Validate Origin against the canonical host and add a per-session CSRF token for mutation requests. Keep SameSite and Secure flags as defense in depth.")
    finding(story, "F-09", "MEDIUM", "Incomplete browser hardening headers", "next.config.ts sets nosniff and Referrer-Policy only. Local responses had no CSP, frame-ancestors, Permissions-Policy or HSTS and exposed X-Powered-By.", "The admin surface is less protected against clickjacking and future XSS. Browser capabilities are not constrained.", "Add a nonce-based Content-Security-Policy, frame-ancestors 'none', Permissions-Policy, HSTS at the TLS edge and poweredByHeader:false. Inventory required font and vendor origins first.")
    finding(story, "F-10", "MEDIUM", "Search prompt injection", "Tavily, Wikipedia and DuckDuckGo text is concatenated into the model system instruction as CURRENT WEB SEARCH RESULTS. No sanitization, trust label or instruction-isolation protocol is applied.", "A hostile page snippet can direct the model to ignore policy, produce unsafe agronomic advice or misrepresent citations.", "Treat retrieved content as quoted data. Delimit it in a lower-trust user context, strip instruction-like markup, use an allowlist of agronomic sources where possible and verify critical recommendations.")
    finding(story, "F-11", "MEDIUM", "User-derived TTS is marked public cacheable", "app/api/tts/route.ts returns Cache-Control: public, max-age=3600 for text that may contain a farmer's private answer.", "A shared intermediary could cache sensitive audio. POST caching is uncommon but the directive is needlessly permissive.", "Return Cache-Control: private, no-store. Avoid logging text. Add an explicit privacy statement and short processing retention at the vendor.")
    finding(story, "F-12", "MEDIUM", "Weak media authenticity validation", "Vision trusts a supplied data URL MIME and approximate character length. Transcription trusts File.type and does not set a minimum size or inspect a file signature.", "Malformed payloads can waste CPU and provider quota. Incorrect MIME labels create unpredictable upstream parsing.", "Decode with strict base64 validation, inspect magic bytes, allow known formats, cap decoded bytes and dimensions or duration, and reject polyglot or empty files.")
    finding(story, "F-13", "MEDIUM", "Provider fingerprinting", "/api/config returns provider configured flags and model name. /api/health returns more detailed status and raw provider errors.", "Attackers learn which expensive endpoints are active and which fallback path to target.", "Remove provider state from public config. Return only feature availability needed by the UI. Keep detailed diagnostics in authenticated admin telemetry.")
    finding(story, "F-14", "MEDIUM", "PII lifecycle and audit gaps", "Chats, subscriber names and emails, contact messages, session IPs and user agents reside in plaintext application state and PostgreSQL JSONB. No retention worker or tamper-evident admin audit trail exists.", "A storage leak exposes personal content. Admin deletions or prompt changes cannot be attributed or reconstructed.", "Define retention by record type, minimize IP and user-agent storage, encrypt backups, isolate roles and create append-only audit events with actor, action, target, before hash and after hash.")
    finding(story, "F-15", "MEDIUM", "Unsafe CSV construction", "The subscriber export joins email, name and timestamp with commas without CSV quoting or spreadsheet formula neutralization.", "Names containing commas break columns. Values beginning with =, +, - or @ can become formulas when opened in spreadsheet software.", "Use a tested CSV encoder, quote every field, prefix formula-leading values and set a safe content disposition. Add export tests with adversarial names.")
    finding(story, "F-16", "LOW", "Framework fingerprint header", "The local production response includes X-Powered-By: Next.js.", "This gives automated scanners a fast framework hint. It is minor because client assets already reveal framework traits.", "Set poweredByHeader:false in next.config.ts.")
    finding(story, "F-17", "LOW", "Limited automated security and route tests", "The only dedicated repository test script exercises PostgreSQL state. No checked-in tests cover auth, RBAC, history ownership, payload caps, SSE framing or fallback safety.", "Regressions in sensitive route behavior can pass build and type checks.", "Add unit, route integration and end-to-end suites. Make tests mandatory in CI and fail on lint errors, high audit findings and changed API contracts.")
    finding(story, "F-18", "INFO", "Unverified product metrics", "lib/db.ts seeds 12,400+ farmers, 92 percent disease accuracy and 35 percent loss reduction. No measurement dataset or evaluation report is present.", "Technical readers may confuse display copy with validated model or impact evidence.", "Label these values as targets or provide dated measurement methodology, sample size, confusion matrix, baselines and independent review.")
    heading(story, "5. STRIDE coverage")
    table(story, ["Threat", "Observed example", "Strongest next control"], [
        ["Spoofing", "Default admin login and stolen opaque session", "No fallback credential, rotation, MFA"],
        ["Tampering", "Public history overwrite and editor prompt change", "Ownership and permission matrix, audit log"],
        ["Repudiation", "No actor trail for settings and deletes", "Append-only signed audit events"],
        ["Information disclosure", "History IDOR, public health errors, PII document", "Authorization, redaction, retention"],
        ["Denial of service", "Unthrottled model calls and full document growth", "Edge limits, queue, normalized tables"],
        ["Elevation of privilege", "Broad editor capabilities", "Central server-side RBAC"],
    ], [32 * mm, 76 * mm, 66 * mm])
    heading(story, "6. Security priority")
    numbered(story, [
        "Block default admin access and rotate any deployed credential and session.",
        "Remove or secure /api/history.",
        "Upgrade Next.js and rerun the complete validation matrix.",
        "Place rate limits and body limits in front of every paid or write-heavy route.",
        "Make /api/health cheap and private.",
        "Separate persistent entities and add retention before scaling.",
        "Implement server-side RBAC, CSRF controls and security headers.",
    ])
    closing(story, "This threat model is intentionally candid so that Thaddeus Tagoe can defend the system he created before production exposure grows.")


def doc06(story: Story) -> None:
    cover(story, "Volume 06", "Sequence and State Diagrams", "Technical posters for request order, failure branches, identity and persistence")
    heading(story, "1. Main chat, Gemini success")
    code(story, """
Farmer       Chat.tsx       /api/chat       search       Gemini       db
  |              |               |             |             |          |
  | type/send    |               |             |             |          |
  |------------->| POST JSON     |             |             |          |
  |              |-------------->| validate    |             |          |
  |              |               | track q/msg |             |--------->|
  |              |               | search if enabled-------->|          |
  |              |               |<--sources---|             |          |
  |              |               | build system and history  |          |
  |              |               |-------------------------->|          |
  |              |<--SSE delta---|<---------chunks-----------|          |
  |<--render-----|               |             |             |          |
  |              |               | persist user and answer------------>|
  |              |<--SSE done----|             |             |          |
""")
    heading(story, "2. Main chat, complete fallback")
    code(story, """
/api/chat
  -> Gemini configured?
     yes -> try preferred model and remaining model names
            any non-empty stream -> provider=gemini
            all fail -> continue
  -> Cloudflare configured?
     yes -> POST Llama messages
            non-empty response -> provider=cloudflare
            fail -> continue
  -> localAnswer
     -> first knowledge keyword match
     -> first curated regular expression
     -> generic card
     -> provider=local, demo=true, sources=[]
  -> persist
  -> SSE done
""")
    heading(story, "3. Search grounding")
    code(story, """
/api/chat -> searchWeb
  if TAVILY_API_KEY:
    -> Tavily advanced search
    if HTTP and JSON valid:
      <- answer and up to six sources, demo=false
    else:
      -> keylessSearch
  else:
    -> keylessSearch
       -> Wikipedia OpenSearch
       -> DuckDuckGo Instant Answer
       <- combined sources, demo=(no sources)
/api/chat -> contextBlock -> system instruction -> model
""")
    heading(story, "4. Disease vision")
    code(story, """
Photo -> DiseaseDetector -> data URL -> /api/vision
  -> string and size validation
  -> detectCropDisease
     if no Gemini client:
       <- FALLBACK_DISEASE, demo=true
     else:
       for preferred vision model plus model waterfall:
         -> prompt + inlineData
         <- model text
         -> extract {...}
         -> JSON.parse
         success -> normalized result, demo=false
       all fail -> failure demo card
  <- JSON result -> confidence and treatment UI
""")
    heading(story, "5. Image Studio")
    code(story, """
Prompt -> /api/generate
  -> configured provider exists? no -> 503
  -> parse and cap prompt
  -> agriculture substring found? no -> 400
  -> append photography instruction
  -> Cloudflare configured? yes -> Flux
       success -> 200 PNG data URL
       failure -> continue
  -> Gemini configured? yes -> image model loop
       success -> 200 image data URL
       failure -> continue
  -> 502
""")
    heading(story, "6. Authentication state machine")
    code(story, """
NO SESSION
  POST login
    rate limited -> 429
    malformed -> 400
    invalid -> record failed attempt -> 401
    valid -> create random token -> ACTIVE

ACTIVE
  cookie + server Database.sessions row
  expired or missing row -> NO SESSION
  logout -> remove row and clear cookie -> NO SESSION
  remembered browser cookie -> up to seven days
  non-remembered browser cookie -> eight hours
  server row -> always seven days
""")
    heading(story, "7. Admin settings mutation")
    code(story, """
Admin or editor -> POST /api/admin/settings
  -> getSessionUser
  -> allowed top-level key loop
  -> shallow merge showSections or chat
  -> cap top-level strings
  -> settings.updatedAt = now
  -> mutate
     -> local atomic write
     -> schedule PostgreSQL save
  <- current settings

Next chat request reads new prompt and model immediately.
""")
    heading(story, "8. Persistence state")
    code(story, """
                    +----------------------+
                    | in-process Database  |
                    +----------+-----------+
                               | mutate callback
                               v
                    +----------------------+
                    | data/db.json.tmp     |
                    +----------+-----------+
                               | rename
                               v
                    +----------------------+
                    | data/db.json         |
                    +----------+-----------+
                               | 1500ms debounce
                               v
                    +----------------------+
                    | agriai_state id=1    |
                    | doc JSONB            |
                    +----------------------+

Boot hydration runs from PostgreSQL only if data/db.json is absent.
""")
    heading(story, "9. Weather state")
    code(story, """
GET /api/weather
  -> city map or Accra default
  -> OpenWeather current + forecast in parallel
     success -> source=openweather, demo=false
     failure -> Open-Meteo current + daily
       success -> source=open-meteo, demo=true
       failure -> deterministic seedForecast
         -> source=seed, demo=true
  -> adviceFor current conditions
""")
    heading(story, "10. Attack sequence: public history")
    code(story, """
Attacker obtains or guesses sessionId
  -> GET /api/history?sessionId=...
  <- full matching chat, no ownership check
  -> POST /api/history with replacement messages
  <- existing chat overwritten
  -> DELETE /api/history?sessionId=...
  <- chat removed

Required fix: server-bound ownership token or route removal.
""")
    heading(story, "11. Attack sequence: denial of wallet")
    code(story, """
Bot loop
  -> POST /api/generate, /api/vision, /api/transcribe, /api/tts
  -> GET /api/health
  -> POST /api/chat with webSearch=true
No shared rate limiter
  -> concurrent vendor calls
  -> quota and compute consumed
  -> chat and analytics writes grow full document
""")
    heading(story, "12. One-page provider ladder")
    table(story, ["Function", "Tier 1", "Tier 2", "Tier 3"], [
        ["Chat", "Gemini model waterfall", "Cloudflare Llama", "Local knowledge"],
        ["Search", "Tavily", "Wikipedia", "DuckDuckGo or empty"],
        ["Vision", "Preferred Gemini", "Other Gemini names", "Demo card"],
        ["Studio", "Cloudflare Flux", "Gemini images", "HTTP error"],
        ["Weather", "OpenWeather", "Open-Meteo", "Seed data"],
        ["Speech input", "Browser recognition", "Gemini audio", "Typed input"],
        ["Speech output", "ElevenLabs", "None", "Disabled/error"],
        ["State", "Memory", "Atomic JSON", "PostgreSQL mirror"],
    ], [38 * mm, 48 * mm, 46 * mm, 42 * mm])
    closing(story, "These diagrams can be used as implementation posters, onboarding material and incident tracing aids.")


def doc07(story: Story) -> None:
    cover(story, "Volume 07", "Data, Authentication and Admin Internals", "Schema, seed, durability, cookies, roles and runtime control plane")
    heading(story, "1. Database document schema")
    table(story, ["Collection or field", "Stored content", "Security or scale note"], [
        ["version", "Seed schema version, currently 4", "No migration framework beyond seed/load behavior"],
        ["settings", "Brand, sections, model, prompts, stats, contact", "Runtime AI control plane"],
        ["users", "Name, email, bcrypt hash, role, timestamps", "Admin and editor identities"],
        ["sessions", "Raw token, email, times, IP, user agent", "Bearer-equivalent session material"],
        ["chats", "sessionId, title, mode, language, full messages", "Unbounded farmer content"],
        ["feedback", "chat and message references, value, comment", "Publicly appendable"],
        ["prices", "Crop, market, price, unit, date, trend", "Public read, session write"],
        ["knowledge", "Question, answer, category, keyword list", "Directly changes local AI answers"],
        ["subscribers", "Email, optional name and time", "PII and CSV export"],
        ["contacts", "Name, email, subject, message, read flag", "PII, no admin route visible in this snapshot"],
        ["analytics", "Visits, questions and counters", "Can grow, public track input"],
        ["meta", "Seed timestamp", "Used as price updatedAt even after price edits"],
    ], [38 * mm, 75 * mm, 61 * mm])
    heading(story, "2. Seed behavior")
    para(story, "defaultDB() reads ADMIN_EMAIL, ADMIN_PASSWORD and ADMIN_NAME. If absent, it uses a known email, known password and generic name. It creates one bcrypt hash, 12 price rows, eight knowledge rows, empty record collections and default settings. resetDB() clears the cache, deletes db.json and immediately seeds again. If env remains absent, reset reintroduces the same known credential.")
    heading(story, "3. Local persistence algorithm")
    code(story, """
persist(db):
  mkdir data recursively
  write JSON.stringify(db, null, 2) to db.json.tmp
  rename db.json.tmp to db.json
  schedulePostgresSave(db)
  on any local error: log and return
""")
    para(story, "The temp rename gives atomic file replacement on the same filesystem. It does not provide a transaction across local disk and PostgreSQL. The in-process cache is the live object, and mutate() invokes the caller callback directly before persist(). There is no schema validation after reading JSON. A parse or read error causes a fresh seed and can mask recoverable corruption.")
    heading(story, "4. PostgreSQL mirror")
    para(story, "lib/pg-store.ts creates a single table named agriai_state with integer primary key, JSONB doc and updated_at. Every save upserts id=1. schedulePostgresSave stores a pending document reference and waits 1,500 milliseconds. This reduces write frequency but means PostgreSQL is an asynchronous mirror, not the primary transaction coordinator.")
    code(story, """
CREATE TABLE agriai_state (
  id INTEGER PRIMARY KEY,
  doc JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
)

INSERT id=1, doc=$1::jsonb
ON CONFLICT(id) DO UPDATE
  SET doc=EXCLUDED.doc, updated_at=now()
""")
    heading(story, "5. Hydration")
    numbered(story, [
        "instrumentation.register checks DATABASE_URL.",
        "initPostgres creates the table.",
        "hydrateFromPostgres checks whether local data/db.json exists.",
        "If local data exists, PostgreSQL is not loaded.",
        "If local data is absent, postgresLoad retrieves id=1.",
        "A loaded document is assigned to cache and persisted locally again.",
    ])
    callout(story, "Consistency consequence", "In a multi-instance deployment, each instance can hold a separate full document and each may overwrite id=1. Debounce and local files do not coordinate processes. A stale local file also wins over a newer PostgreSQL document at boot.")
    heading(story, "6. Passwords and sessions")
    table(story, ["Control", "Implementation", "Assessment"], [
        ["Password hash", "bcrypt sync, cost 10", "Reasonable prototype baseline, blocks plaintext storage"],
        ["Session token", "32 random bytes, hex", "Strong entropy"],
        ["Server storage", "Database.sessions raw token", "DB disclosure permits session replay"],
        ["Cookie", "HttpOnly, SameSite=Lax, Secure in production", "Good base flags, no explicit Domain"],
        ["Remember", "Seven-day cookie", "Matches seven-day server row"],
        ["No remember", "Eight-hour cookie", "Server row remains seven days"],
        ["Refresh", "lastLogin update at most once per minute", "Causes writes during admin use"],
        ["Logout", "Remove matching token and expire cookie", "Correct direct invalidation"],
    ], [36 * mm, 72 * mm, 66 * mm])
    heading(story, "7. Login rate limiter")
    para(story, "The limiter is a process-local Map keyed by the first x-forwarded-for value or x-real-ip. Five failures inside 15 minutes block further attempts. A successful login clears the IP entry. Old entries are pruned only when the map exceeds 5,000 keys. The control does not work consistently across multiple processes and relies on trusted proxy header sanitation.")
    heading(story, "8. Effective authorization matrix")
    table(story, ["Capability", "Anonymous", "Editor", "Admin"], [
        ["Read public product", "Yes", "Yes", "Yes"],
        ["Use AI and media", "Yes", "Yes", "Yes"],
        ["Read chats and analytics", "No", "Yes", "Yes"],
        ["Read and export subscribers", "No", "Yes", "Yes"],
        ["Change prompts and model", "No", "Yes", "Yes"],
        ["Change content, appearance, knowledge and prices", "No", "Yes", "Yes"],
        ["Delete chats, feedback and subscribers", "No", "Yes", "Yes"],
        ["Force PostgreSQL sync", "No", "Yes", "Yes"],
        ["Manage users", "No", "No", "Yes"],
        ["Reset full database", "No", "No", "Yes"],
    ], [70 * mm, 31 * mm, 35 * mm, 35 * mm])
    heading(story, "9. Admin UI and server enforcement")
    para(story, "AdminShell hides Users and Settings tabs from editors. The server protects user management and reset by role. The settings API itself remains available to editors, including action:sync and the AI prompt fields. This demonstrates why UI hiding and server authorization must be reviewed separately. An editor can call a route directly even if a tab is hidden.")
    heading(story, "10. Analytics mutations")
    bullets(story, [
        "trackVisit groups by ISO date and counts unique visits only by an in-process Set, so a restart can count the same visitor as unique again.",
        "trackQuestion normalizes whitespace and stores the first 160 characters. It sorts by count and keeps 200 rows.",
        "trackMessage increments before generation. totalMessages can diverge from the actual persisted chat messages if generation is aborted.",
        "trackChat is called inside a mutate callback, and trackChat itself calls mutate. JavaScript permits this synchronous nesting, causing an extra full persist while the outer mutation is active.",
        "Admin analytics wisely derives totalMessages and totalChats from chats instead of trusting all counters.",
    ])
    heading(story, "11. Data lifecycle recommendations")
    table(story, ["Entity", "Recommended storage", "Retention and control"], [
        ["settings and prompts", "Versioned settings table", "Permanent versions with approval and rollback"],
        ["users", "Users table", "Permanent while active, MFA and password history policy"],
        ["sessions", "Hashed token session table or Redis", "Short expiry, revoke on password and role changes"],
        ["chats", "Chat and message tables", "Consent-based retention, default 90 days or less"],
        ["analytics", "Append-only bounded events or aggregate table", "Minimize identifiers and expire raw events"],
        ["subscribers and contacts", "PII table with field protection", "Purpose-based retention and deletion requests"],
        ["audit", "Append-only audit table", "Restricted access and tamper evidence"],
    ], [38 * mm, 64 * mm, 72 * mm])
    closing(story, "This volume explains the state engine and the exact authority behind every administrative action.")


SMOKE_ROWS = [
    ["GET /", "200", "HTML shell, 96,191 bytes"],
    ["GET /api/config", "200", "Public settings and provider flags"],
    ["GET /api/health", "200", "All providers unconfigured in test environment"],
    ["GET /api/weather?city=accra", "200", "Seed fallback after provider network failure"],
    ["GET /api/prices", "200", "Twelve seeded rows"],
    ["GET /api/images", "200", "Empty demo image result without key"],
    ["POST /api/chat malformed", "400", "Invalid JSON body"],
    ["POST /api/chat empty", "400", "Message is required"],
    ["POST /api/chat valid", "200", "SSE done with local knowledge"],
    ["GET /api/history known id", "200", "Full chat returned without auth"],
    ["GET /api/admin/me no cookie", "401", "Unauthorized"],
    ["GET /api/admin/settings no cookie", "401", "Unauthorized"],
    ["POST /api/generate no key", "503", "Configuration error"],
    ["POST /api/vision invalid", "400", "Valid image required"],
    ["POST /api/transcribe no key", "501", "Gemini missing"],
    ["POST /api/tts no key", "501", "ElevenLabs missing"],
    ["POST /api/admin/login fallback", "200", "Known fallback credential issued cookie"],
    ["GET /api/admin/me cookie", "200", "Admin identity returned"],
    ["GET /api/admin/analytics cookie", "200", "Authenticated metrics returned"],
    ["POST /api/admin/logout", "200", "Session removed"],
]


def doc08(story: Story) -> None:
    cover(story, "Volume 08", "Verification Evidence and Reproduction", "Commands, results, route observations, dependency evidence and source fingerprints")
    heading(story, "1. Reproducible examination workflow")
    code(story, """
npm ci
npm run typecheck
npm run lint
npm run test:pg
npm audit --json
npm run build
npm run start -- --hostname 0.0.0.0 --port 3000
curl local route matrix
tracked-file secret pattern and entropy scan
source SHA-256 calculation
""")
    heading(story, "2. Build and code quality results")
    table(story, ["Command", "Observed result", "Forensic interpretation"], [
        ["npm ci", "539 packages added, 540 audited by install", "Lockfile resolved and install completed"],
        ["npm run typecheck", "Exit 0", "Strict TypeScript check passed"],
        ["npm run lint", "Exit 0, 22 warnings, 0 errors", "Build-quality warnings remain but lint does not fail"],
        ["npm run test:pg", "14 pass, 0 fail", "Document mirror and hydration test suite passed"],
        ["npm run build", "Exit 0, 35 route/page entries", "Production output compiled"],
        ["Build diagnostics", "4 Edge instrumentation warnings", "fs, path, crypto and cwd are included in Edge analysis"],
    ], [40 * mm, 52 * mm, 82 * mm])
    heading(story, "3. Lint warning classes")
    table(story, ["Class", "Count or examples", "Impact"], [
        ["React set state in effect", "Chat, CountUp, MarketPrices, Weather, admin tabs, SiteProvider", "Possible cascading render and maintainability cost"],
        ["Unused imports or variables", "DiseaseDetector Upload, Nav X, Newsletter settings and others", "Low direct risk, code cleanliness"],
        ["Unoptimized img", "DiseaseDetector", "Performance and image optimization warning"],
        ["Font loading", "app/layout.tsx", "Next lint convention warning"],
    ], [46 * mm, 79 * mm, 49 * mm])
    heading(story, "4. Production route manifest")
    para(story, "The production build marked /, /admin and /admin/login as static pages. It marked all 27 /api route files as dynamic. The build also generated icon.png, robots.txt and sitemap.xml. This confirms that backend code is compiled as route handlers and not shipped as a separate service.")
    heading(story, "5. Local HTTP smoke evidence")
    table(story, ["Request", "Status", "Observed response"], SMOKE_ROWS, [75 * mm, 20 * mm, 79 * mm])
    heading(story, "6. Response header evidence")
    code(story, """
HTTP/1.1 200 OK
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
X-Powered-By: Next.js
Cache-Control: s-maxage=31536000
Content-Type: text/html; charset=utf-8
""")
    para(story, "The header test confirms the two configured hardening headers and the framework fingerprint. It also confirms that CSP, frame restrictions and Permissions-Policy were absent in the local production response.")
    heading(story, "7. Dependency audit snapshot")
    table(story, ["Package", "Severity", "Relationship", "Observed remediation"], [
        ["next 16.2.10", "High", "Direct", "Audit recommends next 16.3.1"],
        ["postcss <= 8.5.22", "High", "Transitive under next", "Resolved through Next upgrade"],
        ["sharp < 0.35.0", "High", "Transitive under next", "Resolved through Next upgrade"],
    ], [44 * mm, 26 * mm, 45 * mm, 59 * mm])
    para(story, "The audit listed framework advisories involving proxy bypass, Server Action denial of service, SSRF conditions, cache confusion, image optimization and internal endpoint disclosure. Applicability varies because this source has no custom rewrite, no proxy file and no obvious Server Action declaration. A patched direct dependency remains the correct control.")
    heading(story, "8. Secret scan result")
    bullets(story, [
        "No Google API key pattern, GitHub token, AWS access key, OpenAI key or PEM private key was found in tracked text.",
        "Two database URLs matched credential syntax. One is the obvious .env.example placeholder. One is the local pg-mem test fixture. Neither is a live production secret.",
        "High-entropy candidates were generated forensic PDF filenames, not credentials.",
        "The scan cannot detect secrets that are encrypted, fragmented, stored only in Git history beyond the shallow checkout or held outside tracked files.",
    ])
    heading(story, "9. Key source fingerprints")
    hash_paths = [
        "package.json", "package-lock.json", "next.config.ts", "render.yaml", "Dockerfile",
        "app/api/chat/route.ts", "app/api/vision/route.ts", "app/api/generate/route.ts",
        "app/api/transcribe/route.ts", "app/api/tts/route.ts", "app/api/history/route.ts",
        "app/api/health/route.ts", "app/api/admin/login/route.ts", "app/api/admin/settings/route.ts",
        "lib/ai.ts", "lib/cloudflare.ts", "lib/search.ts", "lib/env.ts", "lib/db.ts",
        "lib/pg-store.ts", "lib/auth.ts", "lib/types.ts", "components/Chat.tsx",
    ]
    table(story, ["File", "SHA-256 at examined source state"], [[p, source_hash(p)] for p in hash_paths], [66 * mm, 108 * mm])
    heading(story, "10. PostgreSQL test coverage")
    bullets(story, [
        "DATABASE_URL configuration detection.",
        "Table initialization.",
        "Version 4 seed and Studio section.",
        "Sole-founder footer and prompt attribution.",
        "Seed admin identity.",
        "Forced JSONB upsert and load.",
        "Seed version preservation.",
        "Debounced save.",
        "Health report.",
        "Hydration that recreates a missing local file.",
        "Database reset and reseed.",
    ])
    heading(story, "11. Missing test evidence")
    bullets(story, [
        "No provider-key integration test was run or found in the repository.",
        "No test proves multilingual output quality or disease classification accuracy.",
        "No load, race, memory or multi-instance consistency test exists.",
        "No browser end-to-end test covers chat streaming, microphone, Studio or admin tabs.",
        "No automated security test covers default credentials, IDOR, CSRF, RBAC or rate limits.",
    ])
    heading(story, "12. Reproduction discipline")
    callout(story, "Repeatability", "Run all commands against the exact commit and preserve npm audit JSON with the examination date because advisory data changes over time. Provider tests should use dedicated low-quota test projects, never production keys. Clean the ignored data/db.json fixture after behavior tests.")
    closing(story, "The command results and source fingerprints in this volume establish a repeatable evidence trail for the dossier.")


def doc09(story: Story) -> None:
    cover(story, "Volume 09", "Remediation and Production Operations", "A technical plan to move from resilient prototype to controlled production service")
    heading(story, "1. Remediation principle")
    para(story, "Do not remove graceful degradation. Preserve the provider ladders while adding identity, quotas, schemas, data isolation and evidence. Reliability and security must be designed together. A blocked abusive request should be cheap, and a provider failure should remain understandable to the farmer.")
    heading(story, "2. P0 actions before public deployment")
    table(story, ["Order", "Action", "Acceptance test"], [
        ["P0.1", "Delete known password fallback and fail secure at startup", "Boot without ADMIN_PASSWORD fails before listening; known password never authenticates"],
        ["P0.2", "Remove or authorize /api/history", "A second browser cannot read, write or delete a chat by identifier"],
        ["P0.3", "Upgrade Next.js and lockfile", "npm audit has no high or critical finding and all tests pass"],
        ["P0.4", "Edge limits on all AI, media, health and write routes", "Burst tests return 429 before a provider call"],
        ["P0.5", "Make provider health private and cached", "Anonymous health never calls Gemini and never returns provider text"],
    ], [18 * mm, 79 * mm, 77 * mm])
    heading(story, "3. Secure bootstrap pattern")
    code(story, """
At process start:
  require ADMIN_EMAIL
  require ADMIN_PASSWORD length >= 16
  reject known, placeholder and breached values
  if users table is empty:
    create first admin once
  else:
    ignore seed password

On password change:
  update bcrypt hash
  revoke every session for that user
  write audit event
""")
    heading(story, "4. Rate limit design")
    table(story, ["Route group", "Suggested starting control", "Additional budget"], [
        ["chat", "10/min/device, 30/hour/IP", "Max concurrent 2, daily token ceiling"],
        ["vision", "3/min/device, 20/day/IP", "Decoded byte and image dimension limits"],
        ["generate", "1/min/device, 10/day/account", "Queue and provider cost ceiling"],
        ["transcribe", "2/min/device, 30/day", "Duration and decoded byte limits"],
        ["tts", "5/min/device, 100/day", "Character budget, private no-store"],
        ["search and live prices", "10/min/IP", "Cache normalized query results"],
        ["contact, subscribe, feedback", "5/hour/IP", "CAPTCHA or proof after threshold"],
        ["health", "Platform allowlist", "No model call in liveness"],
    ], [47 * mm, 66 * mm, 61 * mm])
    para(story, "Use a shared edge or Redis-backed limiter, not an in-process Map. Derive client IP only from a trusted platform header. Return Retry-After. Record a low-cardinality rejection metric without retaining unnecessary personal data.")
    heading(story, "5. History ownership design")
    code(story, """
Option A, simplest:
  delete /api/history because Chat.tsx does not use it

Option B, retained browser history:
  server creates random history token
  token stored in HttpOnly SameSite cookie
  database stores hash(token), not raw token
  every GET, POST and DELETE verifies hash ownership
  POST accepts append-only typed messages, not arbitrary record replacement
  rotate token and apply retention
""")
    heading(story, "6. Runtime validation")
    para(story, "Adopt one schema library for every route. Define string lengths, numeric bounds, enums, arrays and discriminated response types once. Reject unknown nested settings fields. Validate settings.chat.temperature from 0 to 2, maxTokens to a safe provider range, model against an approved list, and prompts to an audited size. Validate decoded media rather than only encoded text length.")
    heading(story, "7. Browser hardening")
    code(story, """
Recommended response policy outline:
  Content-Security-Policy with per-request nonce
  frame-ancestors 'none'
  object-src 'none'
  base-uri 'self'
  form-action 'self'
  connect-src 'self' plus only required browser origins
  Permissions-Policy: microphone=(self), camera=(), geolocation=()
  Strict-Transport-Security at HTTPS edge
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  poweredByHeader: false
""")
    heading(story, "8. Prompt and agronomic safety")
    bullets(story, [
        "Version every system prompt and record who approved it.",
        "Keep retrieved web content outside the highest-trust instruction layer.",
        "Allowlist trusted Ghana agriculture, MoFA, COCOBOD and research domains for high-risk advice.",
        "Require a human-confirmation warning for pesticide, fertilizer, veterinary, financial and emergency recommendations.",
        "Build test sets for English, Twi, Ga, Ewe, Hausa and French with human reviewers.",
        "Measure disease sensitivity, specificity, calibration and not-a-plant rejection by crop and image condition.",
        "Never present model-generated confidence as measured accuracy without calibration evidence.",
    ])
    heading(story, "9. Persistence redesign")
    table(story, ["Current", "Target", "Migration approach"], [
        ["One JSONB document", "Normalized settings, users, sessions, chats, messages and PII tables", "Dual write, verify counts, cut reads, remove mirror"],
        ["Raw session token", "Hashed token with indexed expiry", "Invalidate current sessions during migration"],
        ["Full object save", "Row-level transactions", "Repository methods per entity"],
        ["No revision", "updated_at and optimistic version", "Reject stale admin writes"],
        ["No retention", "Scheduled deletion and aggregation", "Policy by entity with audit receipts"],
        ["No audit table", "Append-only admin_events", "Record actor, request, target and hashes"],
    ], [48 * mm, 68 * mm, 58 * mm])
    heading(story, "10. Role policy")
    table(story, ["Role", "Allow", "Deny by default"], [
        ["viewer", "Read aggregate analytics", "PII, settings, exports and mutation"],
        ["content editor", "Public copy, approved knowledge drafts and prices", "Users, sessions, chats, subscribers, prompt activation, deletes"],
        ["agronomist", "Review knowledge and prompt versions", "User admin, infrastructure and raw PII"],
        ["administrator", "Users, role assignment, approved settings and operations", "Direct secret reads"],
        ["owner", "Critical reset, key rotation and policy", "No silent action, require reauthentication and audit"],
    ], [35 * mm, 72 * mm, 67 * mm])
    heading(story, "11. Observability")
    bullets(story, [
        "Assign a request ID at the edge and include it in provider and persistence logs.",
        "Measure request count, latency, status, provider, fallback tier, token or byte use and 429 rate.",
        "Never log provider keys, passwords, raw cookies, full chat text or media.",
        "Alert on login failure spikes, owner actions, AI spend threshold, high fallback rate, DB flush failure and document growth.",
        "Use synthetic checks for local liveness, authenticated readiness and provider checks at controlled intervals.",
    ])
    heading(story, "12. CI gate")
    code(story, """
npm ci
npm run typecheck
npm run lint -- --max-warnings=0
npm run test:unit
npm run test:api
npm run test:e2e
npm run build
npm audit --audit-level=high
secret scan
software bill of materials generation
container image scan
""")
    heading(story, "13. Required route tests")
    bullets(story, [
        "Default credentials rejected and startup fails secure.",
        "Session expiry, logout, rotation, role changes and password reset revoke access.",
        "Editor cannot call every denied server endpoint directly.",
        "CSRF origin and token controls reject cross-site mutation.",
        "History ownership prevents cross-browser access.",
        "Rate limits stop provider calls and return Retry-After.",
        "SSE handles model success, partial failure, Cloudflare fallback, local fallback and abort.",
        "Malformed media and oversized decoded content are rejected before provider calls.",
        "Database writes remain correct under concurrent instances and retryable provider latency.",
    ])
    heading(story, "14. Deployment checklist")
    numbered(story, [
        "Use a unique secret store and rotate any key ever exposed to logs or local files.",
        "Verify patched dependency and immutable lockfile.",
        "Set production admin bootstrap through a one-time procedure.",
        "Enable shared rate limits and provider budget alerts.",
        "Run migrations and encrypted backup restore test.",
        "Apply CSP, HSTS, frame and permissions policy.",
        "Run API, browser, load and security tests against staging.",
        "Verify Ghana language and agronomy review sign-off.",
        "Document incident owner, key rotation, session revocation and rollback.",
        "Deploy gradually and watch provider, fallback, error and cost metrics.",
    ])
    heading(story, "15. Final engineering position")
    para(story, "AgriAI already has a strong resilience idea: every important farmer path should end with an understandable result. Production maturity requires the same discipline for hostile input, identity, concurrency, privacy and evidence. The remediation plan keeps the core experience while converting implicit assumptions into enforced controls.")
    closing(story, "This plan gives Thaddeus Tagoe a direct implementation order for securing and scaling the system he created.")


DOCS: list[tuple[str, str, str, Callable[[Story], None]]] = [
    ("00_Thaddeus_Tagoe_AgriAI_Complete_Forensic_Examination.pdf", "Volume 00", "AgriAI Complete Forensic Examination", doc00),
    ("01_Thaddeus_Tagoe_AgriAI_System_Architecture_and_Construction.pdf", "Volume 01", "AgriAI System Architecture and Construction", doc01),
    ("02_Thaddeus_Tagoe_AgriAI_AI_Functions_and_Model_Orchestration.pdf", "Volume 02", "AgriAI AI Functions and Model Orchestration", doc02),
    ("03_Thaddeus_Tagoe_AgriAI_API_Contracts_and_Reliability.pdf", "Volume 03", "AgriAI API Contracts and Reliability", doc03),
    ("04_Thaddeus_Tagoe_AgriAI_Code_Path_Atlas.pdf", "Volume 04", "AgriAI Code Path Atlas", doc04),
    ("05_Thaddeus_Tagoe_AgriAI_Security_Threat_Model_and_Findings.pdf", "Volume 05", "AgriAI Security Threat Model and Findings", doc05),
    ("06_Thaddeus_Tagoe_AgriAI_Sequence_and_State_Diagrams.pdf", "Volume 06", "AgriAI Sequence and State Diagrams", doc06),
    ("07_Thaddeus_Tagoe_AgriAI_Data_Authentication_and_Admin_Internals.pdf", "Volume 07", "AgriAI Data Authentication and Admin Internals", doc07),
    ("08_Thaddeus_Tagoe_AgriAI_Verification_Evidence_and_Reproduction.pdf", "Volume 08", "AgriAI Verification Evidence and Reproduction", doc08),
    ("09_Thaddeus_Tagoe_AgriAI_Remediation_and_Production_Operations.pdf", "Volume 09", "AgriAI Remediation and Production Operations", doc09),
]


def build_one(filename: str, volume: str, title: str, builder: Callable[[Story], None]) -> Path:
    path = OUT / filename
    story: Story = []
    builder(story)
    doc = ForensicDocTemplate(str(path), title=title, volume=volume)
    doc.build(story)
    return path


def validate_pdf(path: Path) -> tuple[int, int]:
    from pypdf import PdfReader

    reader = PdfReader(str(path))
    if reader.metadata:
        author = str(reader.metadata.get("/Author", ""))
        creator = str(reader.metadata.get("/Creator", ""))
        if AUTHOR not in author or AUTHOR not in creator:
            raise RuntimeError(f"Authorship metadata invalid in {path.name}")
    text = "\n".join(page.extract_text() or "" for page in reader.pages)
    for bad in FORBIDDEN_DASHES:
        if bad in text:
            raise RuntimeError(f"Forbidden dash U+{ord(bad):04X} found in {path.name}")
    if "Arena.ai" in text or "generated by ai" in text.lower():
        raise RuntimeError(f"Unwanted generator attribution found in {path.name}")
    if len(text) < 2500:
        raise RuntimeError(f"Insufficient extractable technical text in {path.name}")
    return len(reader.pages), len(text)


def build_zip(paths: Sequence[Path]) -> None:
    if ZIP_PATH.exists():
        ZIP_PATH.unlink()
    with zipfile.ZipFile(ZIP_PATH, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for path in paths:
            archive.write(path, arcname=path.name)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob("*.pdf"):
        old.unlink()
    old_zip = ROOT / "AgriAI_Forensic_Technical_Pack_Thaddeus_Tagoe.zip"
    if old_zip.exists() and old_zip != ZIP_PATH:
        old_zip.unlink()

    built = []
    total_pages = 0
    total_text = 0
    for filename, volume, title, builder in DOCS:
        path = build_one(filename, volume, title, builder)
        pages, chars = validate_pdf(path)
        built.append(path)
        total_pages += pages
        total_text += chars
        print(f"validated {path.name}: {pages} pages, {chars} text chars")

    build_zip(built)
    print(f"wrote {ZIP_PATH.name}: {len(built)} PDFs, {total_pages} pages, {total_text} text chars")


if __name__ == "__main__":
    main()
