import OpenAI from "openai";
import {
  ChatCompletionTool,
} from "openai/resources/chat/completions";
import { BaseAIProvider } from './base.js';
import { AIMessage, AIResponse } from '../types/index.js';

export class OpenAIProvider extends BaseAIProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string) {
    super();
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  getFormattedTools(): ChatCompletionTool[] {
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
    
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: messages as any,
      tools: tools.length > 0 ? tools : undefined,
    });

    const choice = response.choices[0];
    return {
      content: choice.message.content || undefined,
      toolCalls: choice.message.tool_calls?.map((tc: any) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments),
      })),
    };
  }

  getProviderName(): string {
    return "OpenAI";
  }

  getModel(): string {
    return this.model;
  }
} 