// ─── Postgres store smoke test against pg-mem (in-memory Postgres emulator) ──
// Run: node scripts/pg-store.test.cjs
// (Compiles lib/*.ts first — see scripts/tsconfig.test.json)

const Module = require("node:module");
const { newDb } = require("pg-mem");
const fs = require("node:fs");
const path = require("node:path");

const mem = newDb();
const fakePg = mem.adapters.createPg();
const origLoad = Module._load;
Module._load = function (request, ...rest) {
  if (request === "pg") return fakePg;
  return origLoad.call(this, request, ...rest);
};

process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/agriai?sslmode=require";
process.env.ADMIN_EMAIL = "admin@agriai.gh";
process.env.ADMIN_PASSWORD = "AgriAI@2026Admin";

const store = require("/tmp/pgtest/lib/pg-store.js");
const db = require("/tmp/pgtest/lib/db.js");

let failures = 0;
const check = (name, cond) => {
  console.log(`${cond ? "PASS" : "FAIL"} ${name}`);
  if (!cond) failures++;
};

(async () => {
  check("postgresConfigured() true when DATABASE_URL set", store.postgresConfigured() === true);

  const init = await store.initPostgres();
  check("initPostgres creates table", init === true);

  const doc = db.getDB();
  check("getDB seeded (version 4)", doc.version === 4);
  check("seed has studio section", doc.settings.showSections.studio === true);
  check("seed footer credits only Thaddeus", doc.settings.footerText.includes("Thaddeus Tagoe"));
  check("seed prompts credit only Thaddeus", doc.settings.chat.systemPrompt.includes("Thaddeus Tagoe"));
  check("seed admin user name", doc.users.length === 1 && doc.users[0].role === "admin");

  db.mutate((d) => {
    d.chats.push({
      id: "cht_test1",
      sessionId: "sess_pgtest",
      title: "PG test chat",
      language: "en",
      mode: "standard",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  });
  const saved = await store.forcePostgresSave(db.getDB());
  check("forcePostgresSave upserts doc", saved === true);

  const loaded = await store.postgresLoad();
  check("postgresLoad reads doc back", loaded !== null && loaded.chats.some((c) => c.id === "cht_test1"));
  check("postgresLoad preserves seed version", loaded !== null && loaded.version === 4);

  await new Promise((r) => setTimeout(r, 200));
  db.mutate((d) => {
    d.subscribers.push({ id: "sub_pg1", email: "pg@test.gh", createdAt: Date.now() });
  });
  store.schedulePostgresSave(db.getDB());
  await new Promise((r) => setTimeout(r, 2600));
  const afterDebounce = await store.postgresLoad();
  check("schedulePostgresSave flushed after debounce", afterDebounce !== null && afterDebounce.subscribers.some((s) => s.id === "sub_pg1"));

  const health = await store.postgresHealth();
  check("postgresHealth reports connected", health.provider === "postgres" && health.connected === true);

  // hydration: simulate missing local file
  const DB_FILE = path.join(process.cwd(), "data", "db.json");
  if (fs.existsSync(DB_FILE)) fs.rmSync(DB_FILE);
  let hydrationRan = false;
  await db.hydrateFromPostgres(async () => {
    hydrationRan = true;
    return store.postgresLoad();
  });
  check("hydrateFromPostgres restored doc + recreated file", hydrationRan && fs.existsSync(DB_FILE) && db.getDB().subscribers.some((s) => s.id === "sub_pg1"));

  // reset + reseed still works after PG usage
  db.resetDB();
  const fresh = db.getDB();
  check("resetDB re-seeds cleanly", fresh.chats.length === 0 && fresh.version === 4);

  console.log(failures === 0 ? "\nALL PG TESTS PASSED" : `\n${failures} TEST(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
})();
