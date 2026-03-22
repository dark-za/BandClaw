import type { ChatCompletionTool } from 'openai/resources/chat/completions.js';

export interface StoredMessage {
  id?: number;
  role: string;
  content: string | null;
  tool_calls: string | null;
  tool_call_id: string | null;
  name: string | null;
}

export interface VramEntry {
  id: number;
  summary: string;
  frequency: number;
}

export interface IDatabaseService {
  saveMessage(
    userId: string,
    role: string,
    content: string | null,
    toolCalls?: unknown,
    toolCallId?: string,
    name?: string
  ): void;
  
  getHistory(userId: string, limit?: number): StoredMessage[];
  
  getOldestMessagesToCompress(userId: string, limit: number): { id: number; role: string; content: string | null }[];
  
  deleteMessagesByIds(ids: number[]): number;
  
  saveVram(userId: string, summary: string): void;
  
  getTopVram(userId: string, limit?: number): VramEntry[];
}

export interface ISkillManager {
  getActiveTools(): ChatCompletionTool[];
  executeTool(name: string, args: Record<string, unknown>): Promise<string>;
}
