import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import ChatInterface from './components/ChatInterface.tsx';
import ConnectionPanel from './components/ConnectionPanel.tsx';
import StatusBar from './components/StatusBar.tsx';
import ScreenshotGallery from './components/ScreenshotGallery.tsx';
import { Message, ConnectionStatus } from './types/index.ts';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    message: 'Not connected to MCP server'
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showScreenshotGallery, setShowScreenshotGallery] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(API_BASE_URL);
    setSocket(newSocket);

    // Socket event listeners
    newSocket.on('status', (status: ConnectionStatus) => {
      setConnectionStatus(status);
    });

    newSocket.on('queryResponse', (data: any) => {
      if (data.error) {
        setMessages(prev => [...prev, {
          id: data.queryId,
          type: 'error',
          content: data.error,
          timestamp: data.timestamp
        }]);
      } else if (data.imageData) {
        // Handle image response
        setMessages(prev => [...prev, {
          id: data.queryId,
          type: 'image',
          content: data.response,
          imageData: data.imageData,
          imageAlt: data.imageAlt || 'Screenshot',
          savedFilename: data.savedFilename,
          timestamp: data.timestamp
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: data.queryId,
          type: 'assistant',
          content: data.response,
          timestamp: data.timestamp
        }]);
      }
      setIsLoading(false);
    });

    // Handle screenshot test events
    const handleScreenshotTest = (event: CustomEvent) => {
      sendMessage(event.detail);
    };

    window.addEventListener('screenshotTest', handleScreenshotTest as EventListener);

    return () => {
      newSocket.close();
      window.removeEventListener('screenshotTest', handleScreenshotTest as EventListener);
    };
  }, []);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const messageId = Date.now().toString();
    const newMessage: Message = {
      id: messageId,
      type: 'user',
      content,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newMessage]);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: content }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: `error-${messageId}`,
        type: 'error',
        content: error instanceof Error ? error.message : 'Failed to send message',
        timestamp: new Date().toISOString()
      }]);
      setIsLoading(false);
    }
  };

  const initializeClient = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/init`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to initialize MCP client');
      }

      const data = await response.json();
      if (data.success) {
        setMessages(prev => [...prev, {
          id: 'init-success',
          type: 'system',
          content: 'MCP client initialized successfully',
          timestamp: new Date().toISOString()
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: 'init-error',
        type: 'error',
        content: error instanceof Error ? error.message : 'Failed to initialize MCP client',
        timestamp: new Date().toISOString()
      }]);
    }
  };

  const connectToServer = async (serverPathOrUrl: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ serverPathOrUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to connect to MCP server');
      }

      const data = await response.json();
      if (data.success) {
        setMessages(prev => [...prev, {
          id: 'connect-success',
          type: 'system',
          content: `Connected to MCP server: ${serverPathOrUrl}`,
          timestamp: new Date().toISOString()
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: 'connect-error',
        type: 'error',
        content: error instanceof Error ? error.message : 'Failed to connect to MCP server',
        timestamp: new Date().toISOString()
      }]);
    }
  };

  const disconnectFromServer = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/disconnect`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect from MCP server');
      }

      const data = await response.json();
      if (data.success) {
        setMessages(prev => [...prev, {
          id: 'disconnect-success',
          type: 'system',
          content: 'Disconnected from MCP server',
          timestamp: new Date().toISOString()
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: 'disconnect-error',
        type: 'error',
        content: error instanceof Error ? error.message : 'Failed to disconnect from MCP server',
        timestamp: new Date().toISOString()
      }]);
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            MCP Client Web Interface
          </h1>
          <p className="text-gray-600">
            Test AI interactions and MCP server connections
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Connection Panel */}
          <div className="lg:col-span-1">
            <ConnectionPanel
              onInitialize={initializeClient}
              onConnect={connectToServer}
              onDisconnect={disconnectFromServer}
              connectionStatus={connectionStatus}
            />
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <ChatInterface
              messages={messages}
              onSendMessage={sendMessage}
              isLoading={isLoading}
              onClearMessages={clearMessages}
              isConnected={connectionStatus.connected}
            />
          </div>
        </div>

        {/* Status Bar */}
        <StatusBar 
          connectionStatus={connectionStatus}
          onOpenScreenshotGallery={() => setShowScreenshotGallery(true)}
        />
      </div>

      {/* Screenshot Gallery */}
      <ScreenshotGallery 
        isVisible={showScreenshotGallery}
        onClose={() => setShowScreenshotGallery(false)}
      />
    </div>
  );
}

export default App; 