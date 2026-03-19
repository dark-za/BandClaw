import { exec } from 'node:child_process';
import util from 'node:util';
import type { Skill } from '../../../interfaces/types.js';

const execAsync = util.promisify(exec);

export const context7McpSkill: Skill = {
  name: 'context7_mcp',
  description: 'Fetch up-to-date documentation and code examples for any library using the Context7 API.',
  category: 'integrations',
  schema: {
    type: 'function',
    function: {
      name: 'context7_mcp',
      description: 'Resolve library IDs and fetch specific documentation using Context7.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['resolve-library-id', 'get-library-docs'],
            description: 'Whether to resolve an ID or fetch documentation.',
          },
          libraryName: {
            type: 'string',
            description: 'The name of the library (if action is resolve-library-id, e.g., "next.js").',
          },
          libraryId: {
            type: 'string',
            description: 'The resolved canonical Context7 library ID (e.g., "/vercel/next.js"). Required for get-library-docs.',
          },
          topic: {
            type: 'string',
            description: 'Specific topic to fetch documentation for (e.g., "routing and server components").',
          },
        },
        required: ['action'],
      },
    },
  },
  execute: async (args: Record<string, unknown>) => {
    const { action, libraryName, libraryId, topic } = args;

    // This implementation mimics the Context7 MCP server behavior by dynamically generating npx proxy calls
    // or simulating them if a direct HTTP API isn't publicly exposed in a standard way.
    // Assuming context7 CLI can be executed as a standalone binary or `npx @upstash/context7-mcp` handles it:

    let cmd = '';

    if (action === 'resolve-library-id') {
      if (!libraryName) return JSON.stringify({ error: 'libraryName is required to resolve ID.' });
      // Stubbing the logic or using a fallback npx execution if available
      cmd = `npx -y @upstash/context7-mcp call resolve-library-id --args.libraryName="${libraryName}"`;
    } else if (action === 'get-library-docs') {
      if (!libraryId || !topic) return JSON.stringify({ error: 'libraryId and topic are required for docs extraction.' });
      cmd = `npx -y @upstash/context7-mcp call get-library-docs --args.context7CompatibleLibraryID="${libraryId}" --args.topic="${topic}" --args.tokens=5000`;
    } else {
      return JSON.stringify({ error: 'Invalid Context7 action.' });
    }

    try {
      // In a real environment, this spins up the MCP proxy process briefly
      const { stdout } = await execAsync(cmd, { env: process.env, timeout: 30000 });
      return JSON.stringify({ status: 'success', content: stdout.trim() });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return JSON.stringify({ 
        status: 'error', 
        message: msg, 
        hint: 'Context7 proxy failed. Please ensure your CONTEXT7_API_KEY is properly set in your environment if the MCP server requires it.' 
      });
    }
  },
};
