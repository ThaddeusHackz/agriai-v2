// ─── POST /api/chat — AgriAI conversation engine ─────────────────────────────
// Supports: standard / expert / agent modes, web search grounding with
// citations, multilingual replies, chat persistence, and graceful offline
// fallback so the product never breaks.

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
import { getGroq, localAnswer } from "@/lib/ai";
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
      let sources = webContext?.sources || [];

      const client = getGroq();
      if (client) {
        try {
          const completion = await client.chat.completions.create(
            {
              model: chatCfg.model,
              temperature: chatCfg.temperature,
              max_tokens: chatCfg.maxTokens,
              stream: true,
              messages: [
                { role: "system", content: system },
                ...history.slice(-8).map((m) => ({ role: m.role, content: m.content })),
                { role: "user", content: message },
              ],
            },
            { signal: request.signal }
          );
          for await (const chunk of completion) {
            const delta = chunk.choices[0]?.delta?.content || "";
            if (delta) {
              fullText += delta;
              send("delta", { text: delta });
            }
          }
          if (!fullText.trim()) throw new Error("empty stream");
        } catch (err) {
          console.error("[chat] stream failed, falling back:", (err as Error).message);
          fullText = localAnswer(message, language, mode);
          demo = true;
          sources = [];
        }
      } else {
        fullText = localAnswer(message, language, mode);
        demo = true;
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

      send("done", { text: fullText, demo, sources, searchDemo });
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
