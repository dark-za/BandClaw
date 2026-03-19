import { access, stat, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { config } from '../../../infrastructure/config.js';
import type { Skill } from '../../../interfaces/types.js';

const MAX_READ_SIZE = 1024 * 1024; // 1MB

export const readFileSkill: Skill = {
  name: 'read_file',
  description: 'Reads the contents of a file within the sandbox directory.',
  category: 'filesystem',
  schema: {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Reads the contents of a file within the sandbox directory. Maximum file size is 1MB.',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Relative path to the file to read, e.g., "notes.txt" or "logs/error.log".',
          },
        },
        required: ['path'],
      },
    },
  },
  execute: async (params) => {
    const relativePath = params.path as string;

    // Security check: resolve path and ensure it's inside sandbox
    const resolvedPath = path.resolve(config.sandboxRoot, relativePath);
    if (!resolvedPath.startsWith(path.resolve(config.sandboxRoot))) {
      return JSON.stringify({ error: 'Access denied: Path is outside the sandbox directory.' });
    }

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
