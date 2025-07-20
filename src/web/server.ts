import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { MCPClientApp } from '../index.js';
import { Logger } from '../utils/logger.js';
import { ConfigManager } from '../config/config.js';
import fs from 'fs';
import path from 'path';

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.static('web/client/build'));

// Global MCP client instance
let mcpApp: MCPClientApp | null = null;
let isConnected = false;

// Socket.IO connection handling
io.on('connection', (socket) => {
  Logger.info(`Client connected: ${socket.id}`);
  
  socket.emit('status', { 
    connected: isConnected,
    message: isConnected ? 'Connected to MCP server' : 'Not connected to MCP server'
  });

  socket.on('disconnect', () => {
    Logger.info(`Client disconnected: ${socket.id}`);
  });
});

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    connected: isConnected
  });
});

// Test image detection
app.post('/api/test-image-detection', (req, res) => {
  try {
    const { testResponse } = req.body;
    
    if (!testResponse) {
      return res.status(400).json({ error: 'testResponse is required' });
    }

    // Test the image detection logic
    let imageData = null;
    
    // First, try to find any tool result with image data
    const imageToolResultMatch = testResponse.match(/✅ Tool result: \{"type":"image","data":"([^"]+)"\}/);
    if (imageToolResultMatch) {
      imageData = imageToolResultMatch[1];
    }
    
    res.json({ 
      success: true, 
      foundImage: !!imageData,
      imageDataLength: imageData ? imageData.length : 0,
      testResponse: testResponse.substring(0, 200) + '...'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Initialize MCP client
app.post('/api/init', async (req, res) => {
  try {
    if (mcpApp) {
      await mcpApp.cleanup();
    }
    
    mcpApp = new MCPClientApp();
    await mcpApp.initialize();
    
    Logger.success('MCP client initialized successfully');
    res.json({ success: true, message: 'MCP client initialized successfully' });
  } catch (error) {
    Logger.error('Failed to initialize MCP client:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Connect to MCP server
app.post('/api/connect', async (req, res) => {
  try {
    const { serverPathOrUrl } = req.body;
    
    if (!serverPathOrUrl) {
      return res.status(400).json({ 
        success: false, 
        error: 'serverPathOrUrl is required' 
      });
    }

    if (!mcpApp) {
      mcpApp = new MCPClientApp();
      await mcpApp.initialize();
    }

    await mcpApp.connectToMCPServer(serverPathOrUrl);
    isConnected = true;
    
    // Notify all connected clients
    io.emit('status', { 
      connected: true,
      message: `Connected to MCP server: ${serverPathOrUrl}`
    });
    
    Logger.success(`Connected to MCP server: ${serverPathOrUrl}`);
    res.json({ 
      success: true, 
      message: `Connected to MCP server: ${serverPathOrUrl}` 
    });
  } catch (error) {
    Logger.error('Failed to connect to MCP server:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Process query
app.post('/api/query', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ 
        success: false, 
        error: 'query is required' 
      });
    }

    if (!mcpApp) {
      return res.status(400).json({ 
        success: false, 
        error: 'MCP client not initialized. Please initialize first.' 
      });
    }

    if (!isConnected) {
      return res.status(400).json({ 
        success: false, 
        error: 'Not connected to MCP server. Please connect first.' 
      });
    }

    // Send initial response
    res.json({ 
      success: true, 
      message: 'Query received, processing...',
      queryId: Date.now().toString()
    });

    // Process query asynchronously and stream results via WebSocket
    const queryId = Date.now().toString();
    
    try {
      const response = await mcpApp.processQuery(query);
      
      // Debug: Log the response to see the actual format
      Logger.info(`AI Response received: ${response.aiResponse.substring(0, 200)}...`);
      Logger.info(`Tool results count: ${response.toolResults.length}`);
      
      // Check if response contains image data from tool results
      let imageData = null;
      let textContent = response.aiResponse;
      
      // Look for image data in tool results
      for (const toolResult of response.toolResults) {
        try {
          // Try to parse as JSON first
          if (typeof toolResult === 'string' && toolResult.trim().startsWith('{')) {
            const toolResultJson = JSON.parse(toolResult);
            if (toolResultJson.type === 'image' && toolResultJson.data) {
              imageData = toolResultJson.data;
              Logger.info(`Found image data in tool result with ${imageData.length} characters`);
              break;
            }
          }
        } catch (e) {
          // If JSON parsing fails, try regex extraction
          const dataMatch = toolResult.match(/"data":"([^"]+)"/);
          if (dataMatch) {
            imageData = dataMatch[1];
            Logger.info(`Extracted image data with regex: ${imageData.length} characters`);
            break;
          }
        }
      }
      
      // If no image found in tool results, try other patterns
      if (!imageData) {
        // Pattern 1: {"type":"image","data":"base64data"}
        const imageMatch1 = response.aiResponse.match(/"type":"image","data":"([^"]+)"/);
        if (imageMatch1) {
          imageData = imageMatch1[1];
          textContent = response.aiResponse.replace(/"type":"image","data":"[^"]+"/, '').trim();
          Logger.info('Found image data with pattern 1');
        } else {
          // Pattern 2: Look for base64 data in the response
          const base64Match = response.aiResponse.match(/"data":"([A-Za-z0-9+/=]{100,})"/);
          if (base64Match) {
            imageData = base64Match[1];
            textContent = response.aiResponse.replace(/"data":"[A-Za-z0-9+/=]{100,}"/, '').trim();
            Logger.info('Found image data with pattern 2');
          }
        }
      }
      
      if (imageData) {
        // Save screenshot to downloads directory
        try {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const filename = `screenshot-${timestamp}.jpg`;
          const filepath = `./downloads/${filename}`;
          
          // Convert base64 to buffer and save
          const buffer = Buffer.from(imageData, 'base64');
          fs.writeFileSync(filepath, buffer);
          
          Logger.info(`Saved screenshot to: ${filepath}`);
          
          // Send image message with file info
          io.emit('queryResponse', {
            queryId,
            query,
            response: textContent,
            imageData: imageData,
            imageAlt: 'Screenshot from browser automation',
            savedFilename: filename,
            completed: true,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          Logger.error('Failed to save screenshot:', error);
          // Still send the image even if saving fails
          io.emit('queryResponse', {
            queryId,
            query,
            response: textContent,
            imageData: imageData,
            imageAlt: 'Screenshot from browser automation',
            completed: true,
            timestamp: new Date().toISOString()
          });
        }
      } else {
        // Send regular text response
        Logger.info('Sending text-only response');
        io.emit('queryResponse', {
          queryId,
          query,
          response: textContent,
          completed: true,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      io.emit('queryResponse', {
        queryId,
        query,
        error: error instanceof Error ? error.message : 'Unknown error',
        completed: true,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    Logger.error('Failed to process query:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Get configuration
app.get('/api/config', (req, res) => {
  try {
    const configManager = ConfigManager.getInstance();
    const config = configManager.getConfig();
    
    // Remove sensitive information
    const safeConfig = {
      aiProvider: config.aiProvider,
      model: config.openai?.model || config.claude?.model || config.ollama?.model || 'Unknown',
      maxTokens: 4000, // Default value
      temperature: 0.7, // Default value
      hasOpenAIKey: !!config.openai?.apiKey,
      hasClaudeKey: !!config.claude?.apiKey,
      ollamaUrl: config.ollama?.url
    };
    
    res.json({ success: true, config: safeConfig });
  } catch (error) {
    Logger.error('Failed to get configuration:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Download screenshot
app.get('/api/screenshot/:id', (req, res) => {
  try {
    const { id } = req.params;
    const screenshotPath = `./downloads/${id}`;
    
    if (fs.existsSync(screenshotPath)) {
      res.download(screenshotPath);
    } else {
      res.status(404).json({ error: 'Screenshot not found' });
    }
  } catch (error) {
    Logger.error('Failed to download screenshot:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// List screenshots
app.get('/api/screenshots', (req, res) => {
  try {
    if (!fs.existsSync('./downloads')) {
      return res.json({ screenshots: [] });
    }
    
    const files = fs.readdirSync('./downloads')
      .filter(file => /\.(jpg|jpeg|png)$/i.test(file))
      .map(file => ({
        name: file,
        path: `/api/screenshot/${file}`,
        size: fs.statSync(`./downloads/${file}`).size,
        created: fs.statSync(`./downloads/${file}`).birthtime
      }));
    
    res.json({ screenshots: files });
  } catch (error) {
    Logger.error('Failed to list screenshots:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Disconnect from MCP server
app.post('/api/disconnect', async (req, res) => {
  try {
    if (mcpApp) {
      await mcpApp.cleanup();
      mcpApp = null;
    }
    
    isConnected = false;
    
    // Notify all connected clients
    io.emit('status', { 
      connected: false,
      message: 'Disconnected from MCP server'
    });
    
    Logger.info('Disconnected from MCP server');
    res.json({ success: true, message: 'Disconnected from MCP server' });
  } catch (error) {
    Logger.error('Failed to disconnect:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile('web/client/build/index.html', { root: '.' });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  Logger.success(`Web server running on port ${PORT}`);
  Logger.info(`API available at http://localhost:${PORT}/api`);
  Logger.info(`Web interface available at http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  Logger.info('SIGTERM received, shutting down gracefully');
  if (mcpApp) {
    await mcpApp.cleanup();
  }
  server.close(() => {
    Logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  Logger.info('SIGINT received, shutting down gracefully');
  if (mcpApp) {
    await mcpApp.cleanup();
  }
  server.close(() => {
    Logger.info('Server closed');
    process.exit(0);
  });
}); 