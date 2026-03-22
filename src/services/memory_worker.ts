import { eventBus, type AgentCycleData } from '../infrastructure/events.js';
import { chat } from './llm.js';

async function processVramCompression(data: AgentCycleData) {
  const { userId, db } = data;
  try {
    const toCompress = db.getOldestMessagesToCompress(userId, 15);
    if (toCompress.length === 0) return;

    const textToSummarize = toCompress.map(m => `\${m.role}: \${m.content}`).join('\n');
    const prompt = `You are a core background VRAM compressor. Summarize the following historical conversation into highly dense factual data points in Arabic. Omit pleasantries. Just pure facts:\n\n\${textToSummarize}`;

    const response = await chat([{ role: 'user', content: prompt }]);
    if (response.content) {
      db.saveVram(userId, response.content.trim());
      db.deleteMessagesByIds(toCompress.map(m => m.id));
      console.log(`[VRAM Engine] Compressed \${toCompress.length} messages into VRAM for user \${userId}.`);
    }
  } catch (err) {
    console.error(`[VRAM Engine] Compression failed for user \${userId}:`, err);
  }
}

// Register as background worker
export function startMemoryWorker() {
  eventBus.on('AGENT_CYCLE_COMPLETED', (data) => {
    // Fire and forget, catch errors internally
    processVramCompression(data).catch(console.error);
  });
  console.log('✅ Memory Worker (Event-Driven) initialized');
}
