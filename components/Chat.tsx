"use client";

// ─── AgriAI Assistant — Perplexity-style chat ────────────────────────────────
// Streaming answers (SSE), web search with citations, voice input (browser +
// Whisper), voice output (ElevenLabs), multilingual, expert & agent modes,
// feedback, history persistence, offline-safe.

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Send, Mic, MicOff, Square, Globe, Brain, FlaskConical,
  Volume2, VolumeX, ThumbsUp, ThumbsDown, Leaf, Search, Loader2, Plus,
} from "lucide-react";
import { toast } from "sonner";
import Markdown from "./Markdown";
import { useSite } from "@/lib/site-context";
import { LANGUAGES } from "@/lib/languages";

interface Source {
  title: string;
  url: string;
}

interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  demo?: boolean;
  provider?: "gemini" | "cloudflare" | "local";
  feedback?: "up" | "down";
}

const WELCOME: Msg = {
  id: "welcome",
  role: "assistant",
  content:
    "Hello! I'm **AgriAI** 🌱 — your intelligent farming assistant for Ghana.\n\nAsk me about planting seasons, crop diseases, fertilizer, market prices, weather — in English, Twi, Ga, Ewe, Hausa or French.",
};

function sessionId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("agriai_session_id");
  if (!id) {
    id = `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem("agriai_session_id", id);
  }
  return id;
}

export default function Chat() {
  const { settings } = useSite();
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [language, setLanguage] = useState("en");
  const [mode, setMode] = useState<"standard" | "expert" | "agent">(settings.chat.defaultMode);
  const [webSearch, setWebSearch] = useState(settings.chat.webSearchDefault);
  const [recording, setRecording] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [showSources, setShowSources] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sidRef = useRef<string>("");

  // init session id + restore past conversation (persistent memory)
  useEffect(() => {
    sidRef.current = sessionId();
    fetch(`/api/history?sessionId=${encodeURIComponent(sidRef.current)}`)
      .then((r) => r.json())
      .then((data) => {
        const msgs = data?.chat?.messages;
        if (!Array.isArray(msgs) || msgs.length === 0) return;
        const restored: Msg[] = msgs
          .filter(
            (m: { role?: string; content?: string }) =>
              m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string"
          )
          .map(
            (m: {
              id?: string;
              role: string;
              content: string;
              sources?: Source[];
              demo?: boolean;
              provider?: Msg["provider"];
              feedback?: "up" | "down";
            }) => ({
              id: m.id || `m_${Math.random().toString(36).slice(2)}`,
              role: m.role as "user" | "assistant",
              content: m.content,
              sources: m.sources,
              demo: m.demo,
              provider: m.provider,
              feedback: m.feedback,
            })
          );
        if (restored.length) setMessages([WELCOME, ...restored]);
      })
      .catch(() => {
        /* history restore is best-effort */
      });
  }, []);

  useEffect(() => {
    setMode(settings.chat.defaultMode);
    setWebSearch(settings.chat.webSearchDefault);
  }, [settings.chat.defaultMode, settings.chat.webSearchDefault]);

  // autoscroll
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  const quickPrompts = settings.chat.quickPrompts?.length
    ? settings.chat.quickPrompts
    : ["Best time to plant maize in Ghana", "How to treat cassava mosaic disease", "Current cocoa price in Kumasi"];

  // ── Send / stream ──
  const sendMessage = useCallback(
    async (text?: string) => {
      const content = (text ?? input).trim();
      if (!content || busy) return;

      const userMsg: Msg = { id: `u_${Date.now()}`, role: "user", content };
      const aiMsg: Msg = { id: `a_${Date.now()}`, role: "assistant", content: "" };
      setMessages((prev) => [...prev, userMsg, aiMsg]);
      setInput("");
      setBusy(true);
      setStreaming(true);

      const history = [...messages.filter((m) => m.role === "user" || m.role === "assistant"), userMsg]
        .slice(-8)
        .map((m) => ({ role: m.role, content: m.content }));

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content,
            language,
            mode,
            webSearch,
            history,
            sessionId: sidRef.current,
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error(`chat failed ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let doneEvent: { text: string; demo?: boolean; sources?: Source[]; provider?: Msg["provider"] } | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const block of lines) {
            const evLine = block.split("\n").find((l) => l.startsWith("event: "));
            const dataLine = block.split("\n").find((l) => l.startsWith("data: "));
            if (!dataLine) continue;
            const event = evLine ? evLine.slice(7).trim() : "message";
            try {
              const data = JSON.parse(dataLine.slice(6));
              if (event === "delta" && typeof data.text === "string") {
                setMessages((prev) =>
                  prev.map((m) => (m.id === aiMsg.id ? { ...m, content: m.content + data.text } : m))
                );
              } else if (event === "done") {
                doneEvent = data;
              }
            } catch {
              // ignore malformed frames
            }
          }
        }

        // finalize
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsg.id
              ? {
                  ...m,
                  content: doneEvent?.text || m.content,
                  sources: doneEvent?.sources?.length ? doneEvent.sources : undefined,
                  demo: doneEvent?.demo || undefined,
                  provider: doneEvent?.provider,
                }
              : m
          )
        );

        if (doneEvent?.demo) {
          toast.info("Offline demo response — connect API keys for live AI answers", { duration: 4000 });
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsg.id && !m.content
                ? { ...m, content: "_Stopped._ Ask me anything else about your farm! 🌱" }
                : m
            )
          );
        } else {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsg.id
                ? {
                    ...m,
                    content:
                      "Sorry, I couldn't reach the server. Check your connection and try again.",
                  }
                : m
            )
          );
          toast.error("Connection failed");
        }
      } finally {
        setBusy(false);
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [input, busy, messages, language, mode, webSearch]
  );

  const stop = () => abortRef.current?.abort();

  const startNewChat = () => {
    const old = sidRef.current;
    abortRef.current?.abort();
    localStorage.removeItem("agriai_session_id");
    sidRef.current = sessionId();
    setMessages([WELCOME]);
    setBusy(false);
    setStreaming(false);
    if (old) {
      fetch(`/api/history?sessionId=${encodeURIComponent(old)}`, { method: "DELETE" }).catch(() => {});
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Voice input ──
  const startWhisper = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        const fd = new FormData();
        fd.append("audio", blob, "voice.webm");
        try {
          toast.loading("Transcribing…", { id: "whisper" });
          const res = await fetch("/api/transcribe", { method: "POST", body: fd });
          const data = await res.json();
          toast.dismiss("whisper");
          if (data.text) {
            setInput((prev) => (prev ? prev + " " : "") + data.text);
          } else {
            toast.error(data.error || "Transcription failed");
          }
        } catch {
          toast.dismiss("whisper");
          toast.error("Transcription failed");
        }
      };
      recorder.start();
      setRecording(true);
      setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
        setRecording(false);
      }, 8000);
    } catch {
      toast.error("Microphone access denied");
      setRecording(false);
    }
  };

  const toggleVoice = () => {
    if (recording) {
      setRecording(false);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as unknown as { webkitSpeechRecognition?: new () => any };
    if (w.webkitSpeechRecognition) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rec: any = new w.webkitSpeechRecognition();
      rec.lang = LANGUAGES.find((l) => l.code === language)?.speechHint || "en-GH";
      rec.interimResults = false;
      setRecording(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rec.onresult = (e: any) => {
        setInput((prev) => (prev ? prev + " " : "") + e.results[0][0].transcript);
        setRecording(false);
      };
      rec.onerror = () => {
        setRecording(false);
        startWhisper();
      };
      rec.onend = () => setRecording(false);
      try {
        rec.start();
      } catch {
        setRecording(false);
        startWhisper();
      }
    } else {
      startWhisper();
    }
  };

  // ── Voice output (ElevenLabs) ──
  const speak = async (msg: Msg) => {
    if (speakingId) {
      setSpeakingId(null);
      return;
    }
    setSpeakingId(msg.id);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: msg.content.replace(/[#*_>\[\]()]/g, "").slice(0, 1200), language }),
      });
      if (!res.ok) {
        const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
        if (synth) {
          const u = new SpeechSynthesisUtterance(
            msg.content.replace(/[#*_>[\]()]/g, "").slice(0, 1200)
          );
          u.lang = language === "fr" ? "fr-FR" : "en-GH";
          u.onend = () => setSpeakingId(null);
          synth.cancel();
          synth.speak(u);
          return;
        }
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Voice output failed");
        setSpeakingId(null);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => {
        setSpeakingId(null);
        URL.revokeObjectURL(url);
      };
      await audio.play();
    } catch {
      toast.error("Voice output failed");
      setSpeakingId(null);
    }
  };

  // ── Feedback ──
  const giveFeedback = async (msg: Msg, value: "up" | "down") => {
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, feedback: value } : m)));
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: sidRef.current, messageId: msg.id, value }),
      });
    } catch {
      /* non-critical */
    }
  };

  return (
    <div className="card overflow-hidden shadow-[var(--shadow-lift)]" id="assistant">
      {/* Header */}
      <div className="px-6 md:px-8 py-4.5 border-b flex items-center justify-between gap-3 bg-[rgba(255,255,255,0.045)]">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-2xl flex items-center justify-center text-[#03230f] shadow-md" style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-strong))" }}>
            <Leaf className="w-4.5 h-4.5" />
          </span>
          <div>
            <div className="font-bold text-[0.98rem] text-[var(--ink)]">AgriAI Assistant</div>
            <div className="text-[0.72rem] text-[var(--muted)] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--primary)" }} />
              {settings.chat.model}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={startNewChat}
            className="chip hidden sm:inline-flex"
            title="Start a new chat (forgets this conversation)"
          >
            <Plus className="w-3.5 h-3.5" /> New chat
          </button>
          <button
            onClick={() => setShowSources(!showSources)}
            className={`chip hidden sm:inline-flex ${showSources ? "chip-active" : ""}`}
            title="Toggle sources"
          >
            <Globe className="w-3.5 h-3.5" /> Sources
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="h-[430px] md:h-[470px] overflow-y-auto px-5 md:px-8 py-6 space-y-5 bg-[var(--surface)]/40">
        {messages.map((msg) =>
          msg.role === "user" ? (
            <div key={msg.id} className="flex justify-end fade-up">
              <div
                className="max-w-[85%] md:max-w-[72%] px-5 py-3 rounded-3xl rounded-br-md text-[#03230f] font-medium text-[0.93rem] leading-relaxed shadow-sm"
                style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-strong))" }}
              >
                {msg.content}
              </div>
            </div>
          ) : (
            <div key={msg.id} className="flex justify-start fade-up">
              <div className="max-w-[92%] md:max-w-[85%]">
                <div className="rounded-3xl rounded-bl-md bg-[rgba(255,255,255,0.045)] border border-[var(--border)] px-5 py-4 shadow-sm">
                  {msg.content ? (
                    <Markdown content={msg.content} />
                  ) : (
                    <div className="flex items-center gap-2 py-1.5">
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </div>
                  )}

                  {(msg.demo || msg.provider) && (
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {msg.provider && msg.provider !== "local" && (
                        <span className="inline-flex items-center gap-1.5 text-[0.72rem] font-semibold px-3 py-1 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] border border-[color-mix(in_srgb,var(--primary)_30%,transparent)]">
                          {msg.provider === "gemini" ? "⚡ Gemini" : "☁️ Cloudflare AI"}
                        </span>
                      )}
                      {msg.demo && (
                        <span className="inline-flex items-center gap-1.5 text-[0.72rem] font-semibold px-3 py-1 rounded-full bg-[rgba(249,188,19,0.12)] text-[#f5c96b] border border-[rgba(249,188,19,0.3)]">
                          📦 Offline knowledge base
                        </span>
                      )}
                    </div>
                  )}

                  {/* sources */}
                  {msg.sources && msg.sources.length > 0 && showSources && (
                    <div className="mt-3.5 pt-3.5 border-t border-dashed">
                      <div className="text-[0.7rem] font-bold uppercase tracking-wider text-[var(--muted)] mb-2">
                        Sources
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((s, i) => (
                          <a
                            key={i}
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[0.75rem] font-medium px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary-strong)] transition"
                          >
                            <Search className="w-3 h-3" />
                            [{i + 1}] {s.title.slice(0, 46)}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* actions */}
                  <div className="mt-3 flex items-center gap-1">
                    <button
                      onClick={() => speak(msg)}
                      disabled={!msg.content || speakingId === msg.id}
                      className="p-2 rounded-full hover:bg-[var(--surface)] transition disabled:opacity-40"
                      title={speakingId === msg.id ? "Stop" : "Listen"}
                    >
                      {speakingId === msg.id ? (
                        <VolumeX className="w-4 h-4 text-[var(--primary-strong)]" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-[var(--muted)]" />
                      )}
                    </button>
                    <button
                      onClick={() => giveFeedback(msg, "up")}
                      className={`p-2 rounded-full hover:bg-[var(--surface)] transition ${msg.feedback === "up" ? "text-[var(--primary-strong)]" : "text-[var(--muted)]"}`}
                      title="Helpful"
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => giveFeedback(msg, "down")}
                      className={`p-2 rounded-full hover:bg-[var(--surface)] transition ${msg.feedback === "down" ? "text-[#e5484d]" : "text-[var(--muted)]"}`}
                      title="Not helpful"
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </div>

      {/* Controls */}
      <div className="px-5 md:px-8 py-4 bg-[rgba(255,255,255,0.045)] border-t">
        {/* mode + web search row */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <button
            onClick={() => setMode("standard")}
            className={`chip ${mode === "standard" ? "chip-active" : ""}`}
            title="Standard advice"
          >
            <Brain className="w-3.5 h-3.5" /> Standard
          </button>
          <button
            onClick={() => setMode("expert")}
            className={`chip ${mode === "expert" ? "chip-active" : ""}`}
            title="Deep agronomy advice"
          >
            <FlaskConical className="w-3.5 h-3.5" /> Expert
          </button>
          <button
            onClick={() => setMode("agent")}
            className={`chip ${mode === "agent" ? "chip-active" : ""}`}
            title="Autonomous research agent"
          >
            <Loader2 className="w-3.5 h-3.5" /> Agent
          </button>
          <span className="mx-1 hidden sm:block w-px h-5 bg-[var(--border)]" />
          <button
            onClick={() => setWebSearch(!webSearch)}
            className={`chip ${webSearch ? "chip-active" : ""}`}
            title="Ground answers in live web search results"
          >
            <Globe className="w-3.5 h-3.5" /> Web Search
          </button>
        </div>

        {/* quick prompts */}
        <div className="flex flex-wrap gap-2 mb-3">
          {quickPrompts.map((p) => (
            <button
              key={p}
              onClick={() => sendMessage(p)}
              disabled={busy}
              className="text-[0.76rem] px-3.5 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--primary-soft)] hover:border-[var(--primary)]/40 transition disabled:opacity-50 text-[var(--muted)]"
            >
              {p}
            </button>
          ))}
        </div>

        {/* input row */}
        <div className="flex items-end gap-2.5">
          <button
            onClick={toggleVoice}
            className={`shrink-0 p-3.5 rounded-2xl transition ${recording ? "bg-[#e5484d] text-white animate-pulse" : "bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--muted)]"}`}
            title={recording ? "Stop recording" : "Voice input"}
          >
            {recording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="shrink-0 bg-[var(--surface)] border border-[var(--border)] px-3 py-3 rounded-2xl text-[0.85rem] font-medium outline-none focus:border-[var(--primary)]"
            title="Language"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.name}
              </option>
            ))}
          </select>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            placeholder={settings.chat.placeholder}
            className="flex-1 resize-none border border-[var(--border)] px-5 py-3.5 rounded-3xl text-[0.93rem] outline-none focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_15%,transparent)] bg-[rgba(255,255,255,0.045)] max-h-32"
          />

          {streaming ? (
            <button
              onClick={stop}
              className="shrink-0 bg-[#e5484d] hover:bg-[#d33d42] p-3.5 rounded-3xl text-white transition"
              title="Stop generating"
            >
              <Square className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim()}
              className="shrink-0 p-3.5 rounded-3xl text-[#03230f] transition disabled:opacity-40 hover:shadow-[0_8px_20px_color-mix(in_srgb,var(--primary)_40%,transparent)]"
              style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-strong))" }}
              title="Send"
            >
              <Send className="w-5 h-5" />
            </button>
          )}
        </div>

        <p className="mt-2.5 text-[0.7rem] text-[var(--muted)] text-center">
          AgriAI can make mistakes — verify critical advice with your MoFA extension officer.
        </p>
      </div>
    </div>
  );
}
