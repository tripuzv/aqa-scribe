import { Ollama } from "ollama";
import { BaseAIProvider } from './base.js';
import { AIMessage, AIResponse } from '../types/index.js';

export class OllamaProvider extends BaseAIProvider {
  private client: Ollama;
  private model: string;

  constructor(url: string, model: string) {
    super();
    this.client = new Ollama({ host: url });
    this.model = model;
  }

  getFormattedTools(): any[] {
    return this.tools.map((tool) => ({
      type: "function" as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
      },
    }));
  }

  async generateResponse(messages: AIMessage[]): Promise<AIResponse> {
    const tools = this.getFormattedTools();
    
    const response = await this.client.chat({
      model: this.model,
      messages: messages as any,
      tools: tools.length > 0 ? tools : undefined,
    });

    return {
      content: response.message.content,
      toolCalls: response.message.tool_calls?.map((tc: any) => ({
        id: tc.function?.name || Math.random().toString(),
        name: tc.function?.name || "",
        arguments: tc.function?.arguments || {},
      })),
    };
  }

  getProviderName(): string {
    return "Ollama";
  }

  getModel(): string {
    return this.model;
  }
} 