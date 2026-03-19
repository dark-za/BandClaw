import { Bot, Context, InputFile } from 'grammy';
import os from 'node:os';
import { config } from './config.js';
import { clearHistory } from './db.js';
import { fetchAvailableModels, switchModelById, getActiveModelName, getActiveModel, switchModel } from '../services/llm.js';
import { runAgent } from '../core/agent.js';
import { skillManager } from '../features/skills/manager.js';
import { MODEL_MAP, MODEL_NAMES } from '../interfaces/types.js';

const bot = new Bot(config.telegramBotToken);

// ─── Security Middleware ───────────────────────────────────────

bot.use(async (ctx: Context, next) => {
  const userId = ctx.from?.id;
  if (!userId || !config.allowedUserIds.includes(userId)) {
    // Silently ignore unauthorized users
    return;
  }
  await next();
});

// ─── Register Telegram Menu Commands ───────────────────────────

async function registerCommands(): Promise<void> {
  await bot.api.setMyCommands([
    { command: 'start', description: 'Initiate interaction with BandClaw' },
    { command: 'llm', description: 'Switch LLM model (/llm 1, 2, or 3)' },
    { command: 'clear', description: 'Clear conversation history' },
    { command: 's', description: 'Show system status' },
    { command: 'skills', description: 'List all skill categories' },
    { command: 'skill', description: 'Enable/disable skill category' },
  ]);
}

// ─── /start ────────────────────────────────────────────────────

bot.command('start', async (ctx) => {
  const name = ctx.from?.first_name ?? 'Human';
  await ctx.reply(
    `🐺 *BandClaw Online*\n\n` +
    `Hey ${name}! I'm your personal AI agent running locally.\n\n` +
    `*Active Model:* \`${getActiveModelName()}\`\n\n` +
    `*Commands:*\n` +
    `/llm 1|2|3 — Switch model\n` +
    `/clear — Clear conversation\n` +
    `/s — System status\n` +
    `/skills — Skill tree\n` +
    `/skill enable|disable <category>\n\n` +
    `Send me a message to start chatting!`,
    { parse_mode: 'Markdown' },
  );
});

// ─── /llm ──────────────────────────────────────────────────────

bot.command('llm', async (ctx) => {
  const arg = ctx.match?.trim();

  if (!arg) {
    await ctx.replyWithChatAction('typing');
    try {
      const models = await fetchAvailableModels();
      let list = '🧠 *Available Models (Live):*\n\n';
      
      models.forEach((m) => {
        const active = m.id === getActiveModel() ? ' ✅' : '';
        const name = m.name !== m.id ? m.name : (m.id.split('/').pop() ?? m.id);
        list += `\`/llm set ${m.id}\`\n— ${name}${active}\n\n`;
      });
      
      list += `_Shortcuts: /llm 1 | 2 | 3_\n_Refresh: /llm refresh_`;
      await ctx.reply(list, { parse_mode: 'Markdown' });
    } catch (error) {
       await ctx.reply(`❌ Error fetching models: ${error}`);
    }
    return;
  }

  if (arg.toLowerCase() === 'refresh') {
    await ctx.replyWithChatAction('typing');
    await fetchAvailableModels(true);
    await ctx.reply('✅ Model list refreshed. Send /llm to view.');
    return;
  }

  if (arg.toLowerCase().startsWith('set ')) {
    const modelId = arg.substring(4).trim();
    const result = switchModelById(modelId);
    await ctx.reply(`✅ Model switched to: *${result.name}*\n\`${result.model}\``, { parse_mode: 'Markdown' });
    return;
  }

  const result = switchModel(arg);
  if (result.success) {
    await ctx.reply(`✅ Model switched to: *${result.name}*\n\`${result.model}\``, { parse_mode: 'Markdown' });
  } else {
    await ctx.reply(`❌ Invalid model number. Use /llm 1, 2, 3 or /llm set <id>.`);
  }
});

