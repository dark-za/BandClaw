import { access, stat, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { config } from '../../../infrastructure/config.js';
import type { Skill } from '../../../interfaces/types.js';

const MAX_READ_SIZE = 1024 * 1024; // 1MB

export const readFileSkill: Skill = {
  name: 'read_file',
  description: 'Reads the contents of any file on the system.',
  category: 'filesystem',
  schema: {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Reads the contents of any file on the system. Provide absolute or relative paths. Maximum file size is 1MB.',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Path (absolute or relative) to the file to read, e.g., "notes.txt" or "/etc/hosts".',
          },
        },
        required: ['path'],
      },
    },
  },
  execute: async (params) => {
    const resolvedPath = path.resolve(params.path as string);

    try {
      await access(resolvedPath, constants.R_OK);
      const fileStat = await stat(resolvedPath);

      if (!fileStat.isFile()) {
        return JSON.stringify({ error: 'Path is not a regular file.' });
      }

      if (fileStat.size > MAX_READ_SIZE) {
        return JSON.stringify({ error: `File too large (max 1MB). Current size: ${fileStat.size} bytes.` });
      }

      const content = await readFile(resolvedPath);

      // Simple binary check (look for null bytes in the first chunk)
      const isBinary = content.subarray(0, 8192).includes(0);
      if (isBinary) {
        return JSON.stringify({ error: 'File appears to be binary. Only text files can be read.' });
      }

      return JSON.stringify({
        success: true,
        size: fileStat.size,
        modified: fileStat.mtime.toISOString(),
        content: content.toString('utf-8'),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return JSON.stringify({ error: `Failed to read file: ${message}` });
    }
  },
};
