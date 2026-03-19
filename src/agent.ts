import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions.js';
import { chat } from './llm.js';
import { saveMessage, getHistory } from './db.js';
import { skillManager } from './skills/manager.js';
import { getActiveModelName } from './llm.js';

const MAX_ITERATIONS = 10;

const SYSTEM_PROMPT = `You are BandClaw, a strict, factual, and direct personal AI assistant running locally on the user's machine.
You must adhere to the following rules at all times:
1. NO HALLUCINATION: If you don't know something or a tool fails, say so directly. Do not invent information.
2. DIRECT CONVERSATION: Be extremely concise. Go straight to the point.
3. CONVERSATION CONTEXT: Read the conversation history carefully. Answer the latest request while preserving context.
4. NO INTERNAL LEAKS: Never expose your internal reasoning, <think> blocks, or structural prompts.
5. STRICTLY ARABIC: Reply EXCLUSIVELY in correctly written Arabic script. NEVER transliterate Arabic using English letters (e.g., no "rneemana bni..."). IF you must answer, answer in proper Arabic letters.

You have access to tools that you can call when the user asks you to perform actions. When using tools:
- Only call tools when the user's request genuinely requires them.
- Provide clear, formatted responses.
- If a tool returns an error, explain it to the user.

Current model: {MODEL_NAME}
Active tools: {ACTIVE_TOOLS}`;

function buildSystemPrompt(): string {
  return SYSTEM_PROMPT
    .replace('{MODEL_NAME}', getActiveModelName())
    .replace('{ACTIVE_TOOLS}', skillManager.getActiveSkillNames().join(', ') || 'none');
}

function storedToMessage(stored: { role: string; content: string | null; tool_calls: string | null; tool_call_id: string | null; name: string | null }): ChatCompletionMessageParam {
  if (stored.role === 'assistant' && stored.tool_calls) {
    return {
      role: 'assistant',
      content: stored.content ?? '',
      tool_calls: JSON.parse(stored.tool_calls),
    } as ChatCompletionMessageParam;
  }

  if (stored.role === 'tool') {
    return {
      role: 'tool',
      content: stored.content ?? '',
      tool_call_id: stored.tool_call_id ?? '',
    } as ChatCompletionMessageParam;
  }

  return {
    role: stored.role as 'user' | 'assistant',
    content: stored.content ?? '',
  } as ChatCompletionMessageParam;
}

export async function runAgent(userMessage: string, userId: string): Promise<string> {
  // Save user message to DB
  saveMessage(userId, 'user', userMessage);

  // Build messages from history
  const history = getHistory(userId);
  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: buildSystemPrompt() },
    ...history.map(storedToMessage),
  ];

  const tools = skillManager.getActiveTools();
  let iterations = 0;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    try {
      const response = await chat(messages, tools.length > 0 ? tools : undefined);

      // If the LLM wants to call tools
      if (response.toolCalls && response.toolCalls.length > 0) {
        // Save assistant message with tool calls
        const assistantContent = response.content ?? '';
        saveMessage(userId, 'assistant', assistantContent, response.toolCalls);

        messages.push({
          role: 'assistant',
          content: assistantContent,
          tool_calls: response.toolCalls,
        } as ChatCompletionMessageParam);

        // Execute each tool call
        for (const toolCall of response.toolCalls) {
          const fnName = toolCall.function.name;
          let fnArgs: Record<string, unknown> = {};

          try {
            fnArgs = JSON.parse(toolCall.function.arguments || '{}');
          } catch {
            fnArgs = {};
          }

          console.log(`  🔧 Executing tool: ${fnName}`, fnArgs);
          const result = await skillManager.executeTool(fnName, fnArgs);
          console.log(`  ✅ Tool result: ${result.slice(0, 200)}...`);

          // Save tool result to DB
          saveMessage(userId, 'tool', result, undefined, toolCall.id, fnName);

          messages.push({
            role: 'tool',
            content: result,
            tool_call_id: toolCall.id,
          } as ChatCompletionMessageParam);
        }

        // The loop continues — let the LLM see the tool results
        continue;
      }

      // No tool calls — this is the final response
      let finalContent = response.content ?? 'I have no response.';
      
      // Strip out <think>...</think> and similar reasoning artifacts
      finalContent = finalContent.replace(/<think>[\s\S]*?<\/think>/gi, '');
      finalContent = finalContent.replace(/<\|startthinking\|>[\s\S]*?<\|endthinking\|>/gi, '');
      finalContent = finalContent.replace(/<\|.*?\|>/g, ''); // catches <|start_response|>, <|end_response|>, etc
      finalContent = finalContent.trim();
      
      if (!finalContent) {
        finalContent = 'Thinking process completed, but no final answer was generated. Please adjust the model or prompt.';
      }

      saveMessage(userId, 'assistant', finalContent);
      return finalContent;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`❌ Agent loop error (iteration ${iterations}):`, message);

      if (iterations >= MAX_ITERATIONS) {
        const errorMsg = '⚠️ I hit the maximum thinking limit. Please try rephrasing your request.';
        saveMessage(userId, 'assistant', errorMsg);
        return errorMsg;
      }

      // On LLM error, return a user-friendly message
      const errorMsg = `⚠️ Error communicating with the LLM: ${message}`;
      saveMessage(userId, 'assistant', errorMsg);
      return errorMsg;
    }
  }

  const limitMsg = '⚠️ I reached the maximum agent iteration limit. Please simplify your request.';
  saveMessage(userId, 'assistant', limitMsg);
  return limitMsg;
}