// ─── /clear ────────────────────────────────────────────────────

bot.command('clear', async (ctx) => {
  const userId = String(ctx.from!.id);
  const deleted = clearHistory(userId);
  await ctx.reply(`🗑️ Conversation cleared. Removed ${deleted} messages.`);
});

// ─── /s — Status ───────────────────────────────────────────────

bot.command('s', async (ctx) => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const cpus = os.cpus();
  const totalIdle = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
  const totalTick = cpus.reduce(
    (acc, cpu) => acc + cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq,
    0,
  );
  const cpuUsage = ((1 - totalIdle / totalTick) * 100).toFixed(1);

  const uptimeSeconds = process.uptime();
  const hours = Math.floor(uptimeSeconds / 3600);
  const mins = Math.floor((uptimeSeconds % 3600) / 60);
  const secs = Math.floor(uptimeSeconds % 60);

  const status =
    `📊 *BandClaw Status*\n\n` +
    `*🧠 Active Model:*\n\`${getActiveModelName()}\`\n` +
    `\`${getActiveModel()}\`\n\n` +
    `*🖥️ System:*\n` +
    `• OS: ${os.type()} ${os.release()} (${os.arch()})\n` +
    `• Host: ${os.hostname()}\n` +
    `• CPU: ${cpus[0]?.model ?? 'N/A'} (${cpus.length} cores)\n` +
    `• CPU Usage: ${cpuUsage}%\n` +
    `• RAM: ${(usedMem / 1073741824).toFixed(1)}/${(totalMem / 1073741824).toFixed(1)} GB (${((usedMem / totalMem) * 100).toFixed(1)}%)\n\n` +
    `*⏱️ Uptime:*\n` +
    `• Node.js: ${hours}h ${mins}m ${secs}s\n` +
    `• System: ${(os.uptime() / 3600).toFixed(1)} hours\n\n` +
    `*📦 Skills:* ${skillManager.getActiveSkillNames().length} active`;

  await ctx.reply(status, { parse_mode: 'Markdown' });
});

// ─── /skills ───────────────────────────────────────────────────

bot.command('skills', async (ctx) => {
  const categories = skillManager.listCategories();

  let msg = '🌳 *Dynamic Skill Tree*\n\n';
  for (const cat of categories) {
    const icon = cat.enabled ? '✅' : '⬜';
    msg += `${icon} *${cat.name}* — ${cat.skills.length} skill(s)\n`;
    for (const skill of cat.skills) {
      msg += `    └ \`${skill}\`\n`;
    }
    msg += '\n';
  }
  msg += `_Use_ \`/skill enable <category>\` _or_ \`/skill disable <category>\``;

  await ctx.reply(msg, { parse_mode: 'Markdown' });
});

// ─── /skill enable/disable ─────────────────────────────────────

bot.command('skill', async (ctx) => {
  const parts = ctx.match?.trim().split(/\s+/) ?? [];
  const action = parts[0]?.toLowerCase();
  const category = parts[1]?.toLowerCase();

  if (!action || !category || !['enable', 'disable'].includes(action)) {
    await ctx.reply(
      '⚙️ Usage:\n`/skill enable <category>`\n`/skill disable <category>`',
      { parse_mode: 'Markdown' },
    );
    return;
  }

  if (action === 'enable') {
    const ok = skillManager.enableCategory(category);
    if (ok) {
      await ctx.reply(`✅ Category *${category}* enabled.`, { parse_mode: 'Markdown' });
    } else {
      await ctx.reply(`❌ Unknown category: ${category}`);
    }
  } else {
    const ok = skillManager.disableCategory(category);
    if (ok) {
      await ctx.reply(`☑️ Category *${category}* disabled.`, { parse_mode: 'Markdown' });
    } else if (category === 'core') {
      await ctx.reply(`🔒 Cannot disable *core* skills.`, { parse_mode: 'Markdown' });
    } else {
      await ctx.reply(`❌ Unknown category: ${category}`);
    }
  }
});

