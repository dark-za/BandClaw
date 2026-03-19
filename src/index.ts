import { initDatabase } from './infrastructure/db.js';
import { skillManager } from './features/skills/manager.js';
import { startBot } from './infrastructure/bot.js';
import { startWebhookServer } from './infrastructure/webhook.js';
import { ensureModelLoaded } from './services/llm.js';

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Skill } from './interfaces/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadAllSkills(dirPath: string) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
         if (entry.name !== 'docs') {
           await loadAllSkills(fullPath);
         }
      } else if (entry.isFile() && entry.name.endsWith('.js') && !entry.name.endsWith('.d.ts')) {
        if (entry.name.includes('manager') || entry.name.includes('types')) continue;
        
        try {
          const importUrl = pathToFileURL(fullPath).href;
          const module = await import(importUrl);
          for (const key in module) {
            const exp = module[key];
            if (exp && typeof exp === 'object' && 'name' in exp && 'execute' in exp && 'schema' in exp) {
               skillManager.register(exp as Skill);
            }
          }
        } catch (err) {
          console.error(`❌ Failed to inject skill module: ${entry.name} - ${String(err)}`);
        }
      }
    }
  } catch (err) {
    console.error(`❌ Skill Scanning Failed:`, err);
  }
}

// Init Singletons ──────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('');
  console.log('  ╔══════════════════════════════════════╗');
  console.log('  ║         🐺 BandClaw Agent            ║');
  console.log('  ║    Personal AI · Local · Secure      ║');
  console.log('  ╚══════════════════════════════════════╝');
  console.log('');

  // 1. Initialize database
  initDatabase();

  // 2. Register skills dynamically
  console.log('📦 Engaging Dynamic Deep-Scan Loader...');
  const skillsDir = path.join(__dirname, 'features/skills');
  await loadAllSkills(skillsDir);
  console.log(`✅ Loaded ${skillManager.getActiveSkillNames().length} native skills dynamically.`);
  console.log('');

  // 3. Ensure LLM model is loaded
  console.log('🧠 Checking LLM model readiness...');
  await ensureModelLoaded();
  console.log('');

  // 4. Start webhook server
  startWebhookServer();

  // 5. Start Telegram bot (long polling — blocks)
  await startBot();
}

main().catch((error) => {
  console.error('💀 Fatal error:', error);
  process.exit(1);
});
