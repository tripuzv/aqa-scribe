import { Anthropic } from "@anthropic-ai/sdk";
import { Tool as ClaudeTool } from "@anthropic-ai/sdk/resources/messages/messages.mjs";
import { BaseAIProvider } from './base.js';
import { AIMessage, AIResponse, AIToolCall } from '../types/index.js';

export class ClaudeProvider extends BaseAIProvider {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model: string) {
    super();
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  getFormattedTools(): ClaudeTool[] {
    return this.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema,
    }));
  }

  async generateResponse(messages: AIMessage[]): Promise<AIResponse> {
    const tools = this.getFormattedTools();
    
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2000,
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content
      })),
      tools: tools.length > 0 ? tools : undefined,
      stream: false
    });

    const toolCalls: AIToolCall[] = [];
    let content = "";

    for (const block of response.content) {
      if (block.type === "text") {
        content += block.text;
      } else if (block.type === "tool_use") {
        toolCalls.push({
          id: block.id,
          name: block.name,
          arguments: block.input,
        });
      }
    }

    return {
      content: content || undefined,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    };
  }

  getProviderName(): string {
    return "Claude";
  }

  getModel(): string {
    return this.model;
  }
} 