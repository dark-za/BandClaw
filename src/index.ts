import { initDatabase } from './infrastructure/db.js';
import { skillManager } from './features/skills/manager.js';
import { startBot } from './infrastructure/bot.js';
import { startWebhookServer } from './infrastructure/webhook.js';

// ─── Import Skills ─────────────────────────────────────────────
import { getCurrentTime } from './features/skills/core/get_current_time.js';
import { readHostSystem } from './features/skills/server/read_host_system.js';
import { runSafeScript } from './features/skills/server/run_safe_script.js';
import { readFileSkill } from './features/skills/filesystem/read_file.js';
import { writeFileSkill } from './features/skills/filesystem/write_file.js';
import { deleteFileSkill } from './features/skills/filesystem/delete_file.js';
import { listDirectorySkill } from './features/skills/filesystem/list_directory.js';

// Markdown Skills
import { searchMarkdownSkills } from './features/skills/markdown/search_skills.js';
import { loadMarkdownSkill } from './features/skills/markdown/load_skill.js';

// Integrations (Converted from MD)
import { dockerManagerSkill } from './features/skills/integrations/docker_manager.js';
import { n8nPrCreatorSkill } from './features/skills/integrations/n8n_pr_creator.js';
import { gogWorkspaceSkill } from './features/skills/integrations/gog_workspace.js';
import { context7McpSkill } from './features/skills/integrations/context7_mcp.js';
import { networkScannerSkill } from './features/skills/integrations/network_scanner.js';
import { trendRadarSkill } from './features/skills/integrations/trend_radar.js';
import { taskMasterSkill } from './features/skills/integrations/task_master.js';
import { agentOrchestratorSkill } from './features/skills/integrations/orchestrator.js';

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

  // 2. Register skills
  console.log('📦 Loading Skill Tree...');
  skillManager.register(getCurrentTime);
  skillManager.register(readHostSystem);
  skillManager.register(runSafeScript);
  skillManager.register(readFileSkill);
  skillManager.register(writeFileSkill);
  skillManager.register(deleteFileSkill);
  skillManager.register(listDirectorySkill);
  skillManager.register(searchMarkdownSkills);
  skillManager.register(loadMarkdownSkill);

  // Register New Integrations
  skillManager.register(dockerManagerSkill);
  skillManager.register(n8nPrCreatorSkill);
  skillManager.register(gogWorkspaceSkill);
  skillManager.register(context7McpSkill);
  skillManager.register(networkScannerSkill);
  skillManager.register(trendRadarSkill);
  skillManager.register(taskMasterSkill);
  skillManager.register(agentOrchestratorSkill);
  
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
