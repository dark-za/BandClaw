import Database from 'better-sqlite3';
import { config } from './config.js';

let db: Database.Database;

export function initDatabase(): void {
  db = new Database(config.dbPath);

  // Enable WAL mode for better concurrent performance
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT,
      tool_calls TEXT,
      tool_call_id TEXT,
      name TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS memory (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS vram (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      summary TEXT NOT NULL,
      frequency INTEGER DEFAULT 1,
      last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS usage_stats (
      key TEXT PRIMARY KEY,
      count INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_conversations_user
      ON conversations(user_id, timestamp);
    
    CREATE INDEX IF NOT EXISTS idx_vram_user
      ON vram(user_id, last_accessed);
  `);

  console.log('✅ Database initialized');
}

// ─── Conversation History ────────────────────────────────────────

export interface StoredMessage {
  role: string;
  content: string | null;
  tool_calls: string | null;
  tool_call_id: string | null;
  name: string | null;
}

export function saveMessage(
  userId: string,
  role: string,
  content: string | null,
  toolCalls?: unknown,
  toolCallId?: string,
  name?: string,
): void {
  const stmt = db.prepare(`
    INSERT INTO conversations (user_id, role, content, tool_calls, tool_call_id, name)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    userId,
    role,
    content,
    toolCalls ? JSON.stringify(toolCalls) : null,
    toolCallId ?? null,
    name ?? null,
  );
}

export function getHistory(userId: string, limit = 50): StoredMessage[] {
  const stmt = db.prepare(`
    SELECT role, content, tool_calls, tool_call_id, name
    FROM conversations
    WHERE user_id = ?
    ORDER BY timestamp DESC
    LIMIT ?
  `);
  const rows = stmt.all(userId, limit) as StoredMessage[];
  return rows.reverse(); // oldest first
}

export function clearHistory(userId: string): number {
  const stmt = db.prepare(`DELETE FROM conversations WHERE user_id = ?`);
  const result = stmt.run(userId);
  return result.changes;
}

export function getOldestMessagesToCompress(userId: string, limit: number): {id: number, role: string, content: string | null}[] {
  const countStmt = db.prepare(`SELECT COUNT(*) as c FROM conversations WHERE user_id = ?`);
  const { c } = countStmt.get(userId) as { c: number };
  if (c <= limit + 10) return []; // Leave at least 10 recent messages alive

  const stmt = db.prepare(`
    SELECT id, role, content FROM conversations
    WHERE user_id = ? AND role != 'tool'
    ORDER BY timestamp ASC
    LIMIT ?
  `);
  return stmt.all(userId, limit) as any;
}

export function deleteMessagesByIds(ids: number[]): number {
  if (ids.length === 0) return 0;
  const placeholders = ids.map(() => '?').join(',');
  const stmt = db.prepare(`DELETE FROM conversations WHERE id IN (\${placeholders})`);
  const result = stmt.run(...ids);
  return result.changes;
}

export function deleteAfterMessage(userId: string, lastUserId: number): number {
  const stmt = db.prepare(`DELETE FROM conversations WHERE user_id = ? AND id > ?`);
  const result = stmt.run(userId, lastUserId);
  return result.changes;
}

export function getLastUserMessage(userId: string): { id: number; content: string } | null {
  const stmt = db.prepare(`
    SELECT id, content FROM conversations
    WHERE user_id = ? AND role = 'user'
    ORDER BY timestamp DESC LIMIT 1
  `);
  const row = stmt.get(userId) as { id: number; content: string } | undefined;
  return row || null;
}

// ─── VRAM System ────────────────────────────────────────────────

export interface VramEntry {
  id: number;
  summary: string;
  frequency: number;
}

export function saveVram(userId: string, summary: string): void {
  // Try to find if an exact matching summary exists (to increase frequency)
  // or just insert a new one. We'll optimize by always creating a new VRAM block
  // but if we want to update, we can do it via a quick match.
  const stmt = db.prepare(`
    INSERT INTO vram (user_id, summary) VALUES (?, ?)
  `);
  stmt.run(userId, summary);
}

export function touchVram(id: number): void {
  const stmt = db.prepare(`UPDATE vram SET frequency = frequency + 1, last_accessed = CURRENT_TIMESTAMP WHERE id = ?`);
  stmt.run(id);
}

export function getTopVram(userId: string, limit = 3): VramEntry[] {
  const stmt = db.prepare(`
    SELECT id, summary, frequency FROM vram
    WHERE user_id = ?
    ORDER BY last_accessed DESC, frequency DESC
    LIMIT ?
  `);
  const rows = stmt.all(userId, limit) as VramEntry[];
  // Automatically touch them so they stay relevant if fetched
  rows.forEach(r => touchVram(r.id));
  return rows;
}

// ─── Usage Stats System ─────────────────────────────────────────

export function incrementStat(key: string): void {
  const stmt = db.prepare(`
    INSERT INTO usage_stats (key, count) VALUES (?, 1)
    ON CONFLICT(key) DO UPDATE SET count = count + 1
  `);
  stmt.run(key);
}

export function getStat(key: string): number {
  const stmt = db.prepare(`SELECT count FROM usage_stats WHERE key = ?`);
  const row = stmt.get(key) as { count: number } | undefined;
  return row?.count ?? 0;
}

// ─── Persistent Memory ──────────────────────────────────────────

export function setMemory(key: string, value: string): void {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO memory (key, value, timestamp)
    VALUES (?, ?, CURRENT_TIMESTAMP)
  `);
  stmt.run(key, value);
}

export function getMemory(key: string): string | undefined {
  const stmt = db.prepare(`SELECT value FROM memory WHERE key = ?`);
  const row = stmt.get(key) as { value: string } | undefined;
  return row?.value;
}

export function getDb(): Database.Database {
  return db;
}
