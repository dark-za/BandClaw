import { exec } from 'node:child_process';
import util from 'node:util';
import type { Skill } from '../../../interfaces/types.js';

const execAsync = util.promisify(exec);

export const gogWorkspaceSkill: Skill = {
  name: 'gog_workspace',
  description: 'Use the `gog` CLI to interact with Gmail, Calendar, Drive, Contacts, Sheets, and Docs.',
  category: 'integrations',
  schema: {
    type: 'function',
    function: {
      name: 'gog_workspace',
      description: 'Interface with Google Workspace using the `gog` CLI.',
      parameters: {
        type: 'object',
        properties: {
          service: {
            type: 'string',
            enum: ['gmail', 'calendar', 'drive', 'contacts', 'sheets', 'docs', 'auth'],
            description: 'The Google Workspace service to interact with.',
          },
          subcommand: {
            type: 'string',
            description: 'The specific command for the service (e.g., search, send, list, get, events).',
          },
          arguments: {
            type: 'string',
            description: 'Additional arguments or flags for the command (e.g., "query --max 10" or "sheetId Range --json").',
          },
        },
        required: ['service', 'subcommand'],
      },
    },
  },
  execute: async (args: Record<string, unknown>) => {
    const { service, subcommand, arguments: cmdArgs = '' } = args;

    if (!service || !subcommand) {
      return JSON.stringify({ error: 'Both service and subcommand are required to run a gog command.' });
    }

    const cmd = `gog ${service} ${subcommand} ${cmdArgs} --json`;

    try {
      const { stdout } = await execAsync(cmd);
      let parsedOut = stdout;
      try { parsedOut = JSON.parse(stdout); } catch { /* Ignore if it's not valid JSON */ }
      
      return JSON.stringify({ status: 'success', data: parsedOut });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return JSON.stringify({ status: 'error', message: msg, hint: 'Ensure gog CLI is installed and authenticated via gog auth add' });
    }
  },
};
