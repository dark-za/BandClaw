import { stat, writeFile, appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { config } from '../../config.js';
import type { Skill } from '../../types.js';

const MAX_WRITE_SIZE = 512 * 1024; // 512KB
const BLOCKLIST = ['.env', 'memory.db', 'node_modules', 'dist'];

export const writeFileSkill: Skill = {
  name: 'write_file',
  description: 'Writes or appends text to a file within the sandbox directory.',
  category: 'filesystem',
  schema: {
    type: 'function',
    function: {
      name: 'write_file',
      description: 'Writes or appends text to a file within the sandbox directory. Maximum write chunk is 512KB. Parent directories are created automatically.',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Relative path to the file to write, e.g., "notes.txt" or "logs/new.log".',
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

    // Security check: resolve path and ensure it's inside sandbox
    const resolvedPath = path.resolve(config.sandboxRoot, relativePath);
    if (!resolvedPath.startsWith(path.resolve(config.sandboxRoot))) {
      return JSON.stringify({ error: 'Access denied: Path is outside the sandbox directory.' });
    }

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
