import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import type { Skill } from '../../../interfaces/types.js';
import { config } from '../../../infrastructure/config.js';

const MAX_ENTRIES = 200;
const MAX_DEPTH = 3;

interface FileEntry {
  name: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: string;
  children?: FileEntry[];
}

async function scanDirectory(dirPath: string, relativeRoot: string, depth: number): Promise<FileEntry[]> {
  if (depth > MAX_DEPTH) {
    return [];
  }

  const entries = await readdir(dirPath, { withFileTypes: true });
  // Ignore dot files like .git or .env in scanning
  const filtered = entries.filter((e) => !e.name.startsWith('.'));
  
  if (filtered.length > MAX_ENTRIES) {
    throw new Error(`Directory too large. Found over ${MAX_ENTRIES} items. Please specify a more targeted subfolder.`);
  }

  const results: FileEntry[] = [];
  
  for (const entry of filtered) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      results.push({
        name: entry.name,
        type: 'directory',
        children: await scanDirectory(fullPath, relativeRoot, depth + 1),
      });
    } else {
      try {
        const fileStat = await stat(fullPath);
        results.push({
          name: entry.name,
          type: 'file',
          size: fileStat.size,
          modified: fileStat.mtime.toISOString(),
        });
      } catch {
        // Skip inaccessible files
      }
    }
  }

  return results;
}

export const listDirectorySkill: Skill = {
  name: 'list_directory',
  description: 'Lists the contents of any directory on the system.',
  category: 'filesystem',
  schema: {
    type: 'function',
    function: {
      name: 'list_directory',
      description: 'Lists files and folders in any absolute or relative directory path.',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Path (absolute or relative) to the directory.',
          },
          recursive: {
            type: 'boolean',
            description: 'If true, scans up to 3 levels deep. Default is false.',
          },
        },
        required: [],
      },
    },
  },
  execute: async (params) => {
    const relativePath = (params.path as string) || '.';
    const recursive = (params.recursive as boolean) ?? false;

    const resolvedPath = path.resolve(relativePath);

    try {
      const isDir = (await stat(resolvedPath)).isDirectory();
      if (!isDir) {
        return JSON.stringify({ error: 'Target path is not a directory.' });
      }

      const results = await scanDirectory(resolvedPath, resolvedPath, recursive ? 1 : MAX_DEPTH);
      return JSON.stringify({
        success: true,
        sandboxRoot: 'DEPRECATED - Sandbox Abolished',
        path: relativePath,
        contents: results,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return JSON.stringify({ error: `Failed to list directory: ${message}` });
    }
  },
};
