import https from 'node:https';
import { URL } from 'node:url';
import type { Skill } from '../../../interfaces/types.js';
import { incrementStat } from '../../../infrastructure/db.js';

function fetchBraveSearch(query: string, apiKey: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(`https://api.search.brave.com/res/v1/web/search?q=\${encodeURIComponent(query)}`);
    const options = {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
        'X-Subscription-Token': apiKey
      },
      timeout: 15000,
    };

    const req = https.request(urlObj, options, (res) => {
      let data = '';
      if (res.statusCode && res.statusCode >= 400) {
        return reject(new Error(`Brave API returned status \${res.statusCode}`));
      }
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.end();
  });
}

export const braveSearchSkill: Skill = {
  name: 'brave_search',
  description: 'Search the web using the official Brave Search API. Used to answer current questions up to date with the internet.',
  category: 'integrations',
  schema: {
    type: 'function',
    function: {
      name: 'brave_search',
      description: 'Perform internet searches directly via the Brave Search API to get relevant titles and snippets.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The precise search query.',
          },
        },
        required: ['query'],
      },
    },
  },
  execute: async (args: Record<string, unknown>) => {
    const query = args.query as string;
    if (!query) return JSON.stringify({ error: 'Query is required.' });

    // The provided Default Brave Search API Key:
    const DEFAULT_KEY = 'BSAdg0nZZtN4y-4rZpPvTO-8TCHJF58';
    // Allow override via process.env if needed
    const apiKey = process.env.BRAVE_SEARCH_API_KEY || DEFAULT_KEY;

    try {
      const respStr = await fetchBraveSearch(query, apiKey);
      const json = JSON.parse(respStr);
      
      const results = json.web?.results?.slice(0, 10).map((r: any) => ({
        title: r.title,
        url: r.url,
        description: r.description
      })) || [];

      // Increment global network search counter
      incrementStat('net_searches');

      return JSON.stringify({ 
        status: 'success', 
        source: 'Brave Search API', 
        query,
        total_found: results.length,
        results: results 
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return JSON.stringify({ status: 'error', message: msg, hint: 'Verify internet connection and API token limits.' });
    }
  },
};
