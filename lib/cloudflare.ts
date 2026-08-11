// ─── Cloudflare Workers AI (chat fallback + image generation) ───────────────
// Uses the Cloudflare REST API:
//   POST https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/run/{model}
// Requires CLOUDFLARE_API_KEY (API token) and CLOUDFLARE_ACCOUNT_ID.
// Every call degrades gracefully: when keys are missing or the API fails,
// callers fall back to the next provider in the chain.

import { cloudflareAccountId, cloudflareApiKey } from "./env";

const CHAT_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const IMAGE_MODEL = "@cf/black-forest-labs/flux-1-schnell";

export interface CloudflareMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export function cloudflareConfigured(): boolean {
  return Boolean(cloudflareApiKey() && cloudflareAccountId());
}

function baseUrl(): string | null {
  const account = cloudflareAccountId();
  const key = cloudflareApiKey();
  if (!account || !key) return null;
  return `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(
    account
  )}/ai/run`;
}

async function run(model: string, body: unknown, signal?: AbortSignal) {
  const base = baseUrl();
  const key = cloudflareApiKey();
  if (!base || !key) throw new Error("Cloudflare AI is not configured");
  const res = await fetch(`${base}/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: signal || AbortSignal.timeout(30000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`cloudflare ${res.status}: ${text.slice(0, 160)}`);
  }
  const data = (await res.json()) as {
    success?: boolean;
    result?: { response?: string; image?: string };
    errors?: { message?: string }[];
  };
  if (!data.success) {
    const msg = data.errors?.[0]?.message || "unknown error";
    throw new Error(`cloudflare api error: ${msg}`);
  }
  return data.result;
}

/**
 * Chat completion via Workers AI (Llama 3.3 70B). Returns the full reply text.
 * Throws on failure so callers can fall back further down the chain.
 */
export async function cloudflareChat(
  messages: CloudflareMessage[],
  opts: { maxTokens?: number; temperature?: number; signal?: AbortSignal } = {}
): Promise<string> {
  const result = await run(
    CHAT_MODEL,
    {
      messages: messages.slice(-16).map((m) => ({ role: m.role, content: m.content })),
      max_tokens: opts.maxTokens ?? 1024,
      temperature: opts.temperature ?? 0.7,
    },
    opts.signal
  );
  const text = result?.response?.trim();
  if (!text) throw new Error("cloudflare chat returned empty response");
  return text;
}

/**
 * Text-to-image via Workers AI (Flux-1-schnell). Returns a PNG data-URL.
 */
export async function cloudflareImage(
  prompt: string,
  opts: { steps?: number; signal?: AbortSignal } = {}
): Promise<string> {
  const result = await run(
    IMAGE_MODEL,
    {
      prompt,
      num_steps: opts.steps ?? 4,
    },
    opts.signal
  );
  const b64 = result?.image;
  if (!b64) throw new Error("cloudflare image returned no data");
  return `data:image/png;base64,${b64}`;
}
