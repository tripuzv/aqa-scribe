import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { MCPTool, MCPToolResult } from '../types/index.js';

export class MCPClient {
  private client: Client;
  private transport: StdioClientTransport | SSEClientTransport | null = null;
  private tools: MCPTool[] = [];

  constructor() {
    this.client = new Client({ name: "mcp-client-cli", version: "2.0.0" });
  }

  async connect(serverPathOrUrl: string): Promise<void> {
    try {
      if (serverPathOrUrl.startsWith("http://") || serverPathOrUrl.startsWith("https://")) {
        console.log(`🔗 Connecting to MCP server at ${serverPathOrUrl}...`);
        this.transport = new SSEClientTransport(new URL(serverPathOrUrl));
        await this.client.connect(this.transport);
      } else {
        const isJs = serverPathOrUrl.endsWith(".js");
        const isPy = serverPathOrUrl.endsWith(".py");
        if (!isJs && !isPy) {
          throw new Error("Server script must be a .js or .py file, or an HTTP URL");
        }
        
        const command = isPy
          ? process.platform === "win32"
            ? "python"
            : "python3"
          : process.execPath;

        console.log(`🚀 Starting MCP server: ${command} ${serverPathOrUrl}...`);
        this.transport = new StdioClientTransport({
          command,
          args: [serverPathOrUrl],
        });
        await this.client.connect(this.transport);
      }
      const toolsResult = await this.client.listTools();
      this.tools = toolsResult.tools.map(tool => ({
        name: tool.name,
        description: tool.description || "",
        inputSchema: tool.inputSchema,
      }));
      
      console.log(
        "✅ Connected to server with tools:",
        this.tools.map((tool) => tool.name),
      );
    } catch (e) {
      console.error("❌ Failed to connect to MCP server:", e);
      throw e;
    }
  }

  async callTool(name: string, args: any): Promise<MCPToolResult> {
    try {
      const result = await this.client.callTool({
        name,
        arguments: args,
      });

      const content = Array.isArray(result.content) 
        ? result.content.map(c => typeof c === 'string' ? c : JSON.stringify(c)).join('\n')
        : typeof result.content === 'string' 
          ? result.content 
          : JSON.stringify(result.content);

      return {
        content,
        isError: result.isError === true,
      };
    } catch (error) {
      return {
        content: `Error executing ${name}: ${error}`,
        isError: true,
      };
    }
  }

  getTools(): MCPTool[] {
    return [...this.tools];
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.close();
      console.log("🔌 Disconnected from MCP server");
    } catch (error) {
      console.error("❌ Error disconnecting from MCP server:", error);
    }
  }

  isConnected(): boolean {
    return this.transport !== null;
  }
} 