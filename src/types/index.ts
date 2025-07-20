export interface AIMessage {
  role: "user" | "assistant" | "tool" | "system";
  content: string;
  tool_calls?: {
    id: string;
    type: "function";
    function: {
      name: string;
      arguments: string;
    };
  }[];
  tool_call_id?: string;
}

export interface AIToolCall {
  id: string;
  name: string;
  arguments: any;
}

export interface AIResponse {
  content?: string;
  toolCalls?: AIToolCall[];
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

export interface MCPToolResult {
  content: any;
  isError?: boolean;
}

export interface Config {
  aiProvider: 'openai' | 'claude' | 'ollama';
  openai?: {
    apiKey: string;
    model: string;
  };
  claude?: {
    apiKey: string;
    model: string;
  };
  ollama?: {
    url: string;
    model: string;
  };
}

export type AIProviderType = 'openai' | 'claude' | 'ollama'; 