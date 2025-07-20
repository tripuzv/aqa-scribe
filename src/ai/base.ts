import { AIMessage, AIResponse, MCPTool } from '../types/index.js';

export abstract class BaseAIProvider {
  protected tools: MCPTool[] = [];

  /**
   * Set the available tools for the AI provider
   */
  setTools(tools: MCPTool[]): void {
    this.tools = tools;
  }

  /**
   * Get the tools formatted for this specific AI provider
   */
  abstract getFormattedTools(): any[];

  /**
   * Make a request to the AI provider
   */
  abstract generateResponse(messages: AIMessage[]): Promise<AIResponse>;

  /**
   * Get the provider name
   */
  abstract getProviderName(): string;

  /**
   * Get the model being used
   */
  abstract getModel(): string;
} 