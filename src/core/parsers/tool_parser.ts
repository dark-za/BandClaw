import type OpenAI from 'openai';

export function stripReasoningTags(content: string): string {
    let clean = content;
    clean = clean.replace(/<think>[\s\S]*?<\/think>/gi, '');
    clean = clean.replace(/<\|startthinking\|>[\s\S]*?<\|endthinking\|>/gi, '');
    clean = clean.replace(/<\|.*?\|>/g, '');
    return clean.trim();
}

export function parseTextToolCall(content: string): OpenAI.Chat.Completions.ChatCompletionMessageToolCall[] | null {
    // 1. Try strict <tool_call> tags
    let match = content.match(/<tool_call>\s*(\[.*?\]|\{.*?\})\s*<\/tool_call>/s);
    
    // 2. Try markdown json blocks if not found
    if (!match) {
        match = content.match(/```json\s*(\[.*?\]|\{.*?\})\s*```/s);
    }
    
    // 3. Try finding an array directly if still not found
    if (!match) {
        match = content.match(/(\[\s*\{[\s\S]*\}\s*\])/s);
    }

    if (!match || !match[1]) return null;

    let jsonString = match[1].trim();

    // Fuzzy JSON fixes: remove trailing commas before } or ]
    jsonString = jsonString.replace(/,\s*([\}\]])/g, '$1');

    try {
        let parsedTools = JSON.parse(jsonString);
        
        if (!Array.isArray(parsedTools)) {
            parsedTools = [parsedTools];
        }

        return parsedTools.map((pt: any) => ({
            id: pt.tool_call_id || `call_${Math.random().toString(36).substring(7)}`,
            type: 'function',
            function: {
                name: pt.tool_name || pt.name || pt.action,
                arguments: typeof pt.parameters === 'string' 
                    ? pt.parameters 
                    : JSON.stringify(pt.parameters || pt.arguments || pt || {})
            }
        }));
    } catch {
        return null;
    }
}
