import OpenAI from 'openai';
import type { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions.js';
import { config } from '../infrastructure/config.js';
import type { ModelInfo } from '../interfaces/types.js';

// ─── Client ──────────────────────────────────────────────────────

const client = new OpenAI({
  baseURL: config.localLlmUrl,
  apiKey: 'lm-studio',
});

let activeModel: string = config.defaultModel;
let cachedModels: ModelInfo[] | null = null;

// ─── Helpers ─────────────────────────────────────────────────────

/** Extract a human-friendly name from a model ID.
 *  e.g. "ibm/granite-4-h-tiny" → "Granite 4 H Tiny"
 */
function friendlyName(modelId: string): string {
  const base = modelId.includes('/') ? modelId.split('/').pop()! : modelId;
  return base
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}

// ─── Model Management ───────────────────────────────────────────

export async function fetchAvailableModels(forceRefresh = false): Promise<ModelInfo[]> {
  if (cachedModels && !forceRefresh) {
    return cachedModels;
  }

  try {
    const response = await fetch(`${config.localLlmUrl}/models`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
    const data = (await response.json()) as { data: ModelInfo[] };
    cachedModels = (data.data || []).map(m => ({
      ...m,
      name: (m.name && m.name !== m.id) ? m.name : friendlyName(m.id),
    }));
    return cachedModels;
  } catch (error) {
    console.error('⚠️ Failed to fetch models from LM Studio.', error);
    return cachedModels ?? [];
  }
}

export function getActiveModel(): string {
  return activeModel;
}

export function getActiveModelName(): string {
  const cached = cachedModels?.find(m => m.id === activeModel);
  if (cached) return cached.name;
  return friendlyName(activeModel);
}

/**
 * Switch model by dynamic index (1-based) from the cached model list.
 */
export function switchModelByIndex(index: number): { success: boolean; model: string; name: string } {
  if (!cachedModels || index < 1 || index > cachedModels.length) {
    return { success: false, model: activeModel, name: getActiveModelName() };
  }
  activeModel = cachedModels[index - 1].id;
  return { success: true, model: activeModel, name: getActiveModelName() };
}

/**
 * Switch model by exact ID. Validates against cached list if available.
 */
export function switchModelById(modelId: string): { success: boolean; model: string; name: string } {
  // If we have a cached list, verify the model exists
  if (cachedModels && cachedModels.length > 0) {
    const found = cachedModels.find(m => m.id === modelId);
    if (!found) {
      return { success: false, model: activeModel, name: getActiveModelName() };
    }
  }
  activeModel = modelId;
  return { success: true, model: activeModel, name: getActiveModelName() };
}

// ─── Model Readiness ─────────────────────────────────────────────

/**
 * Ensures the active model is loaded in LM Studio.
 * If not loaded, attempts to load it via the native API.
 */
export async function ensureModelLoaded(): Promise<void> {
  const baseUrl = config.localLlmUrl.replace(/\/v1\/?$/, '');

  try {
    const res = await fetch(`${config.localLlmUrl}/models`);
    if (res.ok) {
      const data = (await res.json()) as { data: Array<{ id: string }> };
      const loaded = data.data?.some(m => m.id === activeModel);
      if (loaded) {
        console.log(`✅ Model "${activeModel}" is already loaded.`);
        return;
      }
    }
  } catch {
    console.warn(`⚠️ Could not reach LM Studio at ${config.localLlmUrl}. Will retry when a message arrives.`);
    return;
  }

  console.log(`📥 Model "${activeModel}" not loaded. Requesting LM Studio to load it...`);
  try {
    const loadRes = await fetch(`${baseUrl}/api/v1/models/load`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: activeModel }),
    });
    if (loadRes.ok) {
      console.log(`✅ Model "${activeModel}" load request sent successfully.`);
    } else {
      const errText = await loadRes.text();
      console.warn(`⚠️ LM Studio load response (${loadRes.status}): ${errText}`);
    }
  } catch (err) {
    console.warn(`⚠️ Failed to auto-load model: ${err}. Load "${activeModel}" manually in LM Studio.`);
  }
}

// ─── Chat Completion ─────────────────────────────────────────────

export interface ChatResponse {
  content: string | null;
  toolCalls?: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[];
  finishReason: string | null;
}

export async function chat(
  messages: ChatCompletionMessageParam[],
  tools?: ChatCompletionTool[],
): Promise<ChatResponse> {
  const params: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming = {
    model: activeModel,
    messages,
    temperature: 0.7,
    max_tokens: 4096,
  };

  if (tools && tools.length > 0) {
    params.tools = tools;
    params.tool_choice = 'auto';
  }

  try {
    const response = await client.chat.completions.create(params);
    
    if (!response.choices || response.choices.length === 0) {
      throw new Error(`LLM returned empty data. Please check if your LLM URL and Model ID are correct.`);
    }

    const choice = response.choices[0];

    return {
      content: choice?.message?.content ?? null,
      toolCalls: choice?.message?.tool_calls,
      finishReason: choice?.finish_reason ?? null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ LLM Error: ${message}`);
    throw new Error(`LLM request failed: ${message}`);
  }
}
