// ─── POST /api/chat — AgriAI conversation engine ─────────────────────────────
// Supports: standard / expert / agent modes, web search grounding with
// citations, multilingual replies, chat persistence, and graceful offline
// fallback so the product never breaks. Powered by Google Gemini.

import { NextRequest, NextResponse } from "next/server";
import {
  getDB,
  mutate,
  trackChat,
  trackMessage,
  trackQuestion,
  uid,
} from "@/lib/db";
import { searchWeb, contextBlock } from "@/lib/search";
import { geminiConfigured, geminiGenerateStream, localAnswer } from "@/lib/ai";
import { cloudflareChat, cloudflareConfigured } from "@/lib/cloudflare";
import { languageInstruction } from "@/lib/languages";

export const runtime = "nodejs";
export const maxDuration = 60;

interface ChatBody {
  message?: string;
  language?: string;
  mode?: "standard" | "expert" | "agent";
  webSearch?: boolean;
  history?: { role: "user" | "assistant"; content: string }[];
  sessionId?: string;
}

export async function POST(request: NextRequest) {
  let body: ChatBody = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const message = (body.message || "").trim().slice(0, 2000);
  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const language = /^(en|tw|ga|ee|ha|fr)$/.test(body.language || "") ? body.language! : "en";
  const mode: "standard" | "expert" | "agent" =
    body.mode === "expert" || body.mode === "agent" ? body.mode : "standard";
  const webSearch = Boolean(body.webSearch);
  const sessionId = (body.sessionId || `anon_${Date.now().toString(36)}`).slice(0, 64);
  const history = Array.isArray(body.history)
    ? body.history
        .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
        .slice(-10)
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content.slice(0, 4000) }))
    : [];

  // ── Analytics ──
  trackQuestion(message);
  trackMessage();

  // ── Web search grounding ──
  let webContext: { text: string; sources: { title: string; url: string }[] } | undefined;
  let searchDemo = false;
  if (webSearch) {
    const res = await searchWeb(`${message} Ghana 2026`);
    searchDemo = res.demo;
    if (res.sources.length > 0) {
      webContext = { text: contextBlock(res), sources: res.sources };
    }
  }

  const db = getDB();
  const settings = db.settings;
  const chatCfg = settings.chat;

  const systemBase =
    mode === "expert" ? chatCfg.expertPrompt : mode === "agent" ? chatCfg.agentPrompt : chatCfg.systemPrompt;
  let system = `${systemBase}\n\n${languageInstruction(language)}\nYou are AgriAI.`;
  if (webContext) {
    system += `\n\nCURRENT WEB SEARCH RESULTS (cite with [1], [2]…):\n${webContext.text}`;
  }

  // ── Generate (streaming with graceful fallback) ──
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      let fullText = "";
      let demo = false;
      let provider = "local"; // "gemini" | "cloudflare" | "local"
      let sources = webContext?.sources || [];

      if (geminiConfigured()) {
        try {
          const contents = [
            ...history.slice(-8).map((m) => ({
              role: (m.role === "assistant" ? "model" : "user") as "user" | "model",
              parts: [{ text: m.content }],
            })),
            { role: "user" as const, parts: [{ text: message }] },
          ];

          const result = await geminiGenerateStream({
            model: chatCfg.model,
            contents,
            systemInstruction: system,
            temperature: chatCfg.temperature,
            maxOutputTokens: chatCfg.maxTokens,
            signal: request.signal,
            onDelta: (delta) => send("delta", { text: delta }),
          });
          fullText = result.text;
          if (!fullText.trim()) throw new Error("empty stream");
          provider = "gemini";
        } catch (err) {
          console.error("[chat] Gemini stream failed, trying Cloudflare:", (err as Error).message);
          fullText = "";
        }
      }

      // 2) Cloudflare Workers AI fallback (Llama 3.3 70B)
      if (!fullText && cloudflareConfigured()) {
        try {
          const cfMessages = [
            { role: "system" as const, content: system },
            ...history.slice(-8).map((m) => ({
              role: (m.role === "assistant" ? "assistant" : "user") as "user" | "assistant",
              content: m.content,
            })),
            { role: "user" as const, content: message },
          ];
          fullText = await cloudflareChat(cfMessages, {
            maxTokens: chatCfg.maxTokens,
            temperature: chatCfg.temperature,
            signal: request.signal,
          });
          provider = "cloudflare";
        } catch (err) {
          console.error("[chat] Cloudflare fallback failed:", (err as Error).message);
          fullText = "";
        }
      }

      // 3) Local knowledge base — the product never breaks
      if (!fullText) {
        fullText = localAnswer(message, language, mode);
        demo = true;
        provider = "local";
        sources = [];
      }

      // ── Persist the conversation ──
      const ts = Date.now();
      const assistantMsg = {
        id: uid("msg"),
        role: "assistant" as const,
        content: fullText,
        language,
        mode,
        sources: sources.length ? sources : undefined,
        ts,
        demo,
      };
      mutate((d) => {
        const existing = d.chats.find((c) => c.sessionId === sessionId);
        if (existing) {
          existing.messages.push(
            {
              id: uid("msg"),
              role: "user",
              content: message,
              language,
              mode,
              ts: ts - 1,
            },
            assistantMsg
          );
          existing.updatedAt = ts;
        } else {
          d.chats.push({
            id: uid("cht"),
            sessionId,
            title: message.slice(0, 70),
            language,
            mode,
            messages: [
              {
                id: uid("msg"),
                role: "user",
                content: message,
                language,
                mode,
                ts: ts - 1,
              },
              assistantMsg,
            ],
            createdAt: ts,
            updatedAt: ts,
          });
          trackChat();
        }
      });

      send("done", { text: fullText, demo, sources, searchDemo, provider });
      controller.close();
    },
    cancel() {
      // client disconnected — nothing to clean up
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
