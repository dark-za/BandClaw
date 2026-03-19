# 🐺 BandClaw

**Personal AI Agent** — Runs locally 24/7, uses Telegram as its only interface, and connects to local LLMs via LM Studio.

Built from scratch in TypeScript. Simple, secure, and completely under your control.

---

## Features

- 🤖 **Telegram Interface** — Long polling, no web server needed
- 🧠 **Local LLM** — Connects to LM Studio on your network
- 🔄 **Model Switching** — Switch between 3 models mid-conversation
- 🌳 **Dynamic Skill Tree** — Modular tools loaded by category
- 💾 **Persistent Memory** — SQLite conversation history
- 📄 **File Analysis** — Upload .log, .txt, .json files for AI analysis
- 🌐 **Webhook Receiver** — Accept POST requests from n8n/automation tools
- 🔒 **Security** — User ID whitelist, safe script execution only

## Quick Start

### 1. Install

```bash
# Clone and install
git clone <your-repo-url>
cd bandclaw
chmod +x install.sh start.sh
./install.sh
```

### 2. Configure

Edit `.env` with your credentials:

```env
TELEGRAM_BOT_TOKEN="your-bot-token-here"
ALLOWED_USER_IDS="your-telegram-user-id"
LOCAL_LLM_URL="http://192.168.1.124:1234/v1"
DEFAULT_MODEL="qwen3.5-9b-uncensored-hauhaucs-aggressive"
```

### 3. Run

```bash
# Development (hot reload)
npm run dev

# Production (PM2 — 24/7)
./start.sh
```

## Telegram Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message |
| `/llm 1\|2\|3` | Switch active LLM model |
| `/clear` | Clear conversation history |
| `/s` | System status (model, CPU, RAM, uptime) |
| `/skills` | List all skill categories |
| `/skill enable <cat>` | Load skill category into LLM context |
| `/skill disable <cat>` | Unload skill category |

## Available Models

| # | Model |
|---|-------|
| 1 | DeepSeek R1 Qwen3 8B |
| 2 | Qwen 2.5 7B Tool Planning |
| 3 | Qwen 3.5 9B Uncensored |

## Skill Tree

| Category | Skills | Default |
|----------|--------|---------|
| **core** | `get_current_time` | ✅ Always on |
| **server** | `read_host_system`, `run_safe_script` | ⬜ On demand |

## Webhook

BandClaw runs a lightweight HTTP server on port 3000:

```bash
# Send a message to Telegram admin
curl -X POST http://localhost:3000 \
  -H "Content-Type: application/json" \
  -d '{"message": "Alert from n8n!", "source": "n8n"}'

# Health check
curl http://localhost:3000/health
```

## Project Structure

```
src/
├── index.ts          # Entry point
├── config.ts         # Environment config
├── db.ts             # SQLite database
├── llm.ts            # LM Studio client
├── agent.ts          # Agent loop
├── bot.ts            # Telegram bot
├── webhook.ts        # HTTP webhook
├── types.ts          # Shared types
└── skills/
    ├── manager.ts    # Skill registry
    ├── types.ts      # Skill interface
    ├── core/         # Core skills (always loaded)
    └── server/       # Server skills (on demand)
```

## Adding New Skills

1. Create a file in `src/skills/<category>/`:

```typescript
import type { Skill } from '../../types.js';

export const mySkill: Skill = {
  name: 'my_skill',
  description: 'What this skill does',
  category: 'my_category',
  schema: {
    type: 'function',
    function: {
      name: 'my_skill',
      description: 'What this skill does',
      parameters: {
        type: 'object',
        properties: {
          input: { type: 'string', description: 'Input parameter' }
        },
        required: ['input'],
      },
    },
  },
  execute: async (args) => {
    return JSON.stringify({ result: 'done' });
  },
};
```

2. Register in `src/index.ts`:

```typescript
import { mySkill } from './skills/my_category/my_skill.js';
skillManager.register(mySkill);
```

## License

MIT
