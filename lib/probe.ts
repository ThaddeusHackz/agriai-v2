// ─── API key forensic probe ──────────────────────────────────────────────────
// Validates a key against its real provider endpoint and returns a clear,
// human-readable verdict. Used by the admin "API Keys" tab so an operator can
// confirm a pasted key is live before or after saving. Never logs key values.

import { GoogleGenAI } from "@google/genai";

export type ProviderName =
  | "gemini"
  | "cloudflare"
  | "openweather"
  | "tavily"
  | "elevenlabs"
  | "unsplash";

export interface ProbeResult {
  provider: ProviderName;
  ok: boolean;
  detail: string;
  latencyMs: number;
}

/** Strip secret material out of provider error messages before surfacing them. */
function errText(err: unknown, key?: string): string {
  let msg = err instanceof Error ? err.message : String(err || "unknown error");
  if (key && key.length > 4) {
    msg = msg.split(key).join("••••");
  }
  return msg.slice(0, 220) || "unknown error";
}

// ─── Gemini ──────────────────────────────────────────────────────────────────

const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

export async function probeGemini(key: string): Promise<ProbeResult> {
  const started = Date.now();
  if (!key) {
    return { provider: "gemini", ok: false, detail: "No key provided", latencyMs: 0 };
  }
  let last = "";
  try {
    const client = new GoogleGenAI({ apiKey: key });
    for (const model of GEMINI_MODELS) {
      try {
        const res = await client.models.generateContent({
          model,
          contents: [{ role: "user", parts: [{ text: "Reply with exactly the word: OK" }] }],
          config: {
            maxOutputTokens: 8,
            temperature: 0,
            ...(/2\.5|2-5/.test(model) ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
          },
        });
        const text = (res.text || "").trim();
        if (text) {
          return {
            provider: "gemini",
            ok: true,
            detail: `Valid — ${model} responded in ${Date.now() - started}ms`,
            latencyMs: Date.now() - started,
          };
        }
        last = `empty response from ${model}`;
      } catch (err) {
        last = errText(err, key);
      }
    }
  } catch (err) {
    last = errText(err, key);
  }
  return { provider: "gemini", ok: false, detail: last || "Gemini key rejected", latencyMs: Date.now() - started };
}

// ─── Cloudflare ──────────────────────────────────────────────────────────────

async function cloudflareTokenValid(key: string): Promise<string> {
  const res = await fetch("https://api.cloudflare.com/client/v4/user/tokens/verify", {
    method: "GET",
    headers: { Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return `token verify failed (HTTP ${res.status}${body ? ": " + body.slice(0, 120) : ""})`;
  }
  const data = (await res.json()) as { success?: boolean; result?: { status?: string } };
  if (!data.success) return "token verify returned success:false";
  return data.result?.status === "active" ? "" : `token status: ${data.result?.status || "unknown"}`;
}

async function cloudflareAiRun(key: string, accountId: string): Promise<string> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/@cf/meta/llama-3.3-70b-instruct-fp8-fast`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages: [{ role: "user", content: "Reply with the single word OK" }], max_tokens: 8 }),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return `Workers AI run failed (HTTP ${res.status}${body ? ": " + body.slice(0, 140) : ""})`;
  }
  const data = (await res.json()) as { success?: boolean; result?: { response?: string }; errors?: { message?: string }[] };
  if (!data.success) return `Workers AI error: ${data.errors?.[0]?.message || "unknown"}`;
  return data.result?.response ? "" : "Workers AI returned no text";
}

export async function probeCloudflare(key: string, accountId?: string): Promise<ProbeResult> {
  const started = Date.now();
  if (!key) return { provider: "cloudflare", ok: false, detail: "No token provided", latencyMs: 0 };
  try {
    const tokenErr = await cloudflareTokenValid(key);
    if (tokenErr) {
      return { provider: "cloudflare", ok: false, detail: tokenErr, latencyMs: Date.now() - started };
    }
    if (accountId) {
      const runErr = await cloudflareAiRun(key, accountId);
      if (runErr) {
        return { provider: "cloudflare", ok: false, detail: `Token valid, but ${runErr}`, latencyMs: Date.now() - started };
      }
      return { provider: "cloudflare", ok: true, detail: `Valid — token active and Workers AI responding (${Date.now() - started}ms)`, latencyMs: Date.now() - started };
    }
    return { provider: "cloudflare", ok: true, detail: "Token valid (add Account ID to test Workers AI)", latencyMs: Date.now() - started };
  } catch (err) {
    return { provider: "cloudflare", ok: false, detail: errText(err, key), latencyMs: Date.now() - started };
  }
}

// ─── OpenWeatherMap ──────────────────────────────────────────────────────────

export async function probeOpenWeather(key: string): Promise<ProbeResult> {
  const started = Date.now();
  if (!key) return { provider: "openweather", ok: false, detail: "No key provided", latencyMs: 0 };
  try {
    const params = new URLSearchParams({ q: "Accra", appid: key, units: "metric" });
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?${params}`, {
      signal: AbortSignal.timeout(15000),
      cache: "no-store",
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { provider: "openweather", ok: false, detail: `HTTP ${res.status}${body ? ": " + body.slice(0, 140) : ""}`, latencyMs: Date.now() - started };
    }
    const data = (await res.json()) as { name?: string; main?: { temp?: number } };
    return {
      provider: "openweather",
      ok: true,
      detail: `Valid — ${data.name || "Accra"} now ${data.main?.temp != null ? Math.round(data.main.temp) + "°C" : ""} (${Date.now() - started}ms)`,
      latencyMs: Date.now() - started,
    };
  } catch (err) {
    return { provider: "openweather", ok: false, detail: errText(err, key), latencyMs: Date.now() - started };
  }
}

// ─── Tavily ──────────────────────────────────────────────────────────────────

export async function probeTavily(key: string): Promise<ProbeResult> {
  const started = Date.now();
  if (!key) return { provider: "tavily", ok: false, detail: "No key provided", latencyMs: 0 };
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: key, query: "Ghana agriculture", max_results: 1 }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { provider: "tavily", ok: false, detail: `HTTP ${res.status}${body ? ": " + body.slice(0, 140) : ""}`, latencyMs: Date.now() - started };
    }
    const data = (await res.json()) as { results?: unknown[] };
    return {
      provider: "tavily",
      ok: true,
      detail: `Valid — ${(data.results || []).length} result(s) returned (${Date.now() - started}ms)`,
      latencyMs: Date.now() - started,
    };
  } catch (err) {
    return { provider: "tavily", ok: false, detail: errText(err, key), latencyMs: Date.now() - started };
  }
}

