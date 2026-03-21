import { exec } from 'node:child_process';
import util from 'node:util';
import type { Skill } from '../../../interfaces/types.js';

const execAsync = util.promisify(exec);

export const casaosManagerSkill: Skill = {
  name: 'casaos_manager',
  description: 'Manage CasaOS applications, system configuration, and docker containers with high proficiency.',
  category: 'server',
  schema: {
    type: 'function',
    function: {
      name: 'casaos_manager',
      description: `
Executes CasaOS specific commands and docker commands to manage OS services.
CasaOS operates primarily through:
1. \`casaos-cli\` (e.g., \`casaos-cli app-management list\`, \`casaos-cli sys\`).
2. Docker / Docker Compose files located under \`/var/lib/casaos/apps/\` or \`/etc/casaos/\`.
3. Systemctl for core casaos services (casaos.service, casaos-gateway.service).

Use this skill to start, stop, restart, list apps, view logs, or query the CasaOS backend APIs.
`,
      parameters: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: 'The CasaOS CLI, Systemctl, or Docker command to execute (e.g., "casaos-cli app-management list" or "docker ps").',
          },
        },
        required: ['command'],
      },
    },
  },
  execute: async (params) => {
    const cmd = params.command as string;
    
    if (!cmd) {
      return JSON.stringify({ error: 'Command parameter missing.' });
    }

    try {
      const { stdout, stderr } = await execAsync(cmd, { timeout: 45000, maxBuffer: 1024 * 1024 * 5 });
      
      return JSON.stringify({
        success: true,
        stdout: stdout.trim() || undefined,
        stderr: stderr.trim() || undefined
      });
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        exitCode: error.code || 'UNKNOWN',
        error: error.message,
        stdout: (error.stdout || '').trim(),
        stderr: (error.stderr || '').trim()
      });
    }
  },
};
