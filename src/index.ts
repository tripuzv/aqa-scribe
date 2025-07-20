import readline from "readline/promises";
import { BaseAIProvider } from './ai/base.js';
import { AIProviderFactory } from './ai/factory.js';
import { MCPClient } from './mcp/client.js';
import { ConfigManager } from './config/config.js';
import { Logger } from './utils/logger.js';
import { AIMessage } from './types/index.js';

export class MCPClientApp {
  private aiProvider!: BaseAIProvider;
  private mcpClient: MCPClient;
  private configManager: ConfigManager;

  constructor() {
    this.configManager = ConfigManager.getInstance();
    this.mcpClient = new MCPClient();
  }

  async initialize(): Promise<void> {
    try {
      this.configManager.printConfigSummary();

      const config = this.configManager.getConfig();
      this.aiProvider = AIProviderFactory.create(config);
      
      Logger.success(`Initialized ${this.aiProvider.getProviderName()} with model: ${this.aiProvider.getModel()}`);
    } catch (error) {
      Logger.error("Failed to initialize application:", error);
      throw error;
    }
  }

  async connectToMCPServer(serverPathOrUrl: string): Promise<void> {
    try {
      await this.mcpClient.connect(serverPathOrUrl);
      
      const tools = this.mcpClient.getTools();
      this.aiProvider.setTools(tools);
      
      Logger.success(`AI provider now has access to ${tools.length} tools`);
    } catch (error) {
      Logger.error("Failed to connect to MCP server:", error);
      throw error;
    }
  }

  async processQuery(query: string): Promise<{ aiResponse: string; toolResults: string[] }> {
    const messages: AIMessage[] = [
      {
        role: "user",
        content: query,
      },
    ];

    const finalText = [];
    const toolResults = [];
    let maxIterations = 100;
    let iteration = 0;

    while (iteration < maxIterations) {
      iteration++;
      
      try {
        const aiResponse = await this.aiProvider.generateResponse(messages);

        const provider = this.configManager.getAIProvider();
        
        if (provider === "claude") {
          messages.push({
            role: "assistant",
            content: aiResponse.content || "",
          });
        } else if (provider === "openai") {
          const formattedToolCalls = aiResponse.toolCalls?.map(tc => ({
            id: tc.id,
            type: "function" as const,
            function: {
              name: tc.name,
              arguments: JSON.stringify(tc.arguments),
            },
          }));

          messages.push({
            role: "assistant",
            content: aiResponse.content || "",
            tool_calls: formattedToolCalls,
          });
        } else if (provider === "ollama") {
          const formattedToolCalls = aiResponse.toolCalls?.map(tc => ({
            id: tc.id,
            type: "function" as const,
            function: {
              name: tc.name,
              arguments: tc.arguments,
            },
          }));

          messages.push({
            role: "assistant",
            content: aiResponse.content || "",
            tool_calls: formattedToolCalls as any,
          });
        }

        if (aiResponse.content) {
          finalText.push(aiResponse.content);
        }

        if (!aiResponse.toolCalls || aiResponse.toolCalls.length === 0) {
          break;
        }

        for (const toolCall of aiResponse.toolCalls) {
          Logger.tool(toolCall.name, toolCall.arguments);

          const result = await this.mcpClient.callTool(toolCall.name, toolCall.arguments);

          // Store tool results separately for image extraction
          toolResults.push(result.content);

          if (result.isError) {
            Logger.error(`Tool execution failed: ${result.content}`);
          } else {
            Logger.toolResult(result.content);
          }

          if (this.configManager.getAIProvider() === "claude") {
            messages.push({
              role: "user",
              content: result.content,
            });
          } else {
            messages.push({
              role: "tool",
              content: result.content,
              tool_call_id: toolCall.id,
            });
          }
        }

      } catch (error) {
        Logger.error(`AI API call failed: ${error}`);
        finalText.push(`Error: AI API call failed - ${error}`);
        break;
      }

      if (iteration === maxIterations) {
        Logger.warning(`Reached maximum iterations (${maxIterations}). Breaking loop.`);
      }
    }

    if (iteration >= maxIterations) {
      finalText.push("\n⚠️ Maximum iterations reached. The automation may be incomplete.");
    }

    // Return only the AI response for user display, and tool results separately for processing
    const aiResponse = finalText.join("\n");
    
    return { aiResponse, toolResults };
  }

  async startChatLoop(): Promise<void> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    try {
      Logger.info("MCP Client Started!");
      Logger.info("Type your queries or 'quit' to exit.");

      while (true) {
        const message = await rl.question("\nQuery: ");
        if (message.toLowerCase() === "quit") {
          break;
        }
        
        try {
          const response = await this.processQuery(message);
          console.log("\n" + response.aiResponse);
        } catch (error) {
          Logger.error("Error processing query:", error);
        }
      }
    } finally {
      rl.close();
    }
  }

  async cleanup(): Promise<void> {
    try {
      await this.mcpClient.disconnect();
      Logger.info("Application cleaned up successfully");
    } catch (error) {
      Logger.error("Error during cleanup:", error);
    }
  }
}

// Main application entry point
async function main() {
  if (process.argv.length < 3) {
    console.log("Usage: node build/index.js <path_to_server_script_or_url>");
    console.log("Examples:");
    console.log("  node build/index.js ./my-server.py");
    console.log("  node build/index.js http://localhost:8931/sse");
    return;
  }

  const app = new MCPClientApp();
  
  try {
    await app.initialize();
    await app.connectToMCPServer(process.argv[2]);
    await app.startChatLoop();
  } catch (error) {
    Logger.error("Application failed:", error);
    process.exit(1);
  } finally {
    await app.cleanup();
    process.exit(0);
  }
}

main(); 