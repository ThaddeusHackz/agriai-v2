// ─── Environment helpers ─────────────────────────────────────────────────────
// Keys are often pasted with quotes, whitespace, or under Google/Cloudflare
// alias names. We accept every common alias and never log secret values.
//
// Priority order for every key:
//   1. Value saved from the admin panel (persisted in the document store and
//      mirrored to PostgreSQL — survives restarts and deploys).
//   2. Environment variable (Render blueprint / .env.local).

import { getDB } from "./db";
import type { Secrets } from "./types";

type SecretField = Exclude<keyof Secrets, "updatedAt">;

function clean(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const cleaned = raw.trim().replace(/^['"]+|['"]+$/g, "");
  if (cleaned && !/^YOUR_|CHANGE_ME|placeholder/i.test(cleaned)) return cleaned;
  return "";
}

function firstEnv(...names: string[]): string {
  for (const name of names) {
    const cleaned = clean(process.env[name]);
    if (cleaned) return cleaned;
  }
  return "";
}

/** A key persisted via the admin panel (document store + Postgres mirror). */
function storedSecret(name: SecretField): string {
  try {
    return clean(getDB().secrets?.[name]);
  } catch {
    return "";
  }
}

/** Resolve a key: admin-panel value wins, then the environment variable. */
function resolveKey(field: SecretField, ...envNames: string[]): string {
  return storedSecret(field) || firstEnv(...envNames);
}

/** Public accessors used by the admin panel to report where each key lives. */
export function storedSecretValue(field: SecretField): string {
  return storedSecret(field);
}

export function envSecretValue(...names: string[]): string {
  return firstEnv(...names);
}

export function geminiApiKey(): string {
  return resolveKey(
    "gemini",
    "GEMINI_API_KEY",
    "GOOGLE_API_KEY",
    "GOOGLE_GENERATIVE_AI_API_KEY",
    "GOOGLE_GENAI_API_KEY",
    "GOOGLE_GEMINI_API_KEY"
  );
}

export function cloudflareApiKey(): string {
  return resolveKey("cloudflareApi", "CLOUDFLARE_API_KEY", "CLOUDFLARE_API_TOKEN", "CF_API_TOKEN", "CF_API_KEY");
}

export function cloudflareAccountId(): string {
  return resolveKey("cloudflareAccountId", "CLOUDFLARE_ACCOUNT_ID", "CF_ACCOUNT_ID");
}

export function openweatherApiKey(): string {
  return resolveKey("openweather", "OPENWEATHER_API_KEY", "OPENWEATHERMAP_API_KEY", "WEATHER_API_KEY");
}

export function tavilyApiKey(): string {
  return resolveKey("tavily", "TAVILY_API_KEY");
}

export function elevenLabsApiKey(): string {
  return resolveKey("elevenlabs", "ELEVENLABS_API_KEY");
}

export function unsplashAccessKey(): string {
  return resolveKey("unsplash", "UNSPLASH_ACCESS_KEY");
}

export function providerStatus() {
  return {
    gemini: Boolean(geminiApiKey()),
    cloudflare: Boolean(cloudflareApiKey() && cloudflareAccountId()),
    openweather: Boolean(openweatherApiKey()),
    tavily: Boolean(tavilyApiKey()),
    elevenlabs: Boolean(elevenLabsApiKey()),
    unsplash: Boolean(unsplashAccessKey()),
    database: Boolean(firstEnv("DATABASE_URL")),
  };
}
