import * as fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import type { Skill } from '../../../interfaces/types.js';

const SKILL_PATHS = [
  path.join(os.homedir(), '.gemini', 'antigravity', 'global_skills'),
  path.join(os.homedir(), '.claude', 'skills'),
  path.join(os.homedir(), '.codex', 'skills'),
  path.resolve(process.cwd(), 'src/features/skills/core/ai-coding-setup-main/skills-inventory')
];

export const loadMarkdownSkill: Skill = {
  name: 'load_markdown_skill',
  description: 'Load and read the full contents of a Markdown-based skill (SKILL.md) to understand best practices, rules, or workflows.',
  category: 'knowledge',
  schema: {
    type: 'function',
    function: {
      name: 'load_markdown_skill',
      description: 'Load and read the full contents of a Markdown-based skill (SKILL.md).',
      parameters: {
        type: 'object',
        properties: {
          skill_name: {
            type: 'string',
            description: 'The exact name of the skill directory to load (e.g., "python-pro", "systematic-debugging"). Use search_markdown_skills to find exact names.',
          },
        },
        required: ['skill_name'],
      },
    },
  },
  execute: async (args: Record<string, unknown>) => {
    const skillName = args.skill_name as string;
    
    if (!skillName) {
      return JSON.stringify({ error: 'skill_name is required' });
    }

    for (const basePath of SKILL_PATHS) {
      const skillPath = path.join(basePath, skillName, 'SKILL.md');
      try {
        const stats = await fs.stat(skillPath);
        if (stats.isFile()) {
          const content = await fs.readFile(skillPath, 'utf8');
          return content; // Return raw markdown so the agent can read the instructions
        }
      } catch (err) {
        // File doesn't exist in this path, check next
      }
    }

    return JSON.stringify({ error: `Skill "${skillName}" not found in any of the configured global paths.` });
  },
};
