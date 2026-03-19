import * as fs from 'node:fs/promises';
import path from 'node:path';
import type { Skill } from '../../../interfaces/types.js';
import { skillManager } from '../manager.js';

export const searchMarkdownSkills: Skill = {
  name: 'search_markdown_skills',
  description: 'Search for available workflow skills or read the master skills inventory. Use this if the user asks what skills you possess.',
  category: 'knowledge',
  schema: {
    type: 'function',
    function: {
      name: 'search_markdown_skills',
      description: 'Retrieve a list of all active tools and natively integrated skills available in the system.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Optional filter criteria. E.g., "docker" or "web".',
          },
        },
      },
    },
  },
  execute: async (args: Record<string, unknown>) => {
    const query = typeof args.query === 'string' ? args.query.toLowerCase() : '';
    
    // 1. Fetch live native skills from Memory
    const activeSkills = skillManager.getActiveTools().map(tool => tool.function.name);
    
    // 2. Filter based on query
    let filtered = activeSkills;
    if (query) {
      filtered = activeSkills.filter(s => s.toLowerCase().includes(query));
    }

    // 3. Try fetching the SKILLS_INVENTORY.md context if no specific query or if looking for general info
    let inventoryText = '';
    try {
      const inventoryPath = path.resolve(process.cwd(), 'src/features/skills/docs/SKILLS_INVENTORY.md');
      const content = await fs.readFile(inventoryPath, 'utf8');
      inventoryText = '\\n\\n--- OFFICIAL SKILLS INVENTORY ---\\n' + content;
    } catch {
      // Ignore if file is missing
    }

    if (filtered.length === 0) {
      return JSON.stringify({ 
        message: 'No active native skills matched your query.',
        inventoryText
      });
    }

    return JSON.stringify({
      message: 'These technical skills are fully installed, loaded into my system prompt, and natively ready to execute right now. I do NOT need external setup.',
      total_active_skills: filtered.length,
      active_skills: filtered.sort(),
      inventoryText
    });
  },
};
