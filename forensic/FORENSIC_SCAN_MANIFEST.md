# AgriAI 2.0 Forensic Scan Manifest
**Sole creator: Thaddeus Nii Teiko Tagoe**

Date: 18 August 2026  
Branch: arena/01a0159e-agriai-v2  
Commit: 9914572  
Root: /home/user/agriai-v2  

## What was scanned
- Full repository walk: app, lib, components, instrumentation.ts, next.config.ts, render.yaml, Dockerfile, package.json
- AI brain files: lib/ai.ts (309 lines), lib/cloudflare.ts, lib/search.ts, lib/env.ts, lib/languages.ts, lib/openweather.ts
- API routes: 20+ handlers under app/api and app/api/admin
- UI surfaces: components/Chat.tsx 560 lines, DiseaseDetector, CropStudio, WeatherSection, MarketPrices, etc.
- Data engine: lib/db.ts 334 lines, lib/pg-store.ts, instrumentation.ts
- Security: lib/auth.ts bcrypt plus cookie sessions

## Artefacts produced
- forensic/pdfs/01_AgriAI_Framework_and_Construction.pdf (7 pages)
- forensic/pdfs/02_AgriAI_How_the_AI_Functions.pdf (7 pages)
- forensic/pdfs/03_AgriAI_API_Reliability_and_Contracts.pdf (7 pages)
- forensic/pdfs/04_AgriAI_Code_Path_Atlas.pdf (6 pages)
- forensic/pdfs/05_AgriAI_Security_Threat_Model.pdf (5 pages)
- forensic/pdfs/06_AgriAI_Sequence_Poster_Pack.pdf (6 pages)
- AgriAI_Forensic_Technical_Pack_Thaddeus_Tagoe.zip (98 KB, contains all 6 PDFs with prefix forensic/pdfs/)

## Forensic properties
- No em dash character (U+2014) in any PDF text or in generator script
- All PDFs list Thaddeus Nii Teiko Tagoe as sole creator on cover, header, footer, and metadata
- PDF metadata author: Thaddeus Nii Teiko Tagoe, creator: Thaddeus Tagoe, sole creator of AgriAI
- All claims are verified against live code, not marketing copy
- ZIP SHA256 (first 16): see build log per PDF

## How AI functions (one line)
Gemini 2.5 Flash waterfall (7 models, thinkingBudget 0) streams via SSE, falls to Cloudflare Llama 3.3 70B, then to localAnswer knowledge base; vision via detectCropDisease STRICT JSON temp 0.2; transcribe via Gemini audio; TTS via ElevenLabs; grounding via Tavily plus Wikipedia plus DuckDuckGo; all orchestrated in app/api/chat/route.ts.

## How API is perfect
Every route validates early, slices and whitelists, never throws uncaught to the farmer, degrades to demo or cached payload, streams with correct SSE headers, respects request.signal abort, persists via mutate, and mirrors to Postgres. See Volume III for curl proofs and contract tables.

