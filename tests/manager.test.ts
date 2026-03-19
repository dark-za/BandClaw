import { describe, it, expect, beforeEach } from 'vitest';
import { skillManager } from '../src/features/skills/manager.js';
import type { Skill } from '../src/interfaces/types.js';

describe('SkillManager', () => {
  beforeEach(() => {
    // Reset or ensure some state if needed
  });

  it('should register and execute a skill correctly', async () => {
    const dummySkill: Skill = {
      name: 'test_skill',
      description: 'A test skill',
      category: 'tests',
      schema: {
        type: 'function',
        function: {
          name: 'test_skill',
          description: 'test',
          parameters: { type: 'object', properties: {} }
        }
      },
      execute: async (args) => {
        return JSON.stringify({ status: 'success', args });
      }
    };

    skillManager.register(dummySkill);
    
    // Check if it exists
    const categories = skillManager.listCategories();
    const testCat = categories.find(c => c.name === 'tests');
    expect(testCat).toBeDefined();
    expect(testCat?.skills).toContain('test_skill');

    // Execute it
    const resultStr = await skillManager.executeTool('test_skill', { foo: 'bar' });
    const result = JSON.parse(resultStr);
    expect(result.status).toBe('success');
    expect(result.args.foo).toBe('bar');
  });

  it('should return error text for unhandled skills', async () => {
    const resultStr = await skillManager.executeTool('non_existent', {});
    const result = JSON.parse(resultStr);
    expect(result.error).toContain('Unknown tool');
  });
});
