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

    CREATE INDEX IF NOT EXISTS idx_conversations_user
      ON conversations(user_id, timestamp);
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
