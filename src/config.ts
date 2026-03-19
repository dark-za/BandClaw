import 'dotenv/config';
import os from 'node:os';

export interface Config {
  telegramBotToken: string;
  allowedUserIds: number[];
  localLlmUrl: string;
  defaultModel: string;
  dbPath: string;
  webhookPort: number;
  sandboxRoot: string;
  groqApiKey?: string;
  geminiApiKey?: string;
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value || value === 'REPLACE_WITH_YOURS') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

let llmUrl = process.env.LOCAL_LLM_URL ?? 'http://192.168.1.124:1234/v1';
if (llmUrl && !llmUrl.endsWith('/v1') && !llmUrl.endsWith('/v1/')) {
  llmUrl = llmUrl.replace(/\/$/, '') + '/v1';
}

export const config: Config = {
  telegramBotToken: requireEnv('TELEGRAM_BOT_TOKEN'),
  allowedUserIds: (process.env.ALLOWED_USER_IDS ?? '')
    .split(',')
    .map((id) => parseInt(id.trim(), 10))
    .filter((id) => !isNaN(id)),
  localLlmUrl: llmUrl,
  defaultModel: process.env.DEFAULT_MODEL ?? 'qwen3.5-9b-uncensored-hauhaucs-aggressive',
  dbPath: process.env.DB_PATH ?? './memory.db',
  webhookPort: parseInt(process.env.WEBHOOK_PORT ?? '3000', 10),
  sandboxRoot: process.env.SANDBOX_ROOT ?? os.homedir(),
  groqApiKey: process.env.GROQ_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
};
