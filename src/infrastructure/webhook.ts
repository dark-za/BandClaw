import http from 'node:http';
import { config } from './config.js';
import { bot } from './bot.js';

export function startWebhookServer(): void {
  const server = http.createServer(async (req, res) => {
    // Health check
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', agent: 'BandClaw' }));
      return;
    }

    // Only accept POST
    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    // Parse JSON body
    let body = '';
    req.on('data', (chunk: Buffer) => {
      body += chunk.toString();
      // Limit body size to 1MB
      if (body.length > 1024 * 1024) {
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Payload too large' }));
        req.destroy();
      }
    });

    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const message = data.message;

        if (!message || typeof message !== 'string') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing "message" field in JSON body' }));
          return;
        }

        // Forward to the first admin user via Telegram
        const adminId = config.allowedUserIds[0];
        if (adminId) {
          const source = data.source ?? 'webhook';
          const text = `📨 *Incoming ${source}:*\n\n${message}`;
          await bot.api.sendMessage(adminId, text, { parse_mode: 'Markdown' }).catch(() => {
            // Fallback without markdown
            bot.api.sendMessage(adminId, `📨 Incoming ${source}:\n\n${message}`);
          });
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        console.error('❌ Webhook error:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  });

  server.listen(config.webhookPort, () => {
    console.log(`🌐 Webhook server listening on port ${config.webhookPort}`);
  });
}
