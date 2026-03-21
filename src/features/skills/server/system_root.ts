import { stat, readFile, writeFile, appendFile, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import type { Skill } from '../../../interfaces/types.js';

export const systemRootSkill: Skill = {
  name: 'system_root',
  description: 'Unrestricted full filesystem access. Allows reading, writing, deleting, and listing any absolute path on the server OS.',
  category: 'server',
  schema: {
    type: 'function',
    function: {
      name: 'system_root',
      description: 'Provides unrestricted root-level access to the server filesystem without sandbox limitations. Be extremely careful.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['read', 'write', 'delete', 'list'],
            description: 'The filesystem action to perform.',
          },
          path: {
            type: 'string',
            description: 'Absolute path to the target file or directory.',
          },
          content: {
            type: 'string',
            description: 'Text content for "write" action. Omit for others.',
          },
          append: {
            type: 'boolean',
            description: 'If true for "write", appends instead of overwrites.',
          },
        },
        required: ['action', 'path'],
      },
    },
  },
  execute: async (params) => {
    const action = params.action as string;
    const targetPath = path.resolve(params.path as string);
    const content = (params.content as string) || '';
    const append = (params.append as boolean) || false;

    try {
      switch (action) {
        case 'list': {
          const entries = await readdir(targetPath, { withFileTypes: true });
          const items = entries.map(e => ({
            name: e.name,
            isDirectory: e.isDirectory(),
            isFile: e.isFile(),
          }));
          return JSON.stringify({ success: true, path: targetPath, items });
        }
        case 'read': {
          const fileStat = await stat(targetPath);
          if (!fileStat.isFile()) return JSON.stringify({ error: 'Path is not a regular file.' });
          
          if (fileStat.size > 2 * 1024 * 1024) {
             return JSON.stringify({ error: `File too large (max 2MB). Size: ${fileStat.size} bytes.` });
          }

          const fileContent = await readFile(targetPath);
          const isBinary = fileContent.subarray(0, 8192).includes(0);
          if (isBinary) return JSON.stringify({ error: 'Cannot read binary files.' });

          return JSON.stringify({ success: true, path: targetPath, content: fileContent.toString('utf-8') });
        }
        case 'write': {
          if (append) {
            await appendFile(targetPath, content, 'utf-8');
          } else {
            await writeFile(targetPath, content, 'utf-8');
          }
          return JSON.stringify({ success: true, action: append ? 'appended' : 'written', path: targetPath });
        }
        case 'delete': {
          await rm(targetPath, { recursive: true, force: true });
          return JSON.stringify({ success: true, action: 'deleted', path: targetPath });
        }
        default:
          return JSON.stringify({ error: `Unknown action: ${action}` });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return JSON.stringify({ error: `System root action failed: ${message}` });
    }
  },
};
