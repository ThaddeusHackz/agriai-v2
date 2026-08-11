// ─── PostgreSQL store (mirror of the AgriAI document database) ───────────────
// When DATABASE_URL is set (Render blueprint → managed Postgres), every write
// to the JSON document store is also upserted into a single `agriai_state`
// table. On boot (see instrumentation.ts) the document is hydrated back from
// Postgres when the local file doesn't exist yet — so data survives restarts
// and deploys on Render's free tier.
//
// The JSON file remains the fast in-process source of truth; Postgres is the
// durable mirror. If Postgres is unreachable we log once and keep going — the
// product never breaks.

import { Pool } from "pg";
import type { Database } from "./types";

const TABLE = "agriai_state";
let pool: Pool | null = null;
let lastError = "";
let warnLoggedAt = 0;

export function databaseUrl(): string | undefined {
  return process.env.DATABASE_URL || undefined;
}

export function postgresConfigured(): boolean {
  return Boolean(databaseUrl());
}

function getPool(): Pool | null {
  const url = databaseUrl();
  if (!url) return null;
  if (!pool) {
    // Honor ?sslmode=require (Render internal connection strings use it).
    let ssl: boolean | { rejectUnauthorized: boolean } | undefined;
    try {
      const u = new URL(url);
      const mode = u.searchParams.get("sslmode");
      if (mode && mode !== "disable" && mode !== "allow" && mode !== "prefer") {
        ssl = { rejectUnauthorized: false };
      } else if (mode === "require") {
        ssl = { rejectUnauthorized: false };
      }
    } catch {
      ssl = undefined;
    }
    pool = new Pool({
      connectionString: url,
      ssl,
      max: 3,
      connectionTimeoutMillis: 8000,
      idleTimeoutMillis: 30000,
    });
    pool.on("error", (err) => {
      console.error("[pg] pool error:", err.message);
    });
  }
  return pool;
}

/** Create the state table if it doesn't exist. Safe to call repeatedly. */
export async function initPostgres(): Promise<boolean> {
  const p = getPool();
  if (!p) return false;
  try {
    await p.query(
      `CREATE TABLE IF NOT EXISTS ${TABLE} (
         id INTEGER PRIMARY KEY,
         doc JSONB NOT NULL,
         updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
       )`
    );
    return true;
  } catch (err) {
    warnOnce(err);
    return false;
  }
}

function warnOnce(err: unknown) {
  const msg = (err as Error).message || String(err);
  const now = Date.now();
  if (msg !== lastError || now - warnLoggedAt > 60_000) {
    console.warn(`[pg] unavailable (${msg}) — continuing with JSON file store`);
    lastError = msg;
    warnLoggedAt = now;
  }
}

/** Load the full document from Postgres, or null when unavailable/empty. */
export async function postgresLoad(): Promise<Database | null> {
  const p = getPool();
  if (!p) return null;
  try {
    const res = await p.query<{ doc: Database }>(
      `SELECT doc FROM ${TABLE} WHERE id = 1`
    );
    return res.rows[0]?.doc ?? null;
  } catch (err) {
    warnOnce(err);
    return null;
  }
}

/**
 * Upsert the full document into Postgres (debounced — flushes at most once
 * per 1500ms so chat streaming doesn't hammer the database).
 */
let pendingDoc: Database | null = null;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let flushing = false;

export function schedulePostgresSave(db: Database): void {
  if (!postgresConfigured()) return;
  pendingDoc = db;
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushPostgres();
  }, 1500);
}

async function flushPostgres(): Promise<void> {
  const p = getPool();
  const doc = pendingDoc;
  pendingDoc = null;
  if (!p || !doc || flushing) {
    if (doc) pendingDoc = doc; // retry later
    return;
  }
  flushing = true;
  try {
    await p.query(
      `INSERT INTO ${TABLE} (id, doc, updated_at) VALUES (1, $1::jsonb, now())
       ON CONFLICT (id) DO UPDATE SET doc = EXCLUDED.doc, updated_at = now()`,
      [JSON.stringify(doc)]
    );
  } catch (err) {
    warnOnce(err);
    // keep the doc for the next flush attempt
    if (!pendingDoc) pendingDoc = doc;
  } finally {
    flushing = false;
  }
}

/** Force an immediate synchronous-ish flush (used by admin "Sync now"). */
export async function forcePostgresSave(db: Database): Promise<boolean> {
  const p = getPool();
  if (!p) return false;
  try {
    await p.query(
      `INSERT INTO ${TABLE} (id, doc, updated_at) VALUES (1, $1::jsonb, now())
       ON CONFLICT (id) DO UPDATE SET doc = EXCLUDED.doc, updated_at = now()`,
      [JSON.stringify(db)]
    );
    return true;
  } catch (err) {
    warnOnce(err);
    return false;
  }
}

/** Connection health probe for the admin panel. */
export async function postgresHealth(): Promise<{
  provider: "postgres" | "json";
  connected: boolean;
}> {
  if (!postgresConfigured()) return { provider: "json", connected: false };
  const p = getPool();
  if (!p) return { provider: "json", connected: false };
  try {
    await p.query("SELECT 1");
    return { provider: "postgres", connected: true };
  } catch (err) {
    warnOnce(err);
    return { provider: "postgres", connected: false };
  }
}

export function closePostgres(): void {
  if (pool) {
    void pool.end().catch(() => {});
    pool = null;
  }
}
