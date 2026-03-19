import { initDatabase } from './db.js';
import { skillManager } from './skills/manager.js';
import { startBot } from './bot.js';
import { startWebhookServer } from './webhook.js';

// ─── Import Skills ─────────────────────────────────────────────
import { getCurrentTime } from './skills/core/get_current_time.js';
import { readHostSystem } from './skills/server/read_host_system.js';
import { runSafeScript } from './skills/server/run_safe_script.js';
import { readFileSkill } from './skills/filesystem/read_file.js';
import { writeFileSkill } from './skills/filesystem/write_file.js';
import { deleteFileSkill } from './skills/filesystem/delete_file.js';
import { listDirectorySkill } from './skills/filesystem/list_directory.js';

// ─── Main ──────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('');
  console.log('  ╔══════════════════════════════════════╗');
  console.log('  ║         🐺 BandClaw Agent            ║');
  console.log('  ║    Personal AI · Local · Secure      ║');
  console.log('  ╚══════════════════════════════════════╝');
  console.log('');

  // 1. Initialize database
  initDatabase();

  // 2. Register skills
  console.log('📦 Loading Skill Tree...');
  skillManager.register(getCurrentTime);
  skillManager.register(readHostSystem);
  skillManager.register(runSafeScript);
  skillManager.register(readFileSkill);
  skillManager.register(writeFileSkill);
  skillManager.register(deleteFileSkill);
  skillManager.register(listDirectorySkill);
  console.log('');

  // 3. Start webhook server
  startWebhookServer();

  // 4. Start Telegram bot (long polling — blocks)
  await startBot();
}

main().catch((error) => {
  console.error('💀 Fatal error:', error);
  process.exit(1);
});
