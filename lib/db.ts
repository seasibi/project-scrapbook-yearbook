import { createClient, type Client } from "@libsql/client";

let client: Client | null = null;
let initPromise: Promise<void> | null = null;

function getClient(): Client {
  if (!client) {
    client = createClient({
      url: process.env.DATABASE_URL ?? "file:yearbook.db",
      authToken: process.env.DATABASE_AUTH_TOKEN,
    });
  }
  return client;
}

async function initTables(db: Client): Promise<void> {
  await db.batch(
    [
      `CREATE TABLE IF NOT EXISTS users (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name  TEXT NOT NULL,
        username   TEXT NOT NULL UNIQUE,
        password   TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS dedications (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        from_name  TEXT NOT NULL,
        from_nick  TEXT NOT NULL,
        to_name    TEXT NOT NULL,
        message    TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS stickers (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        sticker_id TEXT NOT NULL,
        x_pct      REAL NOT NULL,
        y_pct      REAL NOT NULL,
        rotation   REAL NOT NULL DEFAULT 0,
        scale      REAL NOT NULL DEFAULT 1,
        section    TEXT NOT NULL DEFAULT 'page',
        placed_by  TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )`,
    ],
    "write"
  );
}

/** Returns the shared LibSQL client; creates tables on first call. */
export async function db(): Promise<Client> {
  const c = getClient();
  if (!initPromise) {
    initPromise = initTables(c).catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  await initPromise;
  return c;
}
