import type OpenAI from 'openai';

export function stripReasoningTags(content: string): string {
    let clean = content;
    clean = clean.replace(/<think>[\s\S]*?<\/think>/gi, '');
    clean = clean.replace(/<\|startthinking\|>[\s\S]*?<\|endthinking\|>/gi, '');
    clean = clean.replace(/<\|.*?\|>/g, '');
    return clean.trim();
}

export function parseTextToolCall(content: string): OpenAI.Chat.Completions.ChatCompletionMessageToolCall[] | null {
    const toolCallRegex = /<tool_call>\s*(\[.*?\])\s*<\/tool_call>/s;
    const match = content.match(toolCallRegex);
    if (!match || !match[1]) return null;

    try {
        const parsedTools = JSON.parse(match[1]);
        return parsedTools.map((pt: any) => ({
            id: pt.tool_call_id || `call_${Math.random().toString(36).substring(7)}`,
            type: 'function',
            function: {
                name: pt.tool_name || pt.name,
                arguments: typeof pt.parameters === 'string' ? pt.parameters : JSON.stringify(pt.parameters || pt.arguments || {})
            }
        }));
    } catch {
        return null;
    }
}
