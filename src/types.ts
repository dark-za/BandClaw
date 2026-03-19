import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions.js';

// ─── Conversation ────────────────────────────────────────────────
export type ConversationMessage = ChatCompletionMessageParam;

// ─── Skill System ────────────────────────────────────────────────
export interface SkillParameter {
  type: string;
  description: string;
  enum?: string[];
}

export interface SkillSchema {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, SkillParameter>;
      required?: string[];
    };
  };
}

export interface Skill {
  name: string;
  description: string;
  category: string;
  schema: SkillSchema;
  execute: (args: Record<string, unknown>) => Promise<string>;
}

// ─── Tool Result ─────────────────────────────────────────────────
export interface ToolResult {
  name: string;
  result?: string;
  error?: string;
}

// ─── Skill Category Info ─────────────────────────────────────────
export interface CategoryInfo {
  name: string;
  skills: string[];
  enabled: boolean;
}

// ─── Model Info ──────────────────────────────────────────────────
export interface ModelInfo {
  id: string;
  name: string;
  owned_by?: string;
}

// ─── Model Map ───────────────────────────────────────────────────
export const MODEL_MAP: Record<string, string> = {
  '1': 'deepseek/deepseek-r1-0528-qwen3-8b',
  '2': 'qwen2.5-7b-instruct-tool-planning-v0.1',
  '3': 'qwen3.5-9b-uncensored-hauhaucs-aggressive',
};

export const MODEL_NAMES: Record<string, string> = {
  'deepseek/deepseek-r1-0528-qwen3-8b': 'DeepSeek R1 Qwen3 8B',
  'qwen2.5-7b-instruct-tool-planning-v0.1': 'Qwen 2.5 7B Tool Planning',
  'qwen3.5-9b-uncensored-hauhaucs-aggressive': 'Qwen 3.5 9B Uncensored',
};
