#!/usr/bin/env node
// ─── Forced Admin Credential Enforcement (forensic-grade) ────────────────────
//
// Unconditionally and idempotently sets the AgriAI admin account to:
//   email:    admin@agriai.gh
//   password: AgriAI@2026Admin
//
// This is a belt-and-suspenders operational tool. In normal operation the
// app already self-heals these credentials on every boot (see lib/db.ts →
// enforceForcedAdmin()), so this script is only needed when you want to force
// the change immediately against a *running* deployment's data without
// restarting it — e.g. directly against the local JSON store on disk, or
// directly against a Postgres mirror (DATABASE_URL).
//
// Usage:
//   node scripts/force-admin-credentials.cjs                # fixes ./data/db.json
//   DATABASE_URL=postgres://... node scripts/force-admin-credentials.cjs   # also fixes Postgres
//
// Safe to run repeatedly. Never deletes other accounts or data — it only
// touches the single admin user record matching the forced email (creating
// it if missing) and invalidates any of its existing sessions so the new
// password takes effect everywhere immediately.

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const FORCED_EMAIL = "admin@agriai.gh";
const FORCED_PASSWORD = "AgriAI@2026Admin";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}${crypto.randomBytes(4).toString("hex")}`;
}

function enforce(db) {
  let changed = false;
  db.users = db.users || [];
  const target = FORCED_EMAIL.toLowerCase();
  let admin = db.users.find((u) => (u.email || "").toLowerCase() === target);

  if (!admin) {
    admin = {
      id: uid("usr"),
      name: "AgriAI Admin",
      email: target,
      passwordHash: bcrypt.hashSync(FORCED_PASSWORD, 10),
      role: "admin",
      createdAt: Date.now(),
    };
    db.users.unshift(admin);
    changed = true;
    console.log(`[force-admin] created admin account ${target}`);
  } else {
    if (admin.email !== target) {
      admin.email = target;
      changed = true;
    }
    if (admin.role !== "admin") {
      admin.role = "admin";
      changed = true;
    }
    let ok = false;
    try {
      ok = bcrypt.compareSync(FORCED_PASSWORD, admin.passwordHash || "");
    } catch {
      ok = false;
    }
    if (!ok) {
      admin.passwordHash = bcrypt.hashSync(FORCED_PASSWORD, 10);
      changed = true;
    }
    if (changed) console.log(`[force-admin] repaired admin account ${target}`);
    else console.log(`[force-admin] admin account ${target} already matches forced credentials`);
  }

  if (changed) {
    db.sessions = (db.sessions || []).filter((s) => (s.email || "").toLowerCase() !== target);
  }

  return changed;
}

function fixLocalFile() {
  if (!fs.existsSync(DB_FILE)) {
    console.log(`[force-admin] ${DB_FILE} does not exist yet — nothing to patch locally (it will self-seed with the forced credentials on first boot).`);
    return;
  }
  const db = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
  const changed = enforce(db);
  if (changed) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmp = DB_FILE + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(db, null, 2), "utf-8");
    fs.renameSync(tmp, DB_FILE);
    console.log(`[force-admin] wrote ${DB_FILE}`);
  }
  return db;
}

async function fixPostgres(localDb) {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("[force-admin] DATABASE_URL not set — skipping Postgres mirror.");
    return;
  }
  let Pool;
  try {
    ({ Pool } = require("pg"));
  } catch {
    console.warn("[force-admin] 'pg' package not installed — run `npm ci` first. Skipping Postgres mirror.");
    return;
  }
  let ssl;
  try {
    const u = new URL(url);
    const mode = u.searchParams.get("sslmode");
    if (mode && mode !== "disable" && mode !== "allow") ssl = { rejectUnauthorized: false };
  } catch {
    /* ignore */
  }
  const pool = new Pool({ connectionString: url, ssl, max: 1, connectionTimeoutMillis: 8000 });
  try {
    await pool.query(
      `CREATE TABLE IF NOT EXISTS agriai_state (
         id INTEGER PRIMARY KEY,
         doc JSONB NOT NULL,
         updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
       )`
    );
    const res = await pool.query("SELECT doc FROM agriai_state WHERE id = 1");
    const doc = res.rows[0]?.doc || localDb;
    if (!doc) {
      console.log("[force-admin] no document found in Postgres and no local db.json to seed from — skipping.");
      return;
    }
    enforce(doc);
    await pool.query(
      `INSERT INTO agriai_state (id, doc, updated_at) VALUES (1, $1::jsonb, now())
       ON CONFLICT (id) DO UPDATE SET doc = EXCLUDED.doc, updated_at = now()`,
      [JSON.stringify(doc)]
    );
    console.log("[force-admin] Postgres mirror updated (agriai_state).");
  } catch (err) {
    console.error("[force-admin] Postgres update failed:", err.message);
  } finally {
    await pool.end().catch(() => {});
  }
}

(async () => {
  console.log("─── AgriAI forced admin credential enforcement ───");
  console.log(`target: ${FORCED_EMAIL} / ${FORCED_PASSWORD}`);
  const localDb = fixLocalFile();
  await fixPostgres(localDb);
  console.log("Done. These credentials are also self-healed automatically on every app boot.");
})();
