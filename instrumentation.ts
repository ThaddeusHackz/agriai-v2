// ─── Next.js instrumentation — runs once when the server starts ──────────────
// If DATABASE_URL is configured, hydrate the in-process document store from
// Postgres when no local JSON file exists yet. This is what makes the database
// survive restarts/deploys on Render (ephemeral filesystem on free tier).
//
// Note: `next build` with Turbopack may print benign "Edge Runtime" warnings
// for the Node-only modules imported here (fs/path/bcrypt/pg). They are
// warnings only — instrumentation runs in the Node.js runtime, never Edge.

export const runtime = "nodejs";

import { postgresConfigured, initPostgres, postgresLoad } from "./lib/pg-store";
import { hydrateFromPostgres } from "./lib/db";

export async function register() {
  try {
    if (!postgresConfigured()) return;
    const ok = await initPostgres();
    if (!ok) return;
    await hydrateFromPostgres(async () => postgresLoad());
  } catch (err) {
    console.warn(
      "[instrumentation] Postgres hydration skipped:",
      (err as Error).message
    );
  }
}
