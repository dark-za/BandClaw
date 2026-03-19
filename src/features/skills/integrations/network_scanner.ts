import { exec } from 'node:child_process';
import os from 'node:os';
import util from 'node:util';
import type { Skill } from '../../../interfaces/types.js';

const execAsync = util.promisify(exec);

export const networkScannerSkill: Skill = {
  name: 'network_security_scanner',
  description: 'Perform local network security scanning and interface discovery.',
  category: 'integrations',
  schema: {
    type: 'function',
    function: {
      name: 'network_security_scanner',
      description: 'Perform advanced security checks, enumerate network interfaces, and run local ARP scans.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['list-interfaces', 'arp-scan', 'routing-table'],
            description: 'The scan action to perform on the local machine.',
          },
        },
        required: ['action'],
      },
    },
  },
  execute: async (args: Record<string, unknown>) => {
    const action = args.action as string;

    try {
      if (action === 'list-interfaces') {
        const interfaces = os.networkInterfaces();
        return JSON.stringify({ status: 'success', data: interfaces });
      }

      if (action === 'arp-scan') {
        const cmd = os.platform() === 'win32' ? 'arp -a' : 'arp -a || /usr/sbin/arp -a';
        const { stdout } = await execAsync(cmd);
        return JSON.stringify({ status: 'success', output: stdout.trim() });
      }

      if (action === 'routing-table') {
        const cmd = os.platform() === 'win32' ? 'route print' : 'netstat -rn';
        const { stdout } = await execAsync(cmd);
        return JSON.stringify({ status: 'success', output: stdout.trim() });
      }

      return JSON.stringify({ error: 'Unknown action specified.' });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return JSON.stringify({ status: 'error', message: msg, hint: 'Network commands might require elevated privileges.' });
    }
  },
};
