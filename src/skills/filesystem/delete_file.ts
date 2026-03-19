import { rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { config } from '../../config.js';
import type { Skill } from '../../types.js';

const BLOCKLIST = ['.env', 'memory.db', 'node_modules', 'dist', '.git'];

export const deleteFileSkill: Skill = {
  name: 'delete_file',
  description: 'Deletes a specified file within the sandbox directory.',
  category: 'filesystem',
  schema: {
    type: 'function',
    function: {
      name: 'delete_file',
      description: 'Deletes a specified file within the sandbox directory. Cannot delete directories, only regular files.',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Relative path to the file to delete.',
          },
        },
        required: ['path'],
      },
    },
  },
  execute: async (params) => {
    const relativePath = params.path as string;

    // Blocklist check
    if (BLOCKLIST.some((blocked) => relativePath.includes(blocked))) {
      return JSON.stringify({ error: `Access denied: Target path contains blocked keyword.` });
    }

    // Security check: resolve path and ensure it's inside sandbox
    const resolvedPath = path.resolve(config.sandboxRoot, relativePath);
    if (!resolvedPath.startsWith(path.resolve(config.sandboxRoot))) {
      return JSON.stringify({ error: 'Access denied: Path is outside the sandbox directory.' });
    }

    try {
      const fileStat = await stat(resolvedPath);

      if (fileStat.isDirectory()) {
        return JSON.stringify({ error: 'Path is a directory. This tool can only delete files.' });
      }

      await rm(resolvedPath);

      return JSON.stringify({
        success: true,
        message: `File deleted successfully: ${relativePath}`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return JSON.stringify({ error: 'File not found.' });
      }
      return JSON.stringify({ error: `Failed to delete file: ${message}` });
    }
  },
};
