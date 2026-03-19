import { exec } from 'node:child_process';
import util from 'node:util';
import type { Skill } from '../../../interfaces/types.js';

const execAsync = util.promisify(exec);

export const terminalMasterSkill: Skill = {
  name: 'terminal_master',
  description: 'Execute raw shell commands on the host machine. Use this for deep system analysis, file manipulation, networking, and custom script execution.',
  category: 'server',
  schema: {
    type: 'function',
    function: {
      name: 'terminal_master',
      description: "Execute arbitrary terminal/shell commands with the user's privileges. WARNING: Be very careful. ONLY execute non-interactive commands. Commands that open interactive editors (like nano, vim) or endless streams (top, ping without -c) WILL freeze the agent. Use flags like -y, --non-interactive, or -c for ping.",
      parameters: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: 'The shell command to execute. Examples: "ls -la /var/log", "npm install -g something", "ping -c 4 8.8.8.8"',
          },
          timeout_sec: {
            type: 'number',
            description: 'Optional. Maximum timeout in seconds before force-killing the command. Default is 30 seconds. Do not exceed 60.',
          },
        },
        required: ['command'],
      },
    },
  },
  execute: async (args: Record<string, unknown>) => {
    const cmd = args.command as string;
    
    // Default 30s timeout, max 60s
    let timeoutSec = typeof args.timeout_sec === 'number' ? args.timeout_sec : 30;
    if (timeoutSec > 60) timeoutSec = 60;
    if (timeoutSec < 5) timeoutSec = 5;

    if (!cmd || typeof cmd !== 'string') {
      return JSON.stringify({ error: 'Command parameter is required and must be a string.' });
    }

    try {
      const { stdout, stderr } = await execAsync(cmd, { 
        timeout: timeoutSec * 1000,
        maxBuffer: 1024 * 1024 * 5 // 5MB buffer limit to prevent RAM crashes on huge outputs
      });
      
      return JSON.stringify({
        status: 'success',
        exitCode: 0,
        stdout: stdout.trim() || 'Command executed silently (no output)',
        stderr: stderr.trim() || null
      });
    } catch (error: any) {
      // execAsync throws on non-zero exit code or timeout
      const isTimeout = error.killed && error.signal === 'SIGTERM';
      
      return JSON.stringify({
        status: isTimeout ? 'timeout' : 'error',
        exitCode: error.code || (isTimeout ? 'TIMEOUT' : 'UNKNOWN'),
        stdout: (error.stdout || '').trim(),
        stderr: (error.stderr || '').trim(),
        message: error.message
      });
    }
  },
};
