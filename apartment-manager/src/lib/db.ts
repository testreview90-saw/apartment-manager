import path from 'path'

/* ------------------------------------------------------------------ */
/* Node 22 built-in SQLite — no npm install needed                     */
/* ------------------------------------------------------------------ */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DatabaseSync } = require('node:sqlite') as {
  DatabaseSync: new (path: string) => DbInstance
}

interface Stmt {
  get:  (...args: unknown[]) => unknown
  all:  (...args: unknown[]) => unknown[]
  run:  (...args: unknown[]) => { changes: number; lastInsertRowid: number | bigint }
}
interface DbInstance {
  exec:    (sql: string) => void
  prepare: (sql: string) => Stmt
}

/* ------------------------------------------------------------------ */
/* Global singleton (survives Next.js hot-reloads in dev)              */
/* ------------------------------------------------------------------ */
const g = globalThis as unknown as { _db?: DbInstance }

if (!g._db) {
  const DB_PATH = path.join(process.cwd(), 'dev.db')
  const instance = new DatabaseSync(DB_PATH)

  instance.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      room_number  TEXT    UNIQUE NOT NULL,
      floor        INTEGER NOT NULL,
      monthly_rent REAL    NOT NULL,
      status       TEXT    NOT NULL DEFAULT 'available',
      notes        TEXT,
      created_at   TEXT    DEFAULT (datetime('now')),
      updated_at   TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tenants (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id      INTEGER UNIQUE NOT NULL,
      full_name    TEXT    NOT NULL,
      phone        TEXT    NOT NULL,
      id_photo     TEXT,
      move_in_date TEXT    NOT NULL,
      deposit      REAL    NOT NULL,
      status       TEXT    NOT NULL DEFAULT 'active',
      notes        TEXT,
      created_at   TEXT    DEFAULT (datetime('now')),
      updated_at   TEXT    DEFAULT (datetime('now')),
      FOREIGN KEY (room_id) REFERENCES rooms(id)
    );

    CREATE TABLE IF NOT EXISTS applications (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id        INTEGER,
      applicant_name TEXT NOT NULL,
      phone          TEXT NOT NULL,
      notes          TEXT,
      status         TEXT NOT NULL DEFAULT 'new',
      created_at     TEXT DEFAULT (datetime('now')),
      updated_at     TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bills (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id    INTEGER NOT NULL,
      room_id      INTEGER NOT NULL,
      billing_month TEXT    NOT NULL,
      rent_amount  REAL    NOT NULL,
      water_prev   REAL    DEFAULT 0,
      water_curr   REAL    DEFAULT 0,
      water_units  REAL    DEFAULT 0,
      water_rate   REAL    DEFAULT 0,
      water_amount REAL    DEFAULT 0,
      elec_prev    REAL    DEFAULT 0,
      elec_curr    REAL    DEFAULT 0,
      elec_units   REAL    DEFAULT 0,
      elec_rate    REAL    DEFAULT 0,
      elec_amount  REAL    DEFAULT 0,
      total_amount REAL    DEFAULT 0,
      due_date     TEXT    NOT NULL,
      status       TEXT    NOT NULL DEFAULT 'unpaid',
      paid_date    TEXT,
      notes        TEXT,
      created_at   TEXT    DEFAULT (datetime('now')),
      updated_at   TEXT    DEFAULT (datetime('now')),
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (room_id)   REFERENCES rooms(id),
      UNIQUE (tenant_id, billing_month)
    );

    CREATE TABLE IF NOT EXISTS settings (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      setting_key   TEXT UNIQUE NOT NULL,
      setting_value TEXT NOT NULL
    );
  `)

  g._db = instance
}

export const db: DbInstance = g._db!
export default db
