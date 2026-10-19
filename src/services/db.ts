import * as SQLite from 'expo-sqlite';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync('campus-events.db');
  await _db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS events (
      id         TEXT PRIMARY KEY NOT NULL,
      title      TEXT NOT NULL,
      starts_at  TEXT NOT NULL,
      category   TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id    TEXT NOT NULL,
      action      TEXT NOT NULL,
      payload     TEXT,
      created_at  TEXT NOT NULL
    );
  `);
  return _db;
}

/** บันทึก events ลง SQLite เพื่อใช้แบบออฟไลน์ */
export async function upsertEvents(
  events: Array<{ id: string; title: string; startsAt: string; category: string }>,
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    for (const ev of events) {
      await db.runAsync(
        `INSERT INTO events (id, title, starts_at, category, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           title      = excluded.title,
           starts_at  = excluded.starts_at,
           category   = excluded.category,
           updated_at = excluded.updated_at`,
        [ev.id, ev.title, ev.startsAt, ev.category, now],
      );
    }
  });
}

/** ดึงรายการ events จาก SQLite */
export async function getLocalEvents(): Promise<
  Array<{ id: string; title: string; starts_at: string; category: string; updated_at: string }>
> {
  const db = await getDb();
  return db.getAllAsync<{
    id: string;
    title: string;
    starts_at: string;
    category: string;
    updated_at: string;
  }>('SELECT * FROM events ORDER BY starts_at ASC');
}
