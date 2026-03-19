import { execFile } from 'node:child_process';
import { access, constants } from 'node:fs/promises';
import path from 'node:path';
import type { Skill } from '../../types.js';

const SAFE_DIR = path.resolve(process.cwd(), 'safe_scripts');

export const runSafeScript: Skill = {
  name: 'run_safe_script',
  description:
    'Executes a pre-approved script from the safe_scripts directory. Only scripts explicitly placed in that directory can be run. Provide just the script filename (e.g., "restart_service.sh").',
  category: 'server',
  schema: {
    type: 'function',
    function: {
      name: 'run_safe_script',
      description:
        'Executes a pre-approved script from the safe_scripts directory. Only scripts explicitly placed in that directory can be run.',
      parameters: {
        type: 'object',
        properties: {
          script: {
            type: 'string',
            description: 'The filename of the script to execute (e.g., "restart_service.sh").',
          },
          args: {
            type: 'string',
            description: 'Optional space-separated arguments to pass to the script.',
          },
        },
        required: ['script'],
      },
    },
  },
  execute: async (params) => {
    const scriptName = params.script as string;
    const args = params.args ? (params.args as string).split(' ') : [];

    // Security: Prevent path traversal
    if (scriptName.includes('..') || scriptName.includes('/') || scriptName.includes('\\')) {
      return JSON.stringify({ error: 'Invalid script name. Path traversal is not allowed.' });
    }

    const scriptPath = path.join(SAFE_DIR, scriptName);

    // Verify the script resolves inside safe_scripts
    const resolved = path.resolve(scriptPath);
    if (!resolved.startsWith(SAFE_DIR)) {
      return JSON.stringify({ error: 'Script path resolves outside safe_scripts directory.' });
    }

    // Check file exists
    try {
      await access(scriptPath, constants.F_OK);
    } catch {
      return JSON.stringify({ error: `Script not found: ${scriptName}` });
    }

    // Execute the script
    return new Promise((resolve) => {
      const shell = process.platform === 'win32' ? 'powershell.exe' : '/bin/bash';
      const shellArgs = process.platform === 'win32'
        ? ['-ExecutionPolicy', 'Bypass', '-File', scriptPath, ...args]
        : [scriptPath, ...args];

      execFile(shell, shellArgs, { timeout: 30000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
        if (error) {
          resolve(
            JSON.stringify({
              success: false,
              error: error.message,
              stderr: stderr?.slice(0, 500) ?? '',
            }),
          );
          return;
        }
        resolve(
          JSON.stringify({
            success: true,
            stdout: stdout.slice(0, 2000),
            stderr: stderr?.slice(0, 500) ?? '',
          }),
        );
      });
    });
  },
};
