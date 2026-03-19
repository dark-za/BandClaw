import OpenAI from 'openai';
import type { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions.js';
import { config } from './config.js';
import { MODEL_MAP, MODEL_NAMES, ModelInfo } from './types.js';

// ─── Client ──────────────────────────────────────────────────────

const client = new OpenAI({
  baseURL: config.localLlmUrl,
  apiKey: 'lm-studio', // LM Studio doesn't require a real key
});

let activeModel: string = config.defaultModel;
let cachedModels: ModelInfo[] | null = null;

// ─── Model Management ───────────────────────────────────────────

export async function fetchAvailableModels(forceRefresh = false): Promise<ModelInfo[]> {
  if (cachedModels && !forceRefresh) {
    return cachedModels;
  }

  try {
    // LM Studio exposes /v1/models similar to OpenAI
    const response = await fetch(`${config.localLlmUrl}/models`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
    const data = (await response.json()) as { data: ModelInfo[] };
    cachedModels = data.data || [];
    return cachedModels;
  } catch (error) {
    console.error('⚠️ Failed to fetch models from LM Studio, falling back to static list.', error);
    // If LM studio is offline or doesn't support the endpoint, return a fallback based on MODEL_MAP
    return Object.values(MODEL_MAP).map(modelId => ({
      id: modelId,
      name: MODEL_NAMES[modelId] ?? modelId,
      owned_by: 'system',
    }));
  }
}

export function getActiveModel(): string {
  return activeModel;
}

export function getActiveModelName(): string {
  // Try to find in cache first
  const cached = cachedModels?.find(m => m.id === activeModel);
  if (cached && cached.name && cached.name !== cached.id) {
    return cached.name;
  }
  return MODEL_NAMES[activeModel] ?? activeModel;
}

export function switchModel(key: string): { success: boolean; model: string; name: string } {
  const model = MODEL_MAP[key];
  if (!model) {
    return { success: false, model: activeModel, name: getActiveModelName() };
  }
  activeModel = model;
  return { success: true, model: activeModel, name: getActiveModelName() };
}

export function switchModelById(modelId: string): { success: boolean; model: string; name: string } {
  activeModel = modelId;
  return { success: true, model: activeModel, name: getActiveModelName() };
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
