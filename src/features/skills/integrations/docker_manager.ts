import { exec } from 'node:child_process';
import util from 'node:util';
import type { Skill } from '../../../interfaces/types.js';

const execAsync = util.promisify(exec);

export const dockerManagerSkill: Skill = {
  name: 'docker_manager',
  description: 'Manage Docker containers gracefully: start, stop, restart, list, inspect, or fetch logs.',
  category: 'integrations',
  schema: {
    type: 'function',
    function: {
      name: 'docker_manager',
      description: 'Manage Docker containers and services autonomously using native docker CLI commands.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['list', 'start', 'stop', 'restart', 'logs', 'inspect', 'stats'],
            description: 'The Docker action to perform.',
          },
          container: {
            type: 'string',
            description: 'The name or ID of the container (required for all actions except list and stats).',
          },
          lines: {
            type: 'number',
            description: 'Number of log lines to fetch (only used if action is logs). Default is 50.',
          },
        },
        required: ['action'],
      },
    },
  },
  execute: async (args: Record<string, unknown>) => {
    const action = args.action as string;
    const container = args.container as string | undefined;
    const lines = typeof args.lines === 'number' ? args.lines : 50;

    let cmd = '';

    switch (action) {
      case 'list':
        cmd = 'docker ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"';
        break;
      case 'stats':
        cmd = 'docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"';
        break;
      case 'start':
      case 'stop':
      case 'restart':
      case 'inspect':
        if (!container) return JSON.stringify({ error: 'Container name or ID is required for this action.' });
        cmd = `docker ${action} ${container}`;
        break;
      case 'logs':
        if (!container) return JSON.stringify({ error: 'Container name or ID is required to fetch logs.' });
        cmd = `docker logs --tail ${lines} ${container}`;
        break;
      default:
        return JSON.stringify({ error: 'Unknown Docker action specified.' });
    }

    try {
      const { stdout, stderr } = await execAsync(cmd);
      if (stderr && !stdout) {
        return JSON.stringify({ status: 'warning', output: stderr.trim() });
      }
      return JSON.stringify({ status: 'success', output: stdout.trim() });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return JSON.stringify({ status: 'error', message: msg });
    }
  },
};
