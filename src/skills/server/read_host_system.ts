import os from 'node:os';
import { execSync } from 'node:child_process';
import type { Skill } from '../../types.js';

function getCpuUsage(): string {
  const cpus = os.cpus();
  const totalIdle = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
  const totalTick = cpus.reduce(
    (acc, cpu) => acc + cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq,
    0,
  );
  const usage = ((1 - totalIdle / totalTick) * 100).toFixed(1);
  return `${usage}%`;
}

function getDiskUsage(): object {
  try {
    if (process.platform === 'win32') {
      const output = execSync('wmic logicaldisk get size,freespace,caption', { encoding: 'utf-8' });
      const lines = output.trim().split('\n').slice(1);
      const disks = lines
        .map((line) => {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 3) {
            const caption = parts[0];
            const freeSpace = parseInt(parts[1], 10);
            const size = parseInt(parts[2], 10);
            if (!isNaN(freeSpace) && !isNaN(size) && size > 0) {
              return {
                drive: caption,
                total: `${(size / 1073741824).toFixed(1)} GB`,
                free: `${(freeSpace / 1073741824).toFixed(1)} GB`,
                used: `${(((size - freeSpace) / size) * 100).toFixed(1)}%`,
              };
            }
          }
          return null;
        })
        .filter(Boolean);
      return { disks };
    } else {
      const output = execSync("df -h / | tail -1 | awk '{print $2,$3,$4,$5}'", { encoding: 'utf-8' });
      const [total, used, available, usePercent] = output.trim().split(' ');
      return { total, used, available, usePercent };
    }
  } catch {
    return { error: 'Could not read disk info' };
  }
}

export const readHostSystem: Skill = {
  name: 'read_host_system',
  description: 'Reads comprehensive system information including CPU, memory, disk usage, OS details, and uptime of the hosting server.',
  category: 'server',
  schema: {
    type: 'function',
    function: {
      name: 'read_host_system',
      description: 'Reads comprehensive system information including CPU, memory, disk usage, OS details, and uptime of the hosting server.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  execute: async () => {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    const info = {
      os: {
        platform: os.platform(),
        type: os.type(),
        release: os.release(),
        arch: os.arch(),
        hostname: os.hostname(),
      },
      cpu: {
        model: os.cpus()[0]?.model ?? 'Unknown',
        cores: os.cpus().length,
        usage: getCpuUsage(),
      },
      memory: {
        total: `${(totalMem / 1073741824).toFixed(2)} GB`,
        used: `${(usedMem / 1073741824).toFixed(2)} GB`,
        free: `${(freeMem / 1073741824).toFixed(2)} GB`,
        usagePercent: `${((usedMem / totalMem) * 100).toFixed(1)}%`,
      },
      disk: getDiskUsage(),
      uptime: {
        system: `${(os.uptime() / 3600).toFixed(1)} hours`,
        process: `${(process.uptime() / 3600).toFixed(2)} hours`,
      },
      node: {
        version: process.version,
        pid: process.pid,
      },
    };

    return JSON.stringify(info, null, 2);
  },
};
