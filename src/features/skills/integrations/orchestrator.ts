import fs from 'node:fs/promises';
import path from 'node:path';
import type { Skill } from '../../../interfaces/types.js';

export const agentOrchestratorSkill: Skill = {
  name: 'agent_orchestrator',
  description: 'Manage parallel worker agents and read execution plans.',
  category: 'integrations',
  schema: {
    type: 'function',
    function: {
      name: 'agent_orchestrator',
      description: 'Interact with Agent Mail configurations and read execution plans (history/feature/execution-plan.md).',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['read_plan', 'update_mail'],
            description: 'Action to perform as an orchestrator.',
          },
          featureName: {
            type: 'string',
            description: 'Name of the feature/epic track (required for read_plan).',
          },
          mailContent: {
            type: 'string',
            description: 'Content to push to the agent mail ledger (required for update_mail).',
          },
        },
        required: ['action'],
      },
    },
  },
  execute: async (args: Record<string, unknown>) => {
    const action = args.action as string;
    const featureName = args.featureName as string;
    const mailContent = args.mailContent as string;

    try {
      if (action === 'read_plan') {
        if (!featureName) return JSON.stringify({ error: 'featureName is required.' });
        
        const planPath = path.resolve(process.cwd(), 'history', featureName, 'execution-plan.md');
        try {
          const content = await fs.readFile(planPath, 'utf8');
          return JSON.stringify({ status: 'success', content });
        } catch (e: any) {
          if (e.code === 'ENOENT') {
            return JSON.stringify({ error: `Execution plan for feature '${featureName}' does not exist.` });
          }
          throw e;
        }
      }

      if (action === 'update_mail') {
        if (!mailContent) return JSON.stringify({ error: 'mailContent is required.' });
        
        const mailDir = path.resolve(process.cwd(), 'history', '.agent-mail');
        await fs.mkdir(mailDir, { recursive: true });
        
        const mailFile = path.join(mailDir, `msg_\${Date.now()}.md`);
        await fs.writeFile(mailFile, mailContent, 'utf8');
        
        return JSON.stringify({ status: 'success', message: 'Agent mail delivered.', file: mailFile });
      }

      return JSON.stringify({ error: 'Unknown orchestrator action.' });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return JSON.stringify({ status: 'error', message: msg });
    }
  },
};