// ─── ElevenLabs ──────────────────────────────────────────────────────────────

export async function probeElevenLabs(key: string): Promise<ProbeResult> {
  const started = Date.now();
  if (!key) return { provider: "elevenlabs", ok: false, detail: "No key provided", latencyMs: 0 };
  try {
    const res = await fetch("https://api.elevenlabs.io/v1/user", {
      headers: { "xi-api-key": key },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { provider: "elevenlabs", ok: false, detail: `HTTP ${res.status}${body ? ": " + body.slice(0, 140) : ""}`, latencyMs: Date.now() - started };
    }
    const data = (await res.json()) as { subscription?: { character_count?: number; character_limit?: number } };
    const used = data.subscription?.character_count;
    const limit = data.subscription?.character_limit;
    return {
      provider: "elevenlabs",
      ok: true,
      detail: `Valid — ${used != null && limit ? `${Math.floor((used / limit) * 100)}% of ${limit} characters used` : "account reachable"} (${Date.now() - started}ms)`,
      latencyMs: Date.now() - started,
    };
  } catch (err) {
    return { provider: "elevenlabs", ok: false, detail: errText(err, key), latencyMs: Date.now() - started };
  }
}

// ─── Unsplash ────────────────────────────────────────────────────────────────

export async function probeUnsplash(key: string): Promise<ProbeResult> {
  const started = Date.now();
  if (!key) return { provider: "unsplash", ok: false, detail: "No key provided", latencyMs: 0 };
  try {
    const res = await fetch("https://api.unsplash.com/photos/random?count=1", {
      headers: { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { provider: "unsplash", ok: false, detail: `HTTP ${res.status}${body ? ": " + body.slice(0, 140) : ""}`, latencyMs: Date.now() - started };
    }
    const data = (await res.json()) as unknown[];
    return {
      provider: "unsplash",
      ok: true,
      detail: `Valid — ${Array.isArray(data) ? data.length : 1} photo(s) returned (${Date.now() - started}ms)`,
      latencyMs: Date.now() - started,
    };
  } catch (err) {
    return { provider: "unsplash", ok: false, detail: errText(err, key), latencyMs: Date.now() - started };
  }
}

// ─── Dispatcher ──────────────────────────────────────────────────────────────

export async function probeProvider(
  provider: ProviderName,
  key: string,
  accountId?: string
): Promise<ProbeResult> {
  switch (provider) {
    case "gemini":
      return probeGemini(key);
    case "cloudflare":
      return probeCloudflare(key, accountId);
    case "openweather":
      return probeOpenWeather(key);
    case "tavily":
      return probeTavily(key);
    case "elevenlabs":
      return probeElevenLabs(key);
    case "unsplash":
      return probeUnsplash(key);
    default:
      return { provider, ok: false, detail: "Unknown provider", latencyMs: 0 };
  }
}
