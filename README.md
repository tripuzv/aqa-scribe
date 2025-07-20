# OpenAI-Powered MCP Client

An LLM-powered chatbot MCP (Model Context Protocol) client written in TypeScript that uses OpenAI's GPT models to interact with MCP servers for browser automation, file operations, and more.

## 🚀 Features

- **Multi-AI Provider Support**: Works with OpenAI, Claude API, and local Ollama models
- **Multi-Step Automation**: Chains tool calls together for complex workflows
- **Dual Transport Support**: Works with both stdio (local scripts) and HTTP/SSE (remote servers)
- **Modular Architecture**: Clean separation of concerns with organized code structure
- **Real-time Logging**: See exactly what tools are being executed
- **Error Handling**: Robust error handling with fallback mechanisms
- **Type Safety**: Full TypeScript support with proper type definitions

## 📋 Prerequisites

- **Node.js 16.0.0 or higher**
- **AI Provider** (choose one):
  - **OpenAI API Key** (sign up at [platform.openai.com](https://platform.openai.com))
  - **Anthropic Claude API Key** (sign up at [console.anthropic.com](https://console.anthropic.com))
  - **Local Ollama** (install from [ollama.com](https://ollama.com))
- **MCP Server** (like playwright-mcp for browser automation)

## 🛠️ Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Set up Environment Variables
Create a `.env` file in the project root and configure your chosen AI provider.

**Quick Setup:**
```bash
# Copy the example file and edit it
cp env.example .env
# Edit .env with your API keys and preferred models
```

**Manual Setup Examples:**

**OpenAI:**
```bash
echo "AI_PROVIDER=openai" > .env
echo "OPENAI_API_KEY=sk-your-openai-api-key-here" >> .env
echo "OPENAI_MODEL=gpt-4o-mini" >> .env
```

**Claude API:**
```bash
echo "AI_PROVIDER=claude" > .env
echo "ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here" >> .env
echo "CLAUDE_MODEL=claude-3-5-sonnet-20241022" >> .env
```

**Local Ollama:**
```bash
echo "AI_PROVIDER=ollama" > .env
echo "OLLAMA_URL=http://localhost:11434" >> .env
echo "OLLAMA_MODEL=llama3.2" >> .env
```

📋 **See `env.example` for all available models and configuration options.**

### 3. Build the Project
```bash
npm run build
```

## 🎯 Usage

### Web Interface (Recommended)

The easiest way to test and interact with your MCP client is through the web interface:

```bash
# Start the web server
npm run dev

# Open your browser to http://localhost:3001
```

The web interface provides:
- **Real-time chat** with AI and MCP servers
- **Visual screenshot display** from browser automation
- **Connection management** for different MCP server types
- **Configuration display** and status monitoring
- **Quick test buttons** for common operations

### Command Line Interface

The client can connect to MCP servers in two ways:

### Option 1: HTTP/SSE Connection (Recommended for playwright-mcp)

**Step 1:** Start an MCP server (example with playwright-mcp):
```bash
npx @playwright/mcp@latest --port 8931
```

**Step 2:** Connect your client:
```bash
node build/index.js http://localhost:8931/sse
```

### Option 2: Local Script Execution

**For Python servers:**
```bash
node build/index.js ./path/to/your/server.py
```

**For JavaScript servers:**
```bash
node build/index.js ./path/to/your/server.js
```

## 🌐 Browser Automation Example

Here's how to use the client with playwright-mcp for web automation:

### 1. Start playwright-mcp server
```bash
# For fresh sessions each time (recommended):
npx @playwright/mcp@latest --port 8931 --isolated

# For persistent sessions:
npx @playwright/mcp@latest --port 8931
```

### 2. Connect and automate
```bash
node build/index.js http://localhost:8931/sse
```

### 3. Example automation commands:

**Simple navigation:**
```
Navigate to https://example.com and take a screenshot
```

**Complex automation:**
```
Navigate to http://walk-fit.io/, accept the GDPR banner, and walk through the onboarding with random values. Take a screenshot at each step and save to /downloads directory. Stop when you reach the email screen.
```

**Step-by-step automation:**
```
1. Navigate to https://google.com
2. Take a screenshot and save it as step1.png
3. Find the search box and type "MCP protocol"
4. Take another screenshot as step2.png
5. Click the search button
```

## 🔧 Configuration Options

### Playwright-MCP Server Options

```bash
# Isolated mode (fresh session each time)
npx @playwright/mcp@latest --port 8931 --isolated

# Headless mode
npx @playwright/mcp@latest --port 8931 --headless

# Custom browser
npx @playwright/mcp@latest --port 8931 --browser firefox

# With screenshots disabled
npx @playwright/mcp@latest --port 8931 --image-responses omit
```

### Client Debugging

The client provides detailed logging:
- 🔧 **Tool execution**: Shows which tools are being called
- ✅ **Tool results**: Shows the results from each tool
- ❌ **Error handling**: Shows any tool execution failures

## 📁 Project Structure

```
mcp-client-typescript/
├── src/                  # Source code
│   ├── ai/              # AI provider implementations
│   │   ├── base.ts      # Base AI provider interface
│   │   ├── openai.ts    # OpenAI provider
│   │   ├── claude.ts    # Claude provider
│   │   ├── ollama.ts    # Ollama provider
│   │   └── factory.ts   # AI provider factory
│   ├── mcp/             # MCP client handling
│   │   └── client.ts    # MCP connection and tool management
│   ├── config/          # Configuration management
│   │   └── config.ts    # Environment config loader
│   ├── types/           # TypeScript type definitions
│   │   └── index.ts     # Common interfaces and types
│   ├── utils/           # Utility functions
│   │   └── logger.ts    # Logging utilities
│   └── index.ts         # Main application entry point
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── env.example          # Environment variables template
├── .env                 # Environment variables (create this)
├── build/               # Compiled JavaScript (generated)
└── README.md           # This file
```

## 🏗️ Architecture

The application is built with a **modular architecture** that separates concerns for better maintainability:

### 🧠 AI Providers (`src/ai/`)
- **Base Interface**: `BaseAIProvider` defines the contract for all AI implementations
- **Multiple Providers**: Seamlessly switch between OpenAI, Claude, and Ollama
- **Factory Pattern**: Automatic provider instantiation based on configuration
- **Tool Integration**: Each provider handles tool formatting for their specific API

### 🔌 MCP Client (`src/mcp/`)
- **Connection Management**: Handles both stdio and HTTP/SSE transports
- **Tool Execution**: Provides a unified interface for calling MCP tools
- **Error Handling**: Robust error handling with detailed feedback

### ⚙️ Configuration (`src/config/`)
- **Environment-based**: Automatic configuration loading from environment variables
- **Validation**: Ensures required settings are present for chosen provider
- **Singleton Pattern**: Single source of truth for configuration

### 📝 Type Safety (`src/types/`)
- **Shared Interfaces**: Common types used across the application
- **Type Safety**: Full TypeScript support prevents runtime errors
- **API Compatibility**: Types designed to work with all AI providers

### 🛠️ Benefits
- **Easy Extension**: Add new AI providers by implementing `BaseAIProvider`
- **Testing**: Each module can be tested independently
- **Maintenance**: Changes to one provider don't affect others
- **Configuration**: Simple environment-based configuration switching

## 🤖 Available Tools (with playwright-mcp)

The client automatically detects available tools from the connected MCP server. With playwright-mcp, you get:

**Navigation:**
- `browser_navigate` - Navigate to URLs
- `browser_navigate_back` - Go back
- `browser_navigate_forward` - Go forward

**Interaction:**
- `browser_click` - Click elements
- `browser_type` - Type text
- `browser_hover` - Hover over elements
- `browser_select_option` - Select dropdown options

**Information:**
- `browser_snapshot` - Get page accessibility snapshot
- `browser_take_screenshot` - Capture screenshots
- `browser_console_messages` - Get console logs

**And many more!**

## 🚨 Troubleshooting

### Common Issues

**1. "OPENAI_API_KEY is not set" or "OPENAI_MODEL is required"**
```bash
# Copy and configure the environment template
cp env.example .env
# Edit .env with your actual API key and preferred model

# Or create manually:
echo "AI_PROVIDER=openai" > .env
echo "OPENAI_API_KEY=sk-your-key-here" >> .env
echo "OPENAI_MODEL=gpt-4o-mini" >> .env
```

**2. Model configuration errors (Claude/Ollama)**
```bash
# For Claude:
echo "AI_PROVIDER=claude" > .env
echo "ANTHROPIC_API_KEY=sk-ant-your-key-here" >> .env
echo "CLAUDE_MODEL=claude-3-5-sonnet-20241022" >> .env

# For Ollama:
echo "AI_PROVIDER=ollama" > .env
echo "OLLAMA_URL=http://localhost:11434" >> .env
echo "OLLAMA_MODEL=llama3.2" >> .env
```

**3. "Failed to connect to MCP server"**
```bash
# Make sure the MCP server is running first:
npx @playwright/mcp@latest --port 8931

# Then connect in another terminal:
node build/index.js http://localhost:8931/sse
```

**4. "Browser sessions persist between runs"**
```bash
# Use isolated mode for fresh sessions:
npx @playwright/mcp@latest --port 8931 --isolated
```

**5. Ollama model not found**
```bash
# Make sure the model is installed locally:
ollama pull llama3.2

# List available models:
ollama list

# Use any installed model in your .env:
echo "OLLAMA_MODEL=your-installed-model" >> .env
```

**6. "Tool calls not chaining together"**
- The client supports up to 100 iterations of tool calls
- Complex automation should work automatically
- Check the console output for tool execution logs

### Fresh Browser Sessions

To get a fresh browser session each time:

```bash
# Stop any running playwright servers
pkill -f "playwright.*mcp"

# Start with isolated mode
npx @playwright/mcp@latest --port 8931 --isolated
```

## 📚 Advanced Usage

### Multiple Step Automation
The client excels at complex, multi-step automation:

```
Go to amazon.com, search for "laptop", filter by price under $1000, take screenshots of the first 3 results, and save them to /downloads with descriptive names
```

### Conditional Logic
```
Navigate to github.com, if there's a login prompt then skip it, otherwise take a screenshot of the homepage
```

### Data Extraction
```
Go to news.ycombinator.com, get the titles of the top 5 stories, and save them to a text file
```

## 🔗 Related Projects

- [Model Context Protocol](https://modelcontextprotocol.io/) - The official MCP documentation
- [playwright-mcp](https://www.npmjs.com/package/@playwright/mcp) - Browser automation MCP server
- [Building MCP clients](https://modelcontextprotocol.io/tutorials/building-a-client) - Official tutorial

## 📄 License

ISC License - see package.json for details.

---

**Happy automating! 🤖✨**