// ─── File Upload Handler ───────────────────────────────────────

bot.on('message:document', async (ctx) => {
  const doc = ctx.message.document;

  if (!doc.file_name) {
    await ctx.reply('❌ No filename found on the uploaded document.');
    return;
  }

  const allowedExtensions = ['.log', '.txt', '.json'];
  const ext = doc.file_name.substring(doc.file_name.lastIndexOf('.')).toLowerCase();

  if (!allowedExtensions.includes(ext)) {
    await ctx.reply(`❌ Unsupported file type: \`${ext}\`\nAllowed: ${allowedExtensions.join(', ')}`, {
      parse_mode: 'Markdown',
    });
    return;
  }

  // Size check (max 5MB)
  if (doc.file_size && doc.file_size > 5 * 1024 * 1024) {
    await ctx.reply('❌ File too large. Max 5MB.');
    return;
  }

  await ctx.reply('📄 Reading file...');

  try {
    const file = await ctx.getFile();
    const response = await fetch(`https://api.telegram.org/file/bot${config.telegramBotToken}/${file.file_path}`);
    const content = await response.text();

    // Truncate very large files
    const maxChars = 15000;
    const truncated = content.length > maxChars;
    const fileContent = truncated ? content.slice(0, maxChars) + '\n\n[... truncated ...]' : content;

    const userMessage =
      (ctx.message.caption ?? `Analyze this ${ext} file:`) +
      `\n\n--- File: ${doc.file_name} ---\n${fileContent}`;

    const userId = String(ctx.from!.id);

    await ctx.reply('🧠 Analyzing...');
    const reply = await runAgent(userMessage, userId);
    await sendLongMessage(ctx, reply);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await ctx.reply(`❌ Failed to process file: ${message}`);
  }
});

// ─── Text Message Handler ──────────────────────────────────────

bot.on('message:text', async (ctx) => {
  const userId = String(ctx.from!.id);
  const text = ctx.message.text;

  // Skip if it's a command (already handled)
  if (text.startsWith('/')) return;

  try {
    await ctx.replyWithChatAction('typing');
    const reply = await runAgent(text, userId);
    await sendLongMessage(ctx, reply);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('❌ Bot message handler error:', message);
    await ctx.reply(`⚠️ Error: ${message}`);
  }
});

// ─── Utility: Send Long Messages ──────────────────────────────

async function sendLongMessage(ctx: Context, text: string): Promise<void> {
  const MAX_LENGTH = 4000; // Telegram limit is ~4096

  if (text.length <= MAX_LENGTH) {
    await ctx.reply(text, { parse_mode: 'Markdown' }).catch(() => {
      // Fallback without markdown if parsing fails
      ctx.reply(text);
    });
    return;
  }

  // Split into chunks
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= MAX_LENGTH) {
      chunks.push(remaining);
      break;
    }
    // Try to split at a newline
    let splitIndex = remaining.lastIndexOf('\n', MAX_LENGTH);
    if (splitIndex === -1 || splitIndex < MAX_LENGTH / 2) {
      splitIndex = MAX_LENGTH;
    }
    chunks.push(remaining.slice(0, splitIndex));
    remaining = remaining.slice(splitIndex);
  }

  for (const chunk of chunks) {
    await ctx.reply(chunk, { parse_mode: 'Markdown' }).catch(() => {
      ctx.reply(chunk);
    });
  }
}

// ─── Bot Lifecycle ─────────────────────────────────────────────

export async function startBot(): Promise<void> {
  await registerCommands();

  bot.catch((err) => {
    console.error('❌ Grammy error:', err.message);
  });

  bot.start({
    onStart: () => {
      console.log('🐺 BandClaw is online! (Telegram long polling)');
    },
  });
}

export { bot };
