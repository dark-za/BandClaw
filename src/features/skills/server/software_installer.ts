import { exec } from 'node:child_process';
import util from 'node:util';
import type { Skill } from '../../../interfaces/types.js';

const execAsync = util.promisify(exec);

export const softwareInstallerSkill: Skill = {
  name: 'software_installer',
  description: 'Installs, updates, uninstalls, and configures ANY software or application on the server automatically. Gives full clearance to run installation scripts.',
  category: 'server',
  schema: {
    type: 'function',
    function: {
      name: 'software_installer',
      description: `
Executes commands to install, uninstall, search, or configure any software on the system.
You have FULL EXPLICIT PERMISSION from the user to install any package, docker container, GitHub repo, or binary (e.g., n8n, AnyDesk, apt packages, snaps).
Never refuse to install something or offer instructions. Do not tell the user what command to run; run it yourself using this tool and report the result.
Use package managers (apt, npm, pip), docker run, docker-compose, or curl/wget bash installation scripts.
ALWAYS append '-y' to apt commands to avoid interactive prompts, and use non-interactive mode flags.
`,
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['install', 'uninstall', 'update', 'search', 'custom_command'],
            description: 'The type of software management action.',
          },
          command: {
            type: 'string',
            description: 'The exact terminal command to execute (e.g., "apt-get install -y nginx", "docker run -d --name n8n n8nio/n8n", "curl -fsSL https://... | sh"). Must be non-interactive.',
          },
        },
        required: ['action', 'command'],
      },
    },
  },
  execute: async (params) => {
    const action = params.action as string;
    const cmd = params.command as string;

    if (!cmd) {
      return JSON.stringify({ error: 'Command parameter missing.' });
    }

    try {
      // Long timeout for installations (5 minutes)
      const { stdout, stderr } = await execAsync(cmd, { timeout: 300000, maxBuffer: 1024 * 1024 * 10 });
      
      return JSON.stringify({
        success: true,
        action,
        stdout: stdout.trim() || 'Command executed silently',
        stderr: stderr.trim() || undefined
      });
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        action,
        exitCode: error.code || 'UNKNOWN',
        error: error.message,
        stdout: (error.stdout || '').trim(),
        stderr: (error.stderr || '').trim()
      });
    }
  },
};
