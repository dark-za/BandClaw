import type { Skill, CategoryInfo } from '../../interfaces/types.js';
import type { ChatCompletionTool } from 'openai/resources/chat/completions.js';

export class SkillManager {
  private skills: Map<string, Skill> = new Map();
  private categories: Map<string, Set<string>> = new Map(); // category → skill names
  private enabledCategories: Set<string> = new Set(['core']); // core always on by default

  // ─── Registration ────────────────────────────────────────────

  register(skill: Skill): void {
    this.skills.set(skill.name, skill);

    if (!this.categories.has(skill.category)) {
      this.categories.set(skill.category, new Set());
    }
    this.categories.get(skill.category)!.add(skill.name);

    console.log(`  📦 Registered skill: ${skill.name} [${skill.category}]`);
  }

  // ─── Category Management ─────────────────────────────────────

  enableCategory(category: string): boolean {
    if (!this.categories.has(category)) return false;
    this.enabledCategories.add(category);
    return true;
  }

  disableCategory(category: string): boolean {
    if (category === 'core') return false; // cannot disable core
    if (!this.categories.has(category)) return false;
    this.enabledCategories.delete(category);
    return true;
  }

  isCategoryEnabled(category: string): boolean {
    return this.enabledCategories.has(category);
  }

  listCategories(): CategoryInfo[] {
    const result: CategoryInfo[] = [];
    for (const [name, skillNames] of this.categories) {
      result.push({
        name,
        skills: Array.from(skillNames),
        enabled: this.enabledCategories.has(name),
      });
    }
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }

  // ─── Active Tools for LLM ───────────────────────────────────

  getActiveTools(): ChatCompletionTool[] {
    const tools: ChatCompletionTool[] = [];

    for (const category of this.enabledCategories) {
      const skillNames = this.categories.get(category);
      if (!skillNames) continue;

      for (const name of skillNames) {
        const skill = this.skills.get(name);
        if (skill) {
          tools.push(skill.schema as ChatCompletionTool);
        }
      }
    }

    return tools;
  }

  getActiveSkillNames(): string[] {
    const names: string[] = [];
    for (const category of this.enabledCategories) {
      const skillNames = this.categories.get(category);
      if (skillNames) names.push(...skillNames);
    }
    return names;
  }

  // ─── Execution ───────────────────────────────────────────────

  async executeTool(name: string, args: Record<string, unknown>): Promise<string> {
    const skill = this.skills.get(name);
    if (!skill) {
      return JSON.stringify({ error: `Unknown tool: ${name}` });
    }

    // Verify the skill's category is enabled
    if (!this.enabledCategories.has(skill.category)) {
      return JSON.stringify({
        error: `Tool "${name}" belongs to disabled category "${skill.category}". Enable it with /skill enable ${skill.category}`,
      });
    }

    try {
      return await skill.execute(args);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`❌ Skill execution error [${name}]:`, message);
      return JSON.stringify({ error: `Tool execution failed: ${message}` });
    }
  }
}

// Singleton instance
export const skillManager = new SkillManager();
