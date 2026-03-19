import { exec } from 'node:child_process';
import util from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { Skill } from '../../../interfaces/types.js';

const execAsync = util.promisify(exec);

export const taskMasterSkill: Skill = {
  name: 'task_master',
  description: 'Manage tasks via the task-master-ai CLI and parse PRDs into actionable plans.',
  category: 'integrations',
  schema: {
    type: 'function',
    function: {
      name: 'task_master',
      description: 'Interact with the task-master-ai context to isolate tasks and generate worklists.',
      parameters: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            enum: ['init', 'parse', 'list'],
            description: 'The task-master command to run.',
          },
          prdContent: {
            type: 'string',
            description: 'The content of the PRD (only required if command is parse).',
          },
        },
        required: ['command'],
      },
    },
  },
  execute: async (args: Record<string, unknown>) => {
    const command = args.command as string;
    const prdContent = args.prdContent as string;

    try {
      if (command === 'init') {
        // Run global initialization if npx allows it
        const { stdout } = await execAsync('npx -y task-master-ai init');
        return JSON.stringify({ status: 'success', output: stdout.trim() });
      }

      if (command === 'parse') {
        if (!prdContent) return JSON.stringify({ error: 'prdContent is required for parsing.' });
        
        // Write the PRD to the standard location
        const docsPath = path.resolve(process.cwd(), '.taskmaster', 'docs');
        await fs.mkdir(docsPath, { recursive: true });
        await fs.writeFile(path.join(docsPath, 'prd.txt'), prdContent, 'utf8');

        // Execute parsing
        const { stdout, stderr } = await execAsync('npx -y task-master-ai parse');
        return JSON.stringify({ status: 'success', task_generation_log: stdout || stderr });
      }

      if (command === 'list') {
        const { stdout, stderr } = await execAsync('npx -y task-master-ai list');
        return JSON.stringify({ status: 'success', tasks: stdout || stderr });
      }

      return JSON.stringify({ error: 'Invalid task master command.' });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return JSON.stringify({ status: 'error', message: msg, hint: 'task-master-ai may not be installed globally or locally.' });
    }
  },
};
