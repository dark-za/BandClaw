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
