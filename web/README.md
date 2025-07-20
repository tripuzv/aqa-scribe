# MCP Client Web Interface

A modern web interface for testing AI interactions and MCP (Model Context Protocol) server connections.

## Features

- **Real-time Chat Interface**: Interactive chat with AI models through MCP servers
- **Connection Management**: Easy connection to various MCP server types (Python scripts, HTTP SSE, WebSocket)
- **Multiple AI Providers**: Support for OpenAI, Claude, and Ollama
- **Real-time Updates**: WebSocket-based real-time communication
- **Modern UI**: Clean, responsive interface built with React and Tailwind CSS
- **Configuration Display**: View current AI provider settings and API key status

## Quick Start

### 1. Install Dependencies

```bash
# Install main dependencies
npm install

# Install web client dependencies
cd web/client && npm install
```

### 2. Configure Environment

Copy the example environment file and configure your AI provider API keys:

```bash
cp env.example .env
```

Edit `.env` and add your API keys:
```env
# OpenAI
OPENAI_API_KEY=your_openai_key_here

# Claude
CLAUDE_API_KEY=your_claude_key_here

# Ollama (optional)
OLLAMA_URL=http://localhost:11434
```

### 3. Start the Web Server

```bash
# Development mode
npm run dev

# Or build and start production
npm run build:web
npm run start:web
```

The web interface will be available at `http://localhost:3001`

## Usage

### 1. Initialize MCP Client
Click the "Initialize MCP Client" button to set up the AI provider with your configuration.

### 2. Connect to MCP Server
Enter the path or URL to your MCP server:
- **Local Python script**: `./my-server.py`
- **HTTP SSE server**: `http://localhost:8931/sse`
- **WebSocket server**: `ws://localhost:8931`

### 3. Start Chatting
Once connected, you can start sending messages to test AI interactions with your MCP server tools.

## Architecture

### Backend (Express.js + Socket.IO)
- **API Endpoints**: RESTful API for MCP client operations
- **WebSocket**: Real-time communication for chat updates
- **MCP Integration**: Wraps your existing MCP client functionality

### Frontend (React + TypeScript)
- **Chat Interface**: Real-time message display and input
- **Connection Panel**: MCP server connection management
- **Status Bar**: System status and connection information

## Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server with hot reload
npm run build:web        # Build both backend and frontend
npm run start:web        # Start production server

# Frontend only (in web/client directory)
npm start                # Start React development server
npm run build            # Build React app
```

### Project Structure

```
web/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── types/         # TypeScript type definitions
│   │   ├── App.tsx        # Main app component
│   │   └── index.tsx      # React entry point
│   ├── public/            # Static assets
│   └── package.json       # Frontend dependencies
└── server.ts              # Express.js server (in src/web/)
```

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/init` - Initialize MCP client
- `POST /api/connect` - Connect to MCP server
- `POST /api/query` - Send query to AI
- `GET /api/config` - Get current configuration
- `POST /api/disconnect` - Disconnect from MCP server

## WebSocket Events

- `status` - Connection status updates
- `queryResponse` - AI response updates

## Troubleshooting

### Common Issues

1. **Port conflicts**: Make sure port 3001 is available
2. **API key errors**: Verify your API keys are correctly set in `.env`
3. **MCP server connection**: Ensure your MCP server is running and accessible
4. **CORS issues**: The server is configured to allow localhost:3000 for development

### Debug Mode

Enable debug logging by setting the environment variable:
```bash
DEBUG=* npm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

ISC License - see main project license 