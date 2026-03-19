import https from 'node:https';
import type { Skill } from '../../../interfaces/types.js';

function fetchJson(url: string, headers: Record<string, string> = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers, timeout: 10000 }, (res) => {
      let data = '';
      if (res.statusCode && res.statusCode >= 400) {
        return reject(new Error(`API failed with status \${res.statusCode}`));
      }
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
  });
}

export const trendRadarSkill: Skill = {
  name: 'trend_radar',
  description: 'Scan current trends across Hacker News and GitHub for any topic or general signals.',
  category: 'integrations',
  schema: {
    type: 'function',
    function: {
      name: 'trend_radar',
      description: 'Fetch and analyze live trending projects from GitHub and top discussion stories from Hacker News.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['scan_hn', 'scan_github'],
            description: 'The source to scan for trends.',
          },
          topic: {
            type: 'string',
            description: 'Optional specific topic to search on GitHub (e.g., "WebAssembly" or "AI agents").',
          },
        },
        required: ['action'],
      },
    },
  },
  execute: async (args: Record<string, unknown>) => {
    const action = args.action as string;
    const topic = args.topic as string;

    try {
      if (action === 'scan_hn') {
        // Fetch top stories from HN
        const topIds = await fetchJson('https://hacker-news.firebaseio.com/v0/topstories.json');
        const firstFivesIds = topIds.slice(0, 5);
        const stories = [];
        for (const id of firstFivesIds) {
          const story = await fetchJson(`https://hacker-news.firebaseio.com/v0/item/\${id}.json`);
          stories.push({ title: story.title, score: story.score, url: story.url });
        }
        return JSON.stringify({ source: 'HackerNews', trends: stories });
      }

      if (action === 'scan_github') {
        const query = topic ? encodeURIComponent(topic) : 'stars:>1000';
        const url = `https://api.github.com/search/repositories?q=\${query}&sort=stars&order=desc&per_page=5`;
        const data = await fetchJson(url, { 'User-Agent': 'BandClaw-Agent' });
        
        const repos = data.items.map((r: any) => ({
          name: r.full_name,
          description: r.description,
          stars: r.stargazers_count,
          url: r.html_url,
        }));
        return JSON.stringify({ source: 'GitHub', query: topic || 'top repos', trends: repos });
      }

      return JSON.stringify({ error: 'Unsupported action.' });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return JSON.stringify({ status: 'error', message: msg, hint: 'Ensure internet connection is active.' });
    }
  },
};
