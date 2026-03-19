#!/usr/bin/env node
import { execSync } from 'node:child_process';
import * as http from 'node:http';
import * as readline from 'node:readline';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve project root (assuming this file is compiled to dist/cli.js)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

const args = process.argv.slice(2);
const command = args[0]?.toLowerCase();

// ─── Formatting Helpers ───────────────────────────────────────

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

function log(msg: string) { console.log(`${GREEN}✅ ${msg}${RESET}`); }
function err(msg: string) { console.error(`${RED}❌ ${msg}${RESET}`); process.exit(1); }
function info(msg: string) { console.log(`${CYAN}ℹ️  ${msg}${RESET}`); }

// ─── Subcommands ──────────────────────────────────────────────

function runCommand(cmd: string, silent = false) {
  try {
    return execSync(cmd, { stdio: silent ? 'pipe' : 'inherit', encoding: 'utf-8', cwd: PROJECT_ROOT });
  } catch (error) {
    if (!silent) {
       console.error(`${RED}Command failed: ${cmd}${RESET}`);
    }
    throw error;
  }
}

async function handleStatus() {
  console.log(`\n${BOLD}📊 BandClaw PM2 Status${RESET}\n`);
  try {
    runCommand('pm2 describe bandclaw');
  } catch {
    console.log(`${YELLOW}BandClaw is not running in PM2.${RESET}`);
  }
}

async function handleLogs() {
  runCommand('pm2 logs bandclaw --lines 50');
}

async function handleRestart() {
  info('Restarting BandClaw process...');
  runCommand('pm2 restart bandclaw');
  log('Restart signal sent to PM2.');
}

async function handleUpdate() {
  info('Starting resilient upgrade pipeline...');

  try {
    info('Stashing local modifications (if any)...');
    runCommand('git stash push -m "bandclaw_auto_stash_before_upgrade"', true);
  } catch (e) {
    // ignore if nothing to stash
  }

  info('Pulling latest changes from Git...');
  try {
    runCommand('git pull --rebase');
  } catch (e) {
    err('Failed to pull from remote. Please resolve Git conflicts manually or run: git reset --hard origin/main');
  }

  try {
    info('Restoring local modifications...');
    runCommand('git stash pop', true);
  } catch (e) {
    console.log(`\${YELLOW}Note: Some local changes had conflicts and remain in the stash.\${RESET}`);
  }
  
  info('Installing dependencies (Clean Install)...');
  try {
    runCommand('npm ci');
  } catch (e) {
    info('Clean install failed, falling back to standard install...');
    runCommand('npm install');
  }
  
  info('Rebuilding TypeScript source...');
  runCommand('npm run build');
  
  info('Restarting BandClaw...');
  try {
    runCommand('pm2 restart bandclaw');
  } catch (e) {
    console.log(`\${YELLOW}⚠️ Could not restart PM2 process "bandclaw". It might not be running or is named differently.\${RESET}`);
  }
  
  log('BandClaw updated successfully!');
}

async function prompt(question: string, dlft?: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`${question} ${dlft ? `[${dlft}]: ` : ': '}`, (answer) => {
      rl.close();
      resolve(answer.trim() || dlft || '');
    });
  });
}

async function handleConfig() {
  console.log(`\n${BOLD}⚙️  BandClaw Interactive Config${RESET}\n`);
  
  const token = await prompt('Telegram Bot Token');
  if (!token) err('Token is required.');
  
  const ids = await prompt('Allowed Telegram User IDs (comma separated)');
  if (!ids) err('Admin IDs are required.');
  
  const llmUrl = await prompt('Local LLM API URL', 'http://192.168.1.124:1234/v1');
  const defaultModel = await prompt('Default Model ID', 'qwen3.5-9b-uncensored-hauhaucs-aggressive');
  
  const envContent = `TELEGRAM_BOT_TOKEN="${token}"
ALLOWED_USER_IDS="${ids}"
LOCAL_LLM_URL="${llmUrl}"
DEFAULT_MODEL="${defaultModel}"
DB_PATH="./memory.db"
WEBHOOK_PORT="3000"
`;

  fs.writeFileSync(path.join(PROJECT_ROOT, '.env'), envContent, 'utf-8');
  log('.env file updated.');
  info('Run "bandclaw restart" to apply changes.');
}

async function handleModels() {
  info('Querying models from local LLM...');
  
  // Try to parse URL from .env (since CLI is standalone)
  let llmUrl = 'http://192.168.1.124:1234/v1';
  try {
    const envData = fs.readFileSync(path.join(PROJECT_ROOT, '.env'), 'utf-8');
    const match = envData.match(/LOCAL_LLM_URL="?([^"\n]+)"?/);
    if (match && match[1]) llmUrl = match[1];
  } catch {
    // ignore
  }

  const reqUrl = `${llmUrl}/models`;
  
  http.get(reqUrl, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      if (res.statusCode !== 200) {
        err(`Failed to fetch models (HTTP ${res.statusCode})`);
      }
      try {
        const parsed = JSON.parse(data);
        console.log(`\n${BOLD}🧠 Available Models on LM Studio:${RESET}\n`);
        (parsed.data || []).forEach((m: any) => {
           console.log(`- ${CYAN}${m.id}${RESET}`);
        });
        console.log('');
      } catch (e) {
        err('Failed to parse JSON response.');
      }
    });
  }).on('error', (e) => {
    err(`Connection error: ${e.message}. Is LM Studio running?`);
  });
}

async function handleUninstall() {
  console.log(`\n${BOLD}${RED}⚠️  DANGER: Completely uninstall BandClaw?${RESET}`);
  console.log(`This will delete the process, the database, and the entire folder at:`);
  console.log(PROJECT_ROOT);
  
  const confirm = await prompt(`${YELLOW}Type 'yes-delete' to confirm${RESET}`);
  if (confirm !== 'yes-delete') {
    info('Uninstall cancelled.');
    process.exit(0);
  }

  // 1. Stop PM2
  try {
    runCommand('pm2 stop bandclaw', true);
    runCommand('pm2 delete bandclaw', true);
    runCommand('pm2 save', true);
    log('PM2 process deleted.');
  } catch (e) {
    info('No PM2 process found.');
  }

  // 2. Ask to delete directory (we cannot delete ourselves while running from inside)
  console.log(`\n${GREEN}✅ Uninstallation pre-flight complete.${RESET}`);
  console.log(`To finish removing files, run this command:`);
  console.log(`${BOLD}rm -rf ${PROJECT_ROOT}${RESET}\n`);
}

function printHelp() {
  console.log(`
${BOLD}🐺 BandClaw CLI${RESET}

Usage: bandclaw <command>

Commands:
  status    View PM2 process status
  logs      Tail process logs
  restart   Restart the BandClaw agent
  update    Pull code, rebuild, and restart (alias: upgrade)
  config    Interactively set up .env
  models    List available LLM models from LM Studio
  uninstall Stop processes and prepare for deletion
  help      Show this menu
`);
}

// ─── Router ───────────────────────────────────────────────────

async function main() {
  switch (command) {
    case 'status':
      await handleStatus();
      break;
    case 'logs':
      await handleLogs();
      break;
    case 'restart':
      await handleRestart();
      break;
    case 'update':
    case 'upgrade':
      await handleUpdate();
      break;
    case 'config':
      await handleConfig();
      break;
    case 'models':
      await handleModels();
      break;
    case 'uninstall':
      await handleUninstall();
      break;
    case 'help':
    default:
      printHelp();
      break;
  }
}

main().catch(console.error);
