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

export const searchMarkdownSkills: Skill = {
  name: 'search_markdown_skills',
  description: 'Search for available Markdown-based workflow skills installed on the system. Returns a list of skill names that you can then load using load_markdown_skill.',
  category: 'knowledge',
  schema: {
    type: 'function',
    function: {
      name: 'search_markdown_skills',
      description: 'Search for available Markdown-based workflow skills installed on the system.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Optional search term to filter skill names (e.g., "python", "react", "security").',
          },
        },
      },
    },
  },
  execute: async (args: Record<string, unknown>) => {
    const query = typeof args.query === 'string' ? args.query.toLowerCase() : '';
    const foundSkills = new Set<string>();

    for (const basePath of SKILL_PATHS) {
      try {
        const stats = await fs.stat(basePath);
        if (stats.isDirectory()) {
          const entries = await fs.readdir(basePath, { withFileTypes: true });
          for (const entry of entries) {
            if (entry.isDirectory()) {
              if (!query || entry.name.toLowerCase().includes(query)) {
                foundSkills.add(entry.name);
              }
            }
          }
        }
      } catch (err) {
        // Path doesn't exist or isn't accessible, ignore
      }
    }

    if (foundSkills.size === 0) {
      return JSON.stringify({ message: 'No Markdown skills found. The user might need to run the ai-coding-setup-main install script first.' });
    }

    return JSON.stringify({
      total: foundSkills.size,
      skills: Array.from(foundSkills).sort(),
    });
  },
};
