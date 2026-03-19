import { stat, writeFile, appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import type { Skill } from '../../../interfaces/types.js';
import { config } from '../../../infrastructure/config.js';

const MAX_WRITE_SIZE = 512 * 1024; // 512KB
const BLOCKLIST = ['.env', 'memory.db', 'node_modules', 'dist'];

export const writeFileSkill: Skill = {
  name: 'write_file',
  description: 'Writes or appends text to any file on the system.',
  category: 'filesystem',
  schema: {
    type: 'function',
    function: {
      name: 'write_file',
      description: 'Writes or appends text to any file on the system using absolute or relative paths. Maximum write chunk is 512KB. Parent directories are created automatically.',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Path (absolute or relative) to the file to write, e.g., "notes.txt" or "/var/log/custom.log".',
          },
          content: {
            type: 'string',
            description: 'The text content to write or append.',
          },
          append: {
            type: 'boolean',
            description: 'If true, appends content to the end of the file. If false, overwrites the file. Default is false.',
          },
        },
        required: ['path', 'content'],
      },
    },
  },
  execute: async (params) => {
    const relativePath = params.path as string;
    const content = params.content as string;
    const append = (params.append as boolean) ?? false;

    // Blocklist check
    if (BLOCKLIST.some((blocked) => relativePath.includes(blocked))) {
      return JSON.stringify({ error: `Access denied: Target path contains blocked keyword.` });
    }

    const resolvedPath = path.resolve(config.sandboxRoot, relativePath);

    const byteLength = Buffer.byteLength(content, 'utf8');
    if (byteLength > MAX_WRITE_SIZE) {
      return JSON.stringify({ error: `Content too large (max 512KB). Current size: ${byteLength} bytes.` });
    }

    try {
      // Ensure directory exists
      const dir = path.dirname(resolvedPath);
      await mkdir(dir, { recursive: true });

      if (append) {
        await appendFile(resolvedPath, content, 'utf-8');
      } else {
        await writeFile(resolvedPath, content, 'utf-8');
      }

      const fileStat = await stat(resolvedPath);

      return JSON.stringify({
        success: true,
        action: append ? 'appended' : 'written',
        bytes: byteLength,
        totalFileSize: fileStat.size,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return JSON.stringify({ error: `Failed to write file: ${message}` });
    }
  },
};
