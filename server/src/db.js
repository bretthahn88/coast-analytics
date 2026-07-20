/**
 * SQLite handle for the leads table. Falls back to /tmp on Vercel where the
 * project tree is read-only. Single shared `db` export.
 */
import path from 'node:path';
import fs from 'node:fs';
import Database from 'better-sqlite3';

function resolveDbPath() {
  if (process.env.DB_PATH) return process.env.DB_PATH;
  if (process.env.VERCEL) return '/tmp/ilp.sqlite';
  return path.resolve(process.cwd(), 'server', 'db', 'ilp.sqlite');
}

const dbPath = resolveDbPath();
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name      TEXT NOT NULL,
    last_name       TEXT NOT NULL,
    company_name    TEXT NOT NULL,
    email           TEXT NOT NULL,
    phone           TEXT,
    num_properties  TEXT,
    referral_source TEXT,
    page_viewed     TEXT,
    user_agent      TEXT,
    ip              TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

  CREATE TABLE IF NOT EXISTS contact_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,
    company_name    TEXT,
    email           TEXT NOT NULL,
    phone           TEXT,
    message         TEXT NOT NULL,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_contact_created_at ON contact_submissions(created_at DESC);

  -- Demo gate audit log. Every gate submission is written here.
  -- klaviyo_status = synced when the third-party accepted the row,
  -- error otherwise (with the response body in klaviyo_error).
  CREATE TABLE IF NOT EXISTS gate_leads_fallback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name      TEXT NOT NULL,
    email           TEXT NOT NULL,
    company_name    TEXT,
    klaviyo_status  TEXT NOT NULL,
    klaviyo_error   TEXT,
    user_agent      TEXT,
    ip              TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_gate_leads_created_at ON gate_leads_fallback(created_at DESC);
`);

export default db;
