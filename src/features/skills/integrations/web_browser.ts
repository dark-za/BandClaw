import https from 'node:https';
import http from 'node:http';
import { URL } from 'node:url';
import type { Skill } from '../../../interfaces/types.js';

function fetchUrl(targetUrl: string, postData?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(targetUrl);
    const client = urlObj.protocol === 'http:' ? http : https;
    
    const options = {
      method: postData ? 'POST' : 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 10000,
    };

    if (postData) {
      (options.headers as any)['Content-Type'] = 'application/x-www-form-urlencoded';
      (options.headers as any)['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = client.request(urlObj, options, (res) => {
      // Handle redirects natively
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          redirectUrl = new URL(redirectUrl, targetUrl).toString();
        }
        return fetchUrl(redirectUrl, postData).then(resolve).catch(reject);
      }

      if (res.statusCode && res.statusCode >= 400) {
        return reject(new Error(`Server returned status code \${res.statusCode}`));
      }

      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
    
    if (postData) req.write(postData);
    req.end();
  });
}

function stripHtml(html: string): string {
  // Remove script and style elements completely
  let text = html.replace(/<(script|style|svg|noscript|header|footer|nav)[^>]*>[\s\S]*?<\/\1>/gi, '');
  
  // Extract paragraphs or basic text holding elements
  text = text.replace(/<[^>]+>/g, ' '); // Strip all remaining tags
  
  // Clean up whitespace
  text = text.replace(/\s\s+/g, ' ').trim();
  
  return text;
}

export const webBrowserSkill: Skill = {
  name: 'web_browser',
  description: 'Search the web or read the contents of a specific website. Vital for answering modern questions and doing research.',
  category: 'integrations',
  schema: {
    type: 'function',
    function: {
      name: 'web_browser',
      description: 'Perform internet searches or extract readable text from websites.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['search', 'read'],
            description: 'Action to perform: "search" to query DuckDuckGo/Web, "read" to fetch a URL.',
          },
          query: {
            type: 'string',
            description: 'The search query (required if action is "search").',
          },
          url: {
            type: 'string',
            description: 'The direct URL to read (required if action is "read").',
          },
        },
        required: ['action'],
      },
    },
  },
  execute: async (args: Record<string, unknown>) => {
    const action = args.action as string;

    try {
      if (action === 'search') {
        const query = args.query as string;
        if (!query) return JSON.stringify({ error: 'Search query is required.' });

        // Using DuckDuckGo HTML light version
        const postBody = `q=\${encodeURIComponent(query)}`;
        const html = await fetchUrl('https://lite.duckduckgo.com/lite/', postBody);
        
        // Very basic regex to extract result titles and links from lite DDG
        const results = [];
        const resultRegex = /<a class="result-snippet[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<td class="result-snippet">([^<]+)<\/td>/gi;
        
        // simpler alternative since lite DDG DOM structure changes: 
        // Just extract all visible text blocks that look like results
        const text = stripHtml(html);
        const snippet = text.substring(0, 15000); // Extract general text
        
        return JSON.stringify({ 
          status: 'success', 
          source: 'DuckDuckGo Lite', 
          query,
          searchResultsText: snippet 
        });
      }

      if (action === 'read') {
        const urlToRead = args.url as string;
        if (!urlToRead) return JSON.stringify({ error: 'URL is required to read.' });

        const html = await fetchUrl(urlToRead);
        const text = stripHtml(html);
        
        // Truncate to avoid context window explosion
        const truncated = text.length > 15000 ? text.substring(0, 15000) + '... [TRUNCATED DUE TO SIZE]' : text;
        
        return JSON.stringify({ 
          status: 'success', 
          url: urlToRead, 
          contentLength: text.length,
          contentText: truncated 
        });
      }

      return JSON.stringify({ error: 'Unknown action specified.' });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return JSON.stringify({ status: 'error', message: msg, hint: 'The website might block automated native requests.' });
    }
  },
};
