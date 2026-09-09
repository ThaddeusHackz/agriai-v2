// ─── /api/admin/apikeys — API key management (admin only) ───────────────────
// GET returns masked key status (never the raw secrets). POST supports three
// actions:
//   { action: "save", secrets: {...} }  — persist keys from the admin panel
//   { action: "clear", key: "gemini" }  — forget a single stored key
//   { action: "test", provider, key, accountId } — live forensic probe
// Saved keys live in the document store (db.json + PostgreSQL mirror) and are
// read by lib/env.ts with priority over environment variables, so a pasted key
// takes effect immediately and survives restarts/deploys.

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDB, mutate } from "@/lib/db";
import { forcePostgresSave, postgresHealth } from "@/lib/pg-store";
import {
  providerStatus,
  storedSecretValue,
  envSecretValue,
} from "@/lib/env";
import { probeProvider, type ProviderName } from "@/lib/probe";

export const runtime = "nodejs";
export const maxDuration = 60;

type SecretField =
  | "gemini"
  | "cloudflareApi"
  | "cloudflareAccountId"
  | "openweather"
  | "tavily"
  | "elevenlabs"
  | "unsplash";

const FIELDS: { provider: string; field: SecretField; envNames: string[]; requiresPair?: boolean }[] = [
  { provider: "gemini", field: "gemini", envNames: ["GEMINI_API_KEY", "GOOGLE_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "GOOGLE_GENAI_API_KEY", "GOOGLE_GEMINI_API_KEY"] },
  { provider: "cloudflare", field: "cloudflareApi", envNames: ["CLOUDFLARE_API_KEY", "CLOUDFLARE_API_TOKEN", "CF_API_TOKEN", "CF_API_KEY"] },
  { provider: "cloudflareAccount", field: "cloudflareAccountId", envNames: ["CLOUDFLARE_ACCOUNT_ID", "CF_ACCOUNT_ID"] },
  { provider: "openweather", field: "openweather", envNames: ["OPENWEATHER_API_KEY", "OPENWEATHERMAP_API_KEY", "WEATHER_API_KEY"] },
  { provider: "tavily", field: "tavily", envNames: ["TAVILY_API_KEY"] },
  { provider: "elevenlabs", field: "elevenlabs", envNames: ["ELEVENLABS_API_KEY"] },
  { provider: "unsplash", field: "unsplash", envNames: ["UNSPLASH_ACCESS_KEY"] },
];

function cleanKey(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const cleaned = raw.trim().replace(/^['"]+|['"]+$/g, "");
  if (/^YOUR_|CHANGE_ME|placeholder/i.test(cleaned)) return "";
  return cleaned;
}

function mask(key: string): string | null {
  if (!key) return null;
  if (key.length <= 4) return "••••";
  return `••••${key.slice(-4)}`;
}

function adminOnly(req: NextRequest): NextResponse | null {
  const user = getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  return null;
}

async function statusPayload() {
  const providers = providerStatus();
  const keys = FIELDS.map((f) => {
    const stored = storedSecretValue(f.field);
    const env = envSecretValue(...f.envNames);
    const value = stored || env;
    return {
      provider: f.provider,
      field: f.field,
      configured: Boolean(value),
      source: stored ? ("stored" as const) : env ? ("env" as const) : null,
      last4: mask(value),
    };
  });
  const database = await postgresHealth();
  return { keys, providers, database };
}

export async function GET(request: NextRequest) {
  const denied = adminOnly(request);
  if (denied) return denied;
  return NextResponse.json(await statusPayload());
}

export async function POST(request: NextRequest) {
  const denied = adminOnly(request);
  if (denied) return denied;

  const body = await request.json().catch(() => ({}));
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // ── Live forensic probe of a key value (not necessarily saved yet) ──
  if (body.action === "test") {
    const provider = String(body.provider || "") as ProviderName;
    const key = cleanKey(body.key);
    const accountId = cleanKey(body.accountId);
    if (!provider || !key) {
      return NextResponse.json({ error: "provider and key are required" }, { status: 400 });
    }
    const result = await probeProvider(provider, key, accountId || undefined);
    return NextResponse.json({ ok: result.ok, result });
  }

  // ── Clear a single stored key ──
  if (body.action === "clear") {
    const field = String(body.key || "") as SecretField;
    const valid = FIELDS.some((f) => f.field === field);
    if (!valid) return NextResponse.json({ error: "Unknown key field" }, { status: 400 });
    mutate((db) => {
      db.secrets[field] = "";
      db.secrets.updatedAt = Date.now();
    });
    await forcePostgresSave(getDB());
    return NextResponse.json({ ok: true, ...(await statusPayload()) });
  }

  // ── Save keys ──
  const secrets = body.secrets;
  if (!secrets || typeof secrets !== "object") {
    return NextResponse.json({ error: "secrets object is required" }, { status: 400 });
  }

  let saved = 0;
  mutate((db) => {
    for (const f of FIELDS) {
      if (!(f.field in secrets)) continue;
      const cleaned = cleanKey(secrets[f.field]);
      if (cleaned !== db.secrets[f.field]) {
        db.secrets[f.field] = cleaned;
        saved += 1;
      }
    }
    db.secrets.updatedAt = Date.now();
  });

  // Make it durable immediately (JSON file is already written; mirror to PG).
  await forcePostgresSave(getDB());

  return NextResponse.json({ ok: true, saved, ...(await statusPayload()) });
}
